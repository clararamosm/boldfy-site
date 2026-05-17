/**
 * Queries de conversão/funil pro dashboard.
 *
 * READ-ONLY. Foco em entender onde os leads emperram, qual canal traz lead
 * melhor, e velocidade por estágio.
 */

import { db, people, statuses } from '@/db';
import { eq, and, isNull, sql, desc, gte, count } from 'drizzle-orm';
import { isGa4Configured } from '../ga4';

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
    // Use make_interval pra parametrizar safely — sql.raw em INTERVAL com aspas dava
    // problema de serialização no Drizzle (causa de 500 em runtime).
    const rows = await db.execute(sql`
      WITH leads AS (
        SELECT
          p.id,
          DATE_TRUNC('month', p.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS cohort_month,
          p.created_at
        FROM people p
        WHERE p.archived = FALSE
          AND p.merged_into_id IS NULL
          AND p.created_at >= NOW() - make_interval(months => ${monthsBack})
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
