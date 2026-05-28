/**
 * GA4 — engajamento por pessoa (via client_id).
 *
 * Usa a Analytics Data API filtrando pela dimensão `clientId` pra puxar
 * tudo que o GA4 sabe daquela pessoa específica (cruzando com o
 * `ga4_client_id` que salvamos no submit do form).
 *
 * Resultado alimenta:
 *   - Aba "Engajamento" do perfil do lead (sessões totais, primeira/última
 *     visita, top páginas)
 *   - Sessões inline na timeline da pessoa (uma entrada por dia visitado)
 *
 * Limites:
 *   - Só funciona pra pessoas que deram consent (granted) — sem cookie
 *     `_ga`, não temos client_id pra cruzar
 *   - Client_id é per-browser: mesma pessoa no celular + desktop = 2 IDs
 *     diferentes (sem cross-device matching nativo)
 *   - GA4 retém raw events só por 14 meses no plano free (data retention
 *     setting). Janelas mais longas viram dado agregado sem clientId.
 */

import { runReportPublic, EXCLUDE_INTERNAL_DIMENSION_FILTER } from './ga4';

export type Ga4PersonDailyVisit = {
  date: string;         // YYYY-MM-DD
  sessions: number;
  pageViews: number;
  pages: string[];      // páginas distintas vistas nesse dia
};

export type Ga4PersonTopPage = {
  page: string;
  pageViews: number;
};

export type Ga4PersonEngagement = {
  totalSessions: number;
  totalPageViews: number;
  firstSeen: string | null;  // YYYY-MM-DD
  lastSeen: string | null;
  topPages: Ga4PersonTopPage[];
  dailyVisits: Ga4PersonDailyVisit[];
};

/**
 * Puxa engajamento de uma pessoa específica via GA4 client_id.
 *
 * Janela default: últimos 90 dias (suficiente pro perfil do lead sem
 * estourar quota). Pra pessoas com longa relação, dá pra estender pra
 * 365d, mas raw events GA4 só vão até 14 meses.
 *
 * Retorna null se GA4 não tá configurado, client_id ausente, ou sem
 * dado no período (não confunde com erro — chamador trata os 3 casos
 * como "sem engajamento mensurado pelo GA4").
 *
 * @param clientId   — formato `<random>.<firstSeenTs>` (já sem prefixo GA1)
 * @param days       — janela em dias (default 90)
 */
export async function getEngagementByClientId(
  clientId: string,
  days = 90,
): Promise<Ga4PersonEngagement | null> {
  if (!clientId) return null;

  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
  const clientIdFilter = {
    andGroup: {
      expressions: [
        EXCLUDE_INTERNAL_DIMENSION_FILTER,
        {
          filter: {
            fieldName: 'clientId',
            stringFilter: { matchType: 'EXACT', value: clientId, caseSensitive: false },
          },
        },
      ],
    },
  };

  // Query 1: agregados + top pages
  const summary = await runReportPublic({
    dateRanges,
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: '100',
    dimensionFilter: clientIdFilter,
  });

  if (!summary?.rows || summary.rows.length === 0) return null;

  let totalSessions = 0;
  let totalPageViews = 0;
  const topPages: Ga4PersonTopPage[] = [];
  for (const row of summary.rows) {
    const page = row.dimensionValues[0]?.value ?? '/';
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const pv = parseInt(row.metricValues[1]?.value ?? '0', 10);
    totalSessions += sessions;
    totalPageViews += pv;
    topPages.push({ page, pageViews: pv });
  }
  // GA4 conta a mesma sessão em N linhas (uma por página visitada nessa
  // sessão), então `totalSessions` aqui infla. Pegamos sessions ÚNICAS
  // via query separada sem dimensão pagePath logo abaixo.
  const sessionTotal = await runReportPublic({
    dateRanges,
    metrics: [{ name: 'sessions' }],
    dimensionFilter: clientIdFilter,
  });
  const realSessions = sessionTotal?.rows?.[0]?.metricValues?.[0]?.value
    ?? sessionTotal?.totals?.[0]?.metricValues?.[0]?.value
    ?? '0';
  totalSessions = parseInt(realSessions, 10);

  // Query 2: série diária
  const daily = await runReportPublic({
    dateRanges,
    dimensions: [{ name: 'date' }, { name: 'pagePath' }],
    metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '5000',
    dimensionFilter: clientIdFilter,
  });

  const dailyMap = new Map<string, { sessions: number; pageViews: number; pages: Set<string> }>();
  for (const row of daily?.rows ?? []) {
    const dateRaw = row.dimensionValues[0]?.value ?? '';
    const date = dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : dateRaw;
    const page = row.dimensionValues[1]?.value ?? '/';
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const pv = parseInt(row.metricValues[1]?.value ?? '0', 10);

    const existing = dailyMap.get(date);
    if (existing) {
      existing.pageViews += pv;
      existing.pages.add(page);
      // sessions: o GA4 conta a mesma sessão em cada linha de pagePath,
      // então pra evitar duplicação por dia usamos `max` em vez de sum.
      // (aproximação razoável — uma pessoa raramente tem 2+ sessões no
      // mesmo dia visitando páginas DIFERENTES sem overlap.)
      existing.sessions = Math.max(existing.sessions, sessions);
    } else {
      dailyMap.set(date, { sessions, pageViews: pv, pages: new Set([page]) });
    }
  }

  const dailyVisits: Ga4PersonDailyVisit[] = Array.from(dailyMap.entries())
    .map(([date, v]) => ({
      date,
      sessions: v.sessions,
      pageViews: v.pageViews,
      pages: Array.from(v.pages),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const firstSeen = dailyVisits[0]?.date ?? null;
  const lastSeen = dailyVisits[dailyVisits.length - 1]?.date ?? null;

  return {
    totalSessions,
    totalPageViews,
    firstSeen,
    lastSeen,
    topPages: topPages.slice(0, 10),
    dailyVisits,
  };
}
