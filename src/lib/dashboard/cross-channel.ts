/**
 * Queries cross-channel pro dashboard novo (Bento + Aquisição + Conversão).
 *
 * Tudo aqui é READ-ONLY. Combina Postgres (CRM) com GA4 (visitas) e SC (queries).
 *
 * Convenção de erros: tudo é wrapped em try/catch e retorna array vazio ou null
 * — assim a página renderiza mesmo com integração quebrada, com fallback visual
 * no caller.
 */

import { db, people, companies, meetings, statuses } from '@/db';
import { eq, and, isNull, sql, desc, gte, count } from 'drizzle-orm';
import { getTrafficByDay, getTrafficByChannel, getTrafficByDayAndChannel, getTopUtms, isGa4Configured } from '../ga4';
import { getSeoSummary, isSearchConsoleConfigured } from '../search-console';
import { getContactCountSince } from '../activecampaign';

/* -------------------------------------------------------------------------- */
/*  Atividade diária cruzada (visitas × forms × reuniões)                     */
/* -------------------------------------------------------------------------- */

export type DailyActivityPoint = {
  date: string;      // YYYY-MM-DD
  visitas: number;   // GA4 sessions
  forms: number;     // people.createdAt count
  reunioes: number;  // meetings.scheduledAt count
};

export async function getActivityByDay(days = 28): Promise<DailyActivityPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // GA4 visitas/dia
  const visitasByDay = isGa4Configured() ? await getTrafficByDay(days).catch(() => []) : [];
  const visitasMap = new Map(visitasByDay.map((v) => [v.date, v.sessions]));

  // Forms (people criados) por dia
  let formsRows: { date: string; n: number }[] = [];
  let meetRows: { date: string; n: number }[] = [];
  try {
    formsRows = await db
      .select({
        date: sql<string>`TO_CHAR(${people.createdAt} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(people)
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        gte(people.createdAt, since),
      ))
      .groupBy(sql`TO_CHAR(${people.createdAt} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')`);

    meetRows = await db
      .select({
        date: sql<string>`TO_CHAR(${meetings.scheduledAt} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(meetings)
      .where(gte(meetings.scheduledAt, since))
      .groupBy(sql`TO_CHAR(${meetings.scheduledAt} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')`);
  } catch (err) {
    console.error('[dashboard-queries] getActivityByDay db error:', err);
  }

  const formsMap = new Map(formsRows.map((r) => [r.date, r.n]));
  const meetMap = new Map(meetRows.map((r) => [r.date, r.n]));

  // Build full date range (mesmo dias sem dado mostram zero)
  const out: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().split('T')[0];
    out.push({
      date: iso,
      visitas: visitasMap.get(iso) ?? 0,
      forms: formsMap.get(iso) ?? 0,
      reunioes: meetMap.get(iso) ?? 0,
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Funil unificado cross-channel — com múltiplas origens                     */
/* -------------------------------------------------------------------------- */

/**
 * Origens que alimentam o topo do funil (cliques que viraram visitas).
 * Cada uma vem de uma fonte diferente — proxy quando a plataforma não expõe
 * "cliques" diretamente.
 */
export type FunnelSource = {
  key: string;        // 'seo' | 'linkedin' | 'manual' | 'pr' | 'outros'
  label: string;
  clicks: number;     // cliques REAIS quando temos (SEO via SC), proxy quando não (LinkedIn via UTM sessions)
  proxy: boolean;     // true se é proxy (LinkedIn sessions ≠ cliques reais)
};

export type FunnelStage = {
  key: 'cliques' | 'visitas' | 'forms_total' | 'forms_b2b' | 'mql' | 'reunioes' | 'fechados';
  label: string;
  help?: string;
  count: number;
};

export type UnifiedFunnelV2 = {
  sources: FunnelSource[];
  stages: FunnelStage[];
};

export async function getUnifiedFunnel(days = 30): Promise<UnifiedFunnelV2> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // --- Origens (cliques pra cada canal) ---
  const sources: FunnelSource[] = [];

  // SEO: cliques reais do Search Console
  if (isSearchConsoleConfigured()) {
    try {
      const seoSum = await getSeoSummary(days);
      if (seoSum) {
        sources.push({ key: 'seo', label: 'SEO orgânico', clicks: seoSum.clicks, proxy: false });
      }
    } catch { /* ignore */ }
  }

  // LinkedIn + Manual + Outros: proxy via GA4 (sessions com utm_source / channel)
  let liVisits = 0;
  let manualVisits = 0; // direct + utm_source=manual
  let outrosVisits = 0; // tudo que não é seo/linkedin/manual
  let totalVisits = 0;
  const visitsByChannel: Record<string, number> = {};
  if (isGa4Configured()) {
    try {
      const [channels, utms] = await Promise.all([
        getTrafficByChannel(days),
        getTopUtms(days, 50),
      ]);
      totalVisits = channels.reduce((a, c) => a + c.sessions, 0);
      for (const c of channels) {
        visitsByChannel[c.channel] = c.sessions;
      }

      // LinkedIn: via utm_source contendo 'linkedin' OU channel 'social'
      const liUtm = utms.filter((u) => u.source.toLowerCase().includes('linkedin')).reduce((a, u) => a + u.sessions, 0);
      const liChannel = channels.find((c) => c.channel.toLowerCase().includes('linkedin'))?.sessions ?? 0;
      liVisits = Math.max(liUtm, liChannel);

      // Manual: utm_source=manual OU direct
      const manualUtm = utms.filter((u) => u.source.toLowerCase() === 'manual').reduce((a, u) => a + u.sessions, 0);
      const directChannel = channels.find((c) => c.channel.toLowerCase().includes('direct'))?.sessions ?? 0;
      manualVisits = manualUtm + directChannel;

      outrosVisits = totalVisits - liVisits - manualVisits - (visitsByChannel['Organic Search'] ?? 0);
      if (outrosVisits < 0) outrosVisits = 0;
    } catch { /* ignore */ }
  }

  if (liVisits > 0) {
    sources.push({ key: 'linkedin', label: 'LinkedIn', clicks: liVisits, proxy: true });
  }
  if (manualVisits > 0) {
    sources.push({ key: 'manual', label: 'Manual / Direct', clicks: manualVisits, proxy: true });
  }
  if (outrosVisits > 0) {
    sources.push({ key: 'outros', label: 'Outros canais', clicks: outrosVisits, proxy: true });
  }

  // --- Stages do funil ---
  const totalCliques = sources.reduce((a, s) => a + s.clicks, 0);

  // Forms totais: AC tem TODOS (mesmo os não-B2B). CRM tem só B2B.
  let formsTotal = 0;
  try {
    formsTotal = await getContactCountSince(days);
  } catch { /* ignore */ }

  // Forms B2B = people no CRM (já filtrados na entrada)
  let formsB2b = 0;
  let mql = 0;
  let reunioes = 0;
  let fechados = 0;
  try {
    const [b2bRow, mqlRow, reuRow, fechRow] = await Promise.all([
      db.select({ n: count() }).from(people)
        .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since))),
      db.select({ n: count() }).from(people)
        .leftJoin(statuses, eq(people.statusId, statuses.id))
        .where(and(
          eq(people.archived, false),
          isNull(people.mergedIntoId),
          sql`${statuses.label} IN ('Quente', 'MQL', 'Líderes B2B')`,
          gte(people.createdAt, since),
        )),
      db.select({ n: count() }).from(meetings)
        .where(gte(meetings.scheduledAt, since)),
      db.select({ n: count() }).from(companies)
        .leftJoin(statuses, eq(companies.statusId, statuses.id))
        .where(and(sql`${statuses.label} = 'Fechado'`, gte(companies.updatedAt, since))),
    ]);
    formsB2b = b2bRow[0]?.n ?? 0;
    mql = mqlRow[0]?.n ?? 0;
    reunioes = reuRow[0]?.n ?? 0;
    fechados = fechRow[0]?.n ?? 0;
  } catch (err) {
    console.error('[dashboard-queries] getUnifiedFunnel db error:', err);
  }

  // Se AC retornou 0 mas temos B2B no CRM, AC provavelmente não tá configurado.
  // Garante consistência: formsTotal nunca menor que formsB2b.
  if (formsTotal < formsB2b) formsTotal = formsB2b;

  const stages: FunnelStage[] = [
    { key: 'cliques', label: 'Cliques totais', help: 'soma das origens', count: totalCliques },
    { key: 'visitas', label: 'Visitas no site', help: 'GA4 sessões', count: totalVisits },
    { key: 'forms_total', label: 'Forms preenchidos', help: 'todos no AC', count: formsTotal },
    { key: 'forms_b2b', label: 'Líderes B2B', help: 'qualificados pro CRM', count: formsB2b },
    { key: 'mql', label: 'MQL / Quente', count: mql },
    { key: 'reunioes', label: 'Reuniões', count: reunioes },
    { key: 'fechados', label: 'Fechados', count: fechados },
  ];

  return { sources, stages };
}

/* -------------------------------------------------------------------------- */
/*  Origem dos leads (donut) — utm_source / source_channel                    */
/* -------------------------------------------------------------------------- */

export type OriginSlice = { source: string; count: number };

export async function getLeadsByOrigin(days = 30): Promise<OriginSlice[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const rows = await db
      .select({ source: people.sourceChannel, n: count() })
      .from(people)
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        gte(people.createdAt, since),
      ))
      .groupBy(people.sourceChannel)
      .orderBy(desc(count()));
    return rows.map((r) => ({ source: r.source ?? 'unknown', count: r.n }));
  } catch (err) {
    console.error('[dashboard-queries] getLeadsByOrigin db error:', err);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Heatmap dia × hora — quando convertemos (forms preenchidos)               */
/* -------------------------------------------------------------------------- */

/**
 * Matriz 7×24 (linhas = dia da semana 0-Sun..6-Sat, colunas = hora 0-23).
 */
export async function getConversionHeatmap(days = 90): Promise<number[][]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  try {
    const rows = await db
      .select({
        dow: sql<number>`EXTRACT(DOW FROM ${people.createdAt} AT TIME ZONE 'America/Sao_Paulo')::int`,
        hour: sql<number>`EXTRACT(HOUR FROM ${people.createdAt} AT TIME ZONE 'America/Sao_Paulo')::int`,
        n: count(),
      })
      .from(people)
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        gte(people.createdAt, since),
      ))
      .groupBy(sql`EXTRACT(DOW FROM ${people.createdAt} AT TIME ZONE 'America/Sao_Paulo')`, sql`EXTRACT(HOUR FROM ${people.createdAt} AT TIME ZONE 'America/Sao_Paulo')`);

    for (const r of rows) {
      if (r.dow >= 0 && r.dow <= 6 && r.hour >= 0 && r.hour <= 23) {
        matrix[r.dow][r.hour] = r.n;
      }
    }
  } catch (err) {
    console.error('[dashboard-queries] getConversionHeatmap db error:', err);
  }
  return matrix;
}

/* -------------------------------------------------------------------------- */
/*  Stacked area: visitas por canal ao longo do tempo                         */
/* -------------------------------------------------------------------------- */

export type StackedPoint = { date: string } & Record<string, number | string>;

/**
 * GA4 não tem dimension date+channel barato no mesmo report sem custar muitas
 * queries. Estratégia: fetch por canal os top 5 e construir matriz simulada
 * proporcional ao distribuição agregada (aproximação suficiente pra visual).
 * Pra preciso-preciso, virar dimension multiqueryAttribution depois.
 *
 * NOTE: limit 5 canais pra não poluir. Outros vão pra "Outros".
 */
export async function getStackedTrafficByChannel(days = 28): Promise<{ data: StackedPoint[]; channels: string[] }> {
  if (!isGa4Configured()) return { data: [], channels: [] };

  try {
    const rows = await getTrafficByDayAndChannel(days);
    if (rows.length === 0) return { data: [], channels: [] };

    // Top 5 canais por sessions agregadas (resto vira "Outros")
    const totalByChannel = new Map<string, number>();
    for (const r of rows) {
      totalByChannel.set(r.channel, (totalByChannel.get(r.channel) ?? 0) + r.sessions);
    }
    const sorted = Array.from(totalByChannel.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(([c]) => c);
    const otherChannels = new Set(sorted.slice(5).map(([c]) => c));
    const hasOthers = otherChannels.size > 0;
    const channelNames = [...top5, ...(hasOthers ? ['Outros'] : [])];

    // Build matrix: date → channel → sessions
    const byDate = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (!byDate.has(r.date)) byDate.set(r.date, {});
      const bucket = r.channel === '' || otherChannels.has(r.channel) ? 'Outros' : r.channel;
      const entry = byDate.get(r.date)!;
      entry[bucket] = (entry[bucket] ?? 0) + r.sessions;
    }

    // Sort by date asc + fill missing channels with 0
    const data: StackedPoint[] = Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, channels]) => {
        const pt: StackedPoint = { date };
        for (const c of channelNames) pt[c] = channels[c] ?? 0;
        return pt;
      });

    return { data, channels: channelNames };
  } catch (err) {
    console.error('[dashboard-queries] getStackedTrafficByChannel error:', err);
    return { data: [], channels: [] };
  }
}

/* -------------------------------------------------------------------------- */
/*  Top canal snapshot (pro bento "Top canal da semana")                      */
/* -------------------------------------------------------------------------- */

export type TopChannelSnapshot = {
  channel: string;
  sessions: number;
  deltaPct: number | null; // vs período anterior
} | null;

export async function getTopCanalSnapshot(days = 7): Promise<TopChannelSnapshot> {
  if (!isGa4Configured()) return null;
  try {
    const [thisWeek, prevWeek] = await Promise.all([
      getTrafficByChannel(days),
      getTrafficByChannel(days * 2).then((rows) => rows.map((r) => ({ ...r, sessions: r.sessions / 2 }))),
    ]);
    if (thisWeek.length === 0) return null;
    const top = thisWeek[0];
    const prev = prevWeek.find((p) => p.channel === top.channel);
    const deltaPct = prev && prev.sessions > 0 ? ((top.sessions - prev.sessions) / prev.sessions) * 100 : null;
    return { channel: top.channel, sessions: top.sessions, deltaPct };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Last 5 leads (live feed pro bento)                                        */
/* -------------------------------------------------------------------------- */

export type LastLead = {
  id: string;
  name: string;
  email: string;
  source: string | null;
  statusLabel: string | null;
  statusColor: string | null;
  createdAt: Date;
  companyName: string | null;
};

export async function getLast5Leads(limit = 5): Promise<LastLead[]> {
  try {
    const rows = await db
      .select({
        id: people.id,
        name: people.name,
        email: people.email,
        source: people.sourceChannel,
        statusLabel: statuses.label,
        statusColor: statuses.color,
        createdAt: people.createdAt,
        companyName: companies.name,
      })
      .from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .leftJoin(companies, eq(people.companyId, companies.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
      .orderBy(desc(people.createdAt))
      .limit(limit);
    return rows;
  } catch (err) {
    console.error('[dashboard-queries] getLast5Leads error:', err);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  KPIs do bento (com sparkline 7d)                                          */
/* -------------------------------------------------------------------------- */

export type SnapshotKpi = {
  label: string;
  value: number;
  deltaPct: number | null;
  sparkline: number[];
};

export async function getBentoSnapshot(): Promise<{
  visitas: SnapshotKpi;
  forms: SnapshotKpi;
  reunioes: SnapshotKpi;
  topCanal: TopChannelSnapshot;
}> {
  const last14 = await getActivityByDay(14);
  const last7 = last14.slice(-7);
  const prev7 = last14.slice(0, 7);

  function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
  function pctDelta(now: number, prev: number) {
    if (prev === 0) return now > 0 ? 100 : null;
    return ((now - prev) / prev) * 100;
  }

  const visitas7 = last7.map((d) => d.visitas);
  const forms7 = last7.map((d) => d.forms);
  const reu7 = last7.map((d) => d.reunioes);

  return {
    visitas: {
      label: 'Visitas (7d)',
      value: sum(visitas7),
      deltaPct: pctDelta(sum(visitas7), sum(prev7.map((d) => d.visitas))),
      sparkline: visitas7,
    },
    forms: {
      label: 'Forms (7d)',
      value: sum(forms7),
      deltaPct: pctDelta(sum(forms7), sum(prev7.map((d) => d.forms))),
      sparkline: forms7,
    },
    reunioes: {
      label: 'Reuniões (7d)',
      value: sum(reu7),
      deltaPct: pctDelta(sum(reu7), sum(prev7.map((d) => d.reunioes))),
      sparkline: reu7,
    },
    topCanal: await getTopCanalSnapshot(7),
  };
}
