/**
 * GA4 — analytics detalhados por slug do Playbook TLG (batched query).
 *
 * Faz UMA query GA4 que pega TODAS as páginas `/playbook/...` com tráfego no
 * período, dimensionado por dia. Cliente filtra/agrupa por slug individual.
 *
 * Pattern espelha `ga4-utm-analytics.ts` (mai/2026 ciclo 3): 1 query batched
 * em vez de 1 query por slug (que seria proibitivo: dezenas/centenas de
 * playbooks gerados).
 *
 * Uso: aba Forms do dashboard interno mostra cada respondente do Playbook
 * com sessões + usuários únicos + gráfico expandable de acessos por dia.
 * Sinal comercial: se o mesmo slug acumula múltiplos usuários únicos, é
 * provável que o decisor compartilhou o link com o time (=> contato quente).
 *
 * Limite GA4: ~250k linhas por response. Pra 200 playbooks × 365 dias = 73k
 * linhas no pior caso, cabe folgado. Reusa o type `UtmAnalytics` pra dropar
 * direto no <MetricsBlock />.
 */

import { runReportPublic, EXCLUDE_INTERNAL_DIMENSION_FILTER } from '../ga4';
import type { UtmAnalytics, UtmDailyPoint } from '../ga4-utm-analytics';

const PLAYBOOK_PATH_PREFIX = '/playbook/';

/**
 * Filtra `daily` pra começar do `sinceDate` (YYYY-MM-DD inclusive).
 *
 * Helper exportado pro caller poder cortar a série por data de geração do
 * playbook (Bloco "acessos desde o submit"). Pareia com `aggregateDaily`.
 */
export function filterDailyFrom(daily: UtmDailyPoint[], sinceDate: Date): UtmDailyPoint[] {
  const cutoff = sinceDate.toISOString().split('T')[0];
  return daily.filter((d) => d.date >= cutoff);
}

/**
 * Agrega totals a partir de um `daily` recortado.
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
 * Batched fetch — 1 query GA4 cobrindo todos os slugs com tráfego desde
 * `sinceDate` (cap em 365 dias). Retorna `Map<slug, UtmAnalytics>`.
 *
 * Chaves ausentes no Map = zero sessões no período pra esse slug.
 *
 * Engagement rate vem do GA4 — útil pra detectar links abertos mas não lidos
 * (engagementRate baixo = abriu e fechou rápido; alto = leu, provavelmente
 * compartilhou).
 */
export async function getPlaybookAnalyticsBatch(
  sinceDate: Date,
): Promise<Map<string, UtmAnalytics>> {
  const now = new Date();
  const maxAgoMs = 365 * 24 * 60 * 60 * 1000;
  const effectiveSince =
    sinceDate.getTime() < now.getTime() - maxAgoMs
      ? new Date(now.getTime() - maxAgoMs)
      : sinceDate;
  const startDate = effectiveSince.toISOString().split('T')[0];

  const report = await runReportPublic({
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'engagedSessions' },
    ],
    // GA4 não suporta "startsWith" em dimensionFilter de forma uniforme em
    // todos os planos. Em vez disso, mantemos o filtro de exclusão interna
    // padrão e filtramos por prefixo no client (rows não-`/playbook/...`
    // são ignoradas no for loop).
    dimensionFilter: EXCLUDE_INTERNAL_DIMENSION_FILTER,
    limit: '100000',
  });
  if (!report?.rows) return new Map();

  type Acc = {
    daily: Map<string, UtmDailyPoint>;
    totals: { sessions: number; users: number; engagedSessions: number };
  };
  const bySlug = new Map<string, Acc>();

  for (const row of report.rows) {
    const pagePath = row.dimensionValues[0]?.value ?? '';
    if (!pagePath.startsWith(PLAYBOOK_PATH_PREFIX)) continue;

    // Slug = parte do path após /playbook/. Cortar trailing slash, query
    // string e fragmento pra não dispersar acessos do mesmo playbook em
    // múltiplas chaves quando o link vem com `?utm=...` ou `#anchor`.
    const rest = pagePath.slice(PLAYBOOK_PATH_PREFIX.length);
    const slug = rest.split(/[/?#]/)[0];
    if (!slug) continue;

    const dateRaw = row.dimensionValues[1]?.value ?? '';
    const date =
      dateRaw.length === 8
        ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
        : dateRaw;

    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const users = parseInt(row.metricValues[1]?.value ?? '0', 10);
    const engaged = parseInt(row.metricValues[2]?.value ?? '0', 10);

    let acc = bySlug.get(slug);
    if (!acc) {
      acc = {
        daily: new Map(),
        totals: { sessions: 0, users: 0, engagedSessions: 0 },
      };
      bySlug.set(slug, acc);
    }

    acc.totals.sessions += sessions;
    acc.totals.users += users;
    acc.totals.engagedSessions += engaged;

    const existing = acc.daily.get(date);
    if (existing) {
      existing.sessions += sessions;
      existing.users += users;
    } else {
      acc.daily.set(date, { date, sessions, users });
    }
  }

  // Converte cada Acc num UtmAnalytics ordenado por data.
  const result = new Map<string, UtmAnalytics>();
  for (const [slug, acc] of bySlug) {
    const dailySorted = Array.from(acc.daily.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const engagementRate =
      acc.totals.sessions > 0 ? acc.totals.engagedSessions / acc.totals.sessions : 0;
    result.set(slug, {
      totals: { ...acc.totals, engagementRate },
      daily: dailySorted,
    });
  }
  return result;
}

/**
 * Resolve analytics pra um slug específico, recortando o `daily` desde a
 * data de criação do playbook. Retorna null se o slug não tem dados.
 *
 * Útil pra mostrar "X sessões desde que o playbook foi gerado" em vez de
 * misturar dados pré-existência da página.
 */
export function analyticsForPlaybook(
  batch: Map<string, UtmAnalytics>,
  slug: string,
  createdAt: Date | string,
): UtmAnalytics | null {
  const entry = batch.get(slug);
  if (!entry) return null;

  const since = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const dailyFiltered = filterDailyFrom(entry.daily, since);
  const { sessions, users } = aggregateDaily(dailyFiltered);

  // engagement rate só faz sentido com o universo total — recalcular sem
  // o engagedSessions filtrado fica impreciso. Mantém a taxa do batch total.
  return {
    totals: {
      sessions,
      users,
      engagedSessions: entry.totals.engagedSessions,
      engagementRate: entry.totals.engagementRate,
    },
    daily: dailyFiltered,
  };
}
