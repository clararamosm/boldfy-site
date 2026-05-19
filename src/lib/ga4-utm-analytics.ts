/**
 * GA4 — analytics detalhados por UTM (batched query).
 *
 * Faz UMA query batched que pega TODOS os UTMs com tráfego no período,
 * dimensionado por dia. Cliente filtra/agrupa por link individual.
 *
 * Use isso pra mostrar 3 boxes (sessões, usuários únicos, % engajamento)
 * + bar chart diário em UtmLinkCard. Evita 1 query por link (custo
 * proibitivo: 200 links × N campanhas).
 *
 * Limite GA4: dataset máximo ~250k linhas por response. Pra 200 UTMs
 * × 365 dias = 73k linhas no pior caso, cabe folgado.
 *
 * NOTA sobre matching: GA4 retorna os valores literais do utm (case-
 * sensitive). Nosso DB já slugifica via slug() — então a key de match
 * é `slug(source)|slug(medium)|slug(campaign)`. Quem busca usa o helper
 * `analyticsKey()` exportado abaixo.
 */

import { runReportPublic, EXCLUDE_INTERNAL_DIMENSION_FILTER } from './ga4';
import { slug } from './utm';

export type UtmDailyPoint = { date: string; sessions: number; users: number };
export type UtmAnalytics = {
  totals: {
    sessions: number;
    users: number;
    engagedSessions: number;
    engagementRate: number; // 0-1
  };
  daily: UtmDailyPoint[];
};

/** Constrói a chave canônica usada no Map retornado por getUtmAnalyticsBatch. */
export function analyticsKey(source: string, medium: string, campaign: string): string {
  return `${slug(source)}|${slug(medium)}|${slug(campaign)}`;
}

/**
 * Filtra o `daily` pra incluir só pontos a partir de uma data específica
 * (útil pra mostrar série "desde criação do link" quando o batch vai
 * mais pra trás).
 */
export function filterDailyFrom(daily: UtmDailyPoint[], sinceDate: Date): UtmDailyPoint[] {
  const cutoff = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return daily.filter((d) => d.date >= cutoff);
}

/**
 * Agrega totals a partir do `daily` filtrado — útil quando você quer os
 * agregados "desde createdAt do link" e não "do dataset inteiro".
 */
export function aggregateDaily(daily: UtmDailyPoint[]): { sessions: number; users: number } {
  let sessions = 0;
  let users = 0;
  for (const d of daily) {
    sessions += d.sessions;
    users += d.users;
  }
  return { sessions, users };
}

/**
 * Batched fetch — 1 query GA4 cobrindo todos os UTMs com tráfego desde
 * `sinceDate` (cap em 365 dias pra evitar abuse).
 *
 * Retorna `Map<analyticsKey, UtmAnalytics>`. Chaves ausentes = sem dado
 * (zero sessões no período).
 */
export async function getUtmAnalyticsBatch(sinceDate: Date): Promise<Map<string, UtmAnalytics>> {
  const now = new Date();
  const maxAgoMs = 365 * 24 * 60 * 60 * 1000;
  const effectiveSince = sinceDate.getTime() < now.getTime() - maxAgoMs
    ? new Date(now.getTime() - maxAgoMs)
    : sinceDate;
  const startDate = effectiveSince.toISOString().split('T')[0]; // YYYY-MM-DD

  const report = await runReportPublic({
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
      { name: 'sessionCampaignName' },
      { name: 'date' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'engagedSessions' },
    ],
    limit: '100000',
    dimensionFilter: EXCLUDE_INTERNAL_DIMENSION_FILTER,
  });
  if (!report?.rows) return new Map();

  // Acumula por chave canônica
  type Acc = {
    daily: Map<string, UtmDailyPoint>;
    totals: { sessions: number; users: number; engagedSessions: number };
  };
  const byKey = new Map<string, Acc>();

  for (const row of report.rows) {
    const source = row.dimensionValues[0]?.value ?? '(direct)';
    const medium = row.dimensionValues[1]?.value ?? '(none)';
    const campaign = row.dimensionValues[2]?.value ?? '(not set)';
    const dateRaw = row.dimensionValues[3]?.value ?? '';
    // GA4 retorna YYYYMMDD — converte pra YYYY-MM-DD
    const date = dateRaw.length === 8 ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}` : dateRaw;

    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const users = parseInt(row.metricValues[1]?.value ?? '0', 10);
    const engaged = parseInt(row.metricValues[2]?.value ?? '0', 10);

    const key = analyticsKey(source, medium, campaign);
    let acc = byKey.get(key);
    if (!acc) {
      acc = { daily: new Map(), totals: { sessions: 0, users: 0, engagedSessions: 0 } };
      byKey.set(key, acc);
    }

    acc.totals.sessions += sessions;
    acc.totals.users += users;
    acc.totals.engagedSessions += engaged;

    const existingDaily = acc.daily.get(date);
    if (existingDaily) {
      existingDaily.sessions += sessions;
      existingDaily.users += users;
    } else {
      acc.daily.set(date, { date, sessions, users });
    }
  }

  // Converte cada Acc num UtmAnalytics ordenado por data
  const result = new Map<string, UtmAnalytics>();
  for (const [key, acc] of byKey) {
    const dailySorted = Array.from(acc.daily.values()).sort((a, b) => a.date.localeCompare(b.date));
    const engagementRate = acc.totals.sessions > 0 ? acc.totals.engagedSessions / acc.totals.sessions : 0;
    result.set(key, {
      totals: { ...acc.totals, engagementRate },
      daily: dailySorted,
    });
  }
  return result;
}

/** Para link específico: usa analyticsKey e filtra daily desde a criação. */
export function analyticsForLink(
  batch: Map<string, UtmAnalytics>,
  link: { utmSource: string; utmMedium: string; utmCampaign: string; createdAt: Date | string },
): UtmAnalytics | null {
  const key = analyticsKey(link.utmSource, link.utmMedium, link.utmCampaign);
  const full = batch.get(key);
  if (!full) return null;

  const createdAt = typeof link.createdAt === 'string' ? new Date(link.createdAt) : link.createdAt;
  const daily = filterDailyFrom(full.daily, createdAt);
  const { sessions, users } = aggregateDaily(daily);
  // engagementRate "desde createdAt" não é trivial sem ter engagedSessions
  // por dia (não pedimos no schema atual pra reduzir custo). Usamos a taxa
  // do dataset inteiro como proxy — válido enquanto não há mudança de
  // comportamento drástica entre o pre-criação e post-criação.
  return {
    totals: { sessions, users, engagedSessions: 0, engagementRate: full.totals.engagementRate },
    daily,
  };
}
