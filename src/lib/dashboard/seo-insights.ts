/**
 * Queries SEO de inteligência pro dashboard.
 *
 * READ-ONLY. Lê do Search Console (queries, posições, CTR) e cruza com
 * benchmarks pra detectar oportunidades de otimização.
 */

import { getTopQueries, getSeoByDay, type SeoQueryRow } from '../search-console';

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
