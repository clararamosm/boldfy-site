/**
 * Queries de conversão pro dashboard.
 *
 * READ-ONLY. Hoje só serve a aba /forms — taxa de conversão (CVR) por form.
 *
 * Histórico: arquivo tinha 7 queries (sankey, stuck leads, score, velocity,
 * cohort, timePerStage, formCvr) pro Funil B2B. Aba foi deletada — sobrou só
 * a query usada pela /forms.
 */

import { db, people } from '@/db';
import { eq, and, isNull, gte, count } from 'drizzle-orm';
import { isGa4Configured } from '../ga4';

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
      const { getTopPages } = await import('../ga4');
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
