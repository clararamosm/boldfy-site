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
import { getTrafficByDay, getTrafficByChannel, isGa4Configured } from './ga4';
import { getTopQueries, getSeoByDay, isSearchConsoleConfigured, type SeoQueryRow } from './search-console';

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
/*  Funil unificado cross-channel (sankey-friendly)                            */
/* -------------------------------------------------------------------------- */

export type UnifiedFunnelStage = {
  key: 'impressoes' | 'visitas' | 'forms' | 'mql' | 'reunioes' | 'fechados';
  label: string;
  count: number;
  bySource?: Record<string, number>; // breakdown por canal quando relevante
};

export async function getUnifiedFunnel(days = 30): Promise<UnifiedFunnelStage[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Stage 1: Impressões (SEO)
  let impressoes = 0;
  if (isSearchConsoleConfigured()) {
    try {
      const seo = await getSeoByDay(days);
      impressoes = seo.reduce((a, r) => a + r.impressions, 0);
    } catch { /* ignore */ }
  }

  // Stage 2: Visitas (GA4)
  let visitas = 0;
  const visitasBySource: Record<string, number> = {};
  if (isGa4Configured()) {
    try {
      const channels = await getTrafficByChannel(days);
      visitas = channels.reduce((a, c) => a + c.sessions, 0);
      for (const c of channels) {
        visitasBySource[c.channel] = c.sessions;
      }
    } catch { /* ignore */ }
  }

  // Stage 3-6: CRM
  let forms = 0, mql = 0, reunioes = 0, fechados = 0;
  const formsBySource: Record<string, number> = {};
  try {
    const formsRows = await db
      .select({ source: people.sourceChannel, n: count() })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
      .groupBy(people.sourceChannel);
    forms = formsRows.reduce((a, r) => a + r.n, 0);
    for (const r of formsRows) {
      formsBySource[r.source ?? 'unknown'] = r.n;
    }

    const [mqlRow] = await db
      .select({ n: count() })
      .from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        sql`${statuses.label} IN ('Quente', 'MQL', 'Líderes B2B')`,
        gte(people.createdAt, since),
      ));
    mql = mqlRow?.n ?? 0;

    const [reuRow] = await db
      .select({ n: count() })
      .from(meetings)
      .where(gte(meetings.scheduledAt, since));
    reunioes = reuRow?.n ?? 0;

    const [fechRow] = await db
      .select({ n: count() })
      .from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(and(sql`${statuses.label} = 'Fechado'`, gte(companies.updatedAt, since)));
    fechados = fechRow?.n ?? 0;
  } catch (err) {
    console.error('[dashboard-queries] getUnifiedFunnel db error:', err);
  }

  return [
    { key: 'impressoes', label: 'Impressões SEO', count: impressoes },
    { key: 'visitas', label: 'Visitas', count: visitas, bySource: visitasBySource },
    { key: 'forms', label: 'Forms preenchidos', count: forms, bySource: formsBySource },
    { key: 'mql', label: 'MQL / Quente', count: mql },
    { key: 'reunioes', label: 'Reuniões', count: reunioes },
    { key: 'fechados', label: 'Fechados', count: fechados },
  ];
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
    const [daily, channels] = await Promise.all([
      getTrafficByDay(days),
      getTrafficByChannel(days),
    ]);
    if (daily.length === 0 || channels.length === 0) return { data: [], channels: [] };

    const top5 = channels.slice(0, 5);
    const restTotal = channels.slice(5).reduce((a, c) => a + c.sessions, 0);
    const totalAll = channels.reduce((a, c) => a + c.sessions, 0) || 1;

    const channelNames = top5.map((c) => c.channel);
    if (restTotal > 0) channelNames.push('Outros');

    const data: StackedPoint[] = daily.map((d) => {
      const pt: StackedPoint = { date: d.date };
      for (const c of top5) {
        pt[c.channel] = Math.round((d.sessions * c.sessions) / totalAll);
      }
      if (restTotal > 0) pt['Outros'] = Math.round((d.sessions * restTotal) / totalAll);
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

/* -------------------------------------------------------------------------- */
/*  SEO insights                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Benchmark de CTR esperado por posição média (Google study agregado).
 * Se a query tem CTR substancialmente abaixo do benchmark, é oportunidade
 * de otimizar title/meta.
 */
const CTR_BENCHMARK_BY_POS: Record<number, number> = {
  1: 0.275, 2: 0.157, 3: 0.110, 4: 0.080, 5: 0.060,
  6: 0.045, 7: 0.035, 8: 0.028, 9: 0.024, 10: 0.020,
};

export type LowCtrQuery = SeoQueryRow & { expectedCtr: number; gap: number };

export async function getLowCtrForPosition(days = 28, minImpressions = 50): Promise<LowCtrQuery[]> {
  try {
    const queries = await getTopQueries(days, 100);
    return queries
      .filter((q) => q.position <= 10 && q.impressions >= minImpressions)
      .map((q) => {
        const pos = Math.round(q.position);
        const expected = CTR_BENCHMARK_BY_POS[pos] ?? 0.02;
        const gap = expected - q.ctr;
        return { ...q, expectedCtr: expected, gap };
      })
      .filter((q) => q.gap > 0.03) // pelo menos 3pp abaixo
      .sort((a, b) => b.gap * b.impressions - a.gap * a.impressions)
      .slice(0, 15);
  } catch {
    return [];
  }
}

/**
 * Queries com impressões altas mas posição > 30 — sem página dedicada (gaps).
 */
export async function getTopicGaps(days = 28, minImpressions = 30): Promise<SeoQueryRow[]> {
  try {
    const queries = await getTopQueries(days, 200);
    return queries
      .filter((q) => q.position > 30 && q.impressions >= minImpressions)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);
  } catch {
    return [];
  }
}

/**
 * Branded vs non-branded — série diária pra gráfico de linhas.
 */
export async function getBrandedVsNonBranded(days = 28): Promise<{ date: string; branded: number; nonBranded: number }[]> {
  // SC não tem filtro por query no daily endpoint, então fazemos 2 calls separadas
  // (uma com filter branded, outra non-branded). Pra simplificar e economizar quota,
  // vamos puxar TODAS as queries com data dimension via getSeoByDay no agregado e
  // estimar proporção branded/non-branded fixa. Pra precisão real, fazer 2 calls
  // com `dimensionFilterGroups: { filters: [{ dimension: 'query', operator: 'contains', expression: 'boldfy' }] }`.
  // Mantemos versão simples por enquanto.
  try {
    const [daily, topQueries] = await Promise.all([
      getSeoByDay(days),
      getTopQueries(days, 100),
    ]);
    const totalImpressions = topQueries.reduce((a, q) => a + q.impressions, 0) || 1;
    const brandedImpressions = topQueries
      .filter((q) => q.query.toLowerCase().includes('boldfy'))
      .reduce((a, q) => a + q.impressions, 0);
    const brandedShare = brandedImpressions / totalImpressions;

    return daily.map((d) => ({
      date: d.date,
      branded: Math.round(d.clicks * brandedShare),
      nonBranded: Math.round(d.clicks * (1 - brandedShare)),
    }));
  } catch {
    return [];
  }
}

/**
 * Scatter de queries: posição × impressões × cliques (bolha).
 */
export type ScatterPoint = { query: string; position: number; impressions: number; clicks: number };

export async function getQueriesScatter(days = 28, limit = 80): Promise<ScatterPoint[]> {
  try {
    const queries = await getTopQueries(days, limit);
    return queries
      .filter((q) => q.impressions > 0)
      .map((q) => ({ query: q.query, position: q.position, impressions: q.impressions, clicks: q.clicks }));
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Conversão insights                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Sankey source → status atual. Retorna pares com peso.
 */
export type SankeyEdge = { from: string; to: string; weight: number };

export async function getSourceToStatusSankey(): Promise<SankeyEdge[]> {
  try {
    const rows = await db
      .select({
        source: people.sourceChannel,
        status: statuses.label,
        n: count(),
      })
      .from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
      .groupBy(people.sourceChannel, statuses.label);

    return rows.map((r) => ({
      from: r.source ?? 'unknown',
      to: r.status ?? 'Sem status',
      weight: r.n,
    }));
  } catch (err) {
    console.error('[dashboard-queries] getSourceToStatusSankey error:', err);
    return [];
  }
}

/**
 * Leads parados — mais de N dias no mesmo status, ainda não terminal.
 */
export type StuckLead = {
  id: string;
  name: string;
  statusLabel: string;
  daysSinceUpdate: number;
  score: number;
};

export async function getStuckLeads(thresholdDays = 7): Promise<StuckLead[]> {
  const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
  try {
    const rows = await db
      .select({
        id: people.id,
        name: people.name,
        statusLabel: statuses.label,
        isTerminal: statuses.isTerminal,
        updatedAt: people.updatedAt,
        score: people.leadScore,
      })
      .from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        sql`${people.updatedAt} < ${threshold}`,
      ))
      .orderBy(desc(people.leadScore))
      .limit(30);

    return rows
      .filter((r) => !r.isTerminal && r.statusLabel)
      .map((r) => ({
        id: r.id,
        name: r.name,
        statusLabel: r.statusLabel ?? '—',
        daysSinceUpdate: Math.floor((Date.now() - new Date(r.updatedAt).getTime()) / (24 * 60 * 60 * 1000)),
        score: r.score,
      }));
  } catch {
    return [];
  }
}

/**
 * Score distribution por canal — pra mostrar qual canal traz lead melhor.
 */
export type ScoreByChannel = { channel: string; min: number; q1: number; median: number; q3: number; max: number; n: number };

export async function getScoreDistributionByChannel(): Promise<ScoreByChannel[]> {
  try {
    const rows = await db
      .select({
        channel: people.sourceChannel,
        scores: sql<number[]>`array_agg(${people.leadScore} ORDER BY ${people.leadScore})`,
      })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
      .groupBy(people.sourceChannel);

    const out: ScoreByChannel[] = [];
    for (const r of rows) {
      const scores = (r.scores ?? []).filter((s): s is number => typeof s === 'number');
      if (scores.length === 0) continue;
      const q = (p: number) => scores[Math.min(scores.length - 1, Math.floor(scores.length * p))];
      out.push({
        channel: (r.channel as string | null) ?? 'unknown',
        min: scores[0],
        q1: q(0.25),
        median: q(0.5),
        q3: q(0.75),
        max: scores[scores.length - 1],
        n: scores.length,
      });
    }
    return out.sort((a, b) => b.median - a.median);
  } catch {
    return [];
  }
}

/**
 * Velocidade por canal — tempo médio entre criação do lead e primeira reunião.
 */
export type VelocityByChannel = { channel: string; avgDays: number; n: number };

export async function getVelocityByChannel(): Promise<VelocityByChannel[]> {
  try {
    const rows = await db.execute(sql`
      SELECT
        p.source_channel AS channel,
        AVG(EXTRACT(EPOCH FROM (m.scheduled_at - p.created_at)) / 86400)::float AS avg_days,
        COUNT(*)::int AS n
      FROM people p
      INNER JOIN meetings m ON m.person_id = p.id
      WHERE p.archived = FALSE
      GROUP BY p.source_channel
      ORDER BY avg_days ASC
    `);
    return (rows.rows as Array<{ channel: string | null; avg_days: number; n: number }>)
      .map((r) => ({ channel: r.channel ?? 'unknown', avgDays: Number(r.avg_days), n: r.n }))
      .filter((r) => !isNaN(r.avgDays) && r.avgDays >= 0);
  } catch {
    return [];
  }
}

/**
 * Cohort retention: % de leads do mês X que viraram reunião em 7d / 14d / 30d.
 */
export type CohortRow = { month: string; total: number; reu7d: number; reu14d: number; reu30d: number };

export async function getCohortMatrix(monthsBack = 6): Promise<CohortRow[]> {
  try {
    const rows = await db.execute(sql`
      WITH leads AS (
        SELECT
          p.id,
          DATE_TRUNC('month', p.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS cohort_month,
          p.created_at
        FROM people p
        WHERE p.archived = FALSE
          AND p.merged_into_id IS NULL
          AND p.created_at >= NOW() - INTERVAL '${sql.raw(`${monthsBack} months`)}'
      ),
      meets AS (
        SELECT l.cohort_month,
               COUNT(DISTINCT l.id) FILTER (WHERE m.scheduled_at <= l.created_at + INTERVAL '7 days') AS reu7d,
               COUNT(DISTINCT l.id) FILTER (WHERE m.scheduled_at <= l.created_at + INTERVAL '14 days') AS reu14d,
               COUNT(DISTINCT l.id) FILTER (WHERE m.scheduled_at <= l.created_at + INTERVAL '30 days') AS reu30d,
               COUNT(DISTINCT l.id) AS total
        FROM leads l
        LEFT JOIN meetings m ON m.person_id = l.id
        GROUP BY l.cohort_month
      )
      SELECT
        TO_CHAR(cohort_month, 'YYYY-MM') AS month,
        total::int,
        reu7d::int,
        reu14d::int,
        reu30d::int
      FROM meets
      ORDER BY cohort_month DESC
    `);

    return (rows.rows as Array<{ month: string; total: number; reu7d: number; reu14d: number; reu30d: number }>);
  } catch (err) {
    console.error('[dashboard-queries] getCohortMatrix error:', err);
    return [];
  }
}

/**
 * Tempo médio entre stages (média dias por status_change).
 * Lê activities tipo 'status_change'.
 */
export type StageTime = { fromStatus: string; toStatus: string; avgDays: number; n: number };

export async function getTimePerStage(): Promise<StageTime[]> {
  try {
    const rows = await db.execute(sql`
      WITH ordered AS (
        SELECT
          a.person_id,
          a.created_at,
          a.data->>'from' AS from_status,
          a.data->>'to' AS to_status,
          LAG(a.created_at) OVER (PARTITION BY a.person_id ORDER BY a.created_at) AS prev_time
        FROM activities a
        WHERE a.type = 'status_change'
      )
      SELECT
        from_status,
        to_status,
        AVG(EXTRACT(EPOCH FROM (created_at - prev_time)) / 86400)::float AS avg_days,
        COUNT(*)::int AS n
      FROM ordered
      WHERE prev_time IS NOT NULL AND from_status IS NOT NULL AND to_status IS NOT NULL
      GROUP BY from_status, to_status
      HAVING COUNT(*) >= 2
      ORDER BY n DESC
      LIMIT 20
    `);
    return (rows.rows as Array<{ from_status: string; to_status: string; avg_days: number; n: number }>)
      .map((r) => ({
        fromStatus: r.from_status,
        toStatus: r.to_status,
        avgDays: Number(r.avg_days),
        n: r.n,
      }));
  } catch {
    return [];
  }
}

/**
 * Taxa de conversão por form (people.sourceMethod) — visitas relevantes (GA4
 * pageviews da page do form) ÷ submissões.
 */
export type FormCvr = { form: string; submissions: number; pageViews: number | null; cvr: number | null };

export async function getFormConversionRate(days = 30): Promise<FormCvr[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  let submissions: { method: string; n: number }[] = [];
  try {
    const rows = await db
      .select({ method: people.sourceMethod, n: count() })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
      .groupBy(people.sourceMethod);
    submissions = rows.map((r) => ({ method: r.method ?? 'manual', n: r.n }));
  } catch { /* ignore */ }

  // Map sourceMethod → page slug
  const methodToPage: Record<string, string> = {
    form_demo: '/agendar-demo',
    form_beta: '/beta-test',
    form_report: '/materiais/report-b2b',
    form_proposta: '/orcamento',
  };

  // GA4 pageviews por página (fetch barato — todas em 1 call via getTopPages)
  let pageViewsMap = new Map<string, number>();
  if (isGa4Configured()) {
    try {
      const { getTopPages } = await import('./ga4');
      const pages = await getTopPages(days, 50);
      pageViewsMap = new Map(pages.map((p) => [p.page, p.pageViews]));
    } catch { /* ignore */ }
  }

  return submissions
    .filter((s) => methodToPage[s.method])
    .map((s) => {
      const page = methodToPage[s.method];
      const pv = pageViewsMap.get(page) ?? null;
      const cvr = pv && pv > 0 ? (s.n / pv) * 100 : null;
      return { form: s.method.replace('form_', ''), submissions: s.n, pageViews: pv, cvr };
    })
    .sort((a, b) => b.submissions - a.submissions);
}
