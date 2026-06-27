/**
 * Queries do dashboard /internal/dashboard/state-tlg.
 *
 * Consome a view `state_tlg_aggregates` (criada na migration 0005) +
 * joins com playbook_outputs/people/companies pra agregados ricos.
 *
 * Threshold de publicação pública do State of Employee-Led Growth:
 * 100 respostas (decisão de spec — abaixo disso vira anedota estatística).
 *
 * Spec: source-of-truth/specs/playbook-team-led-growth.md §10.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/db';

/** Threshold pra publicação do State of TLG Report. */
export const STATE_TLG_PUBLISH_THRESHOLD = 100;

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                      */
/* -------------------------------------------------------------------------- */

export type AggregateRow = {
  dimension: string;
  value: string;
  count: number;
};

export type StateTlgSnapshot = {
  total: number;
  thresholdRemaining: number;
  progressPercent: number;
};

export type AggregateBucket = {
  value: string;
  label: string;
  count: number;
  percent: number;
};

export type LastResponder = {
  personId: string;
  personName: string;
  personEmail: string | null;
  companyName: string | null;
  industry: string | null;
  slug: string;
  templateKey: string;
  createdAt: Date;
};

export type WeeklyResponse = {
  weekStart: string; // 'YYYY-MM-DD'
  count: number;
};

/* -------------------------------------------------------------------------- */
/*  Mapas de label legível                                                    */
/* -------------------------------------------------------------------------- */

const AREA_LABEL: Record<string, string> = {
  marketing: 'Marketing',
  growth: 'Growth',
  vendas: 'Vendas',
  rh: 'RH / People',
  employer_branding: 'Employer Branding',
  comunicacao: 'Comunicação',
  outro: 'Outro',
};

const SENIORITY_LABEL: Record<string, string> = {
  analista: 'Analista',
  coordenador: 'Coordenador',
  gerente: 'Gerente',
  diretor: 'Diretor',
  c_level: 'C-Level',
};

const DOR_LABEL: Record<string, string> = {
  cac_subindo: 'CAC subindo',
  company_page_morta: 'Company Page morta',
  concorrente_dominando: 'Concorrente dominando',
  vendedor_invisivel: 'Vendedor invisível',
  talento_saindo: 'Talento saindo',
  marca_uma_pessoa: 'Marca de uma pessoa',
  outra: 'Outra',
};

const TENTATIVAS_LABEL: Record<string, string> = {
  nunca: 'Nunca tentaram',
  morreu: 'Tentaram e morreu',
  baixa_adesao: 'Baixa adesão',
  maduro: 'Programa maduro',
};

const BUDGET_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  planejando: 'Planejando',
  precisa_justificar: 'Precisa justificar',
  sem_budget: 'Sem budget',
};

const SPONSORSHIP_LABEL: Record<string, string> = {
  sim_alguns_postam: 'Sim, alguns já postam',
  sim_com_ajuda: 'Sim, com ajuda',
  talvez: 'Talvez',
  nao: 'Não',
};

/** Resolve label legível por dimensão. Fallback no value cru. */
export function labelForDimension(dimension: string, value: string): string {
  if (dimension === 'area') return AREA_LABEL[value] ?? value;
  if (dimension === 'seniority') return SENIORITY_LABEL[value] ?? value;
  if (dimension === 'dor_principal') return DOR_LABEL[value] ?? value;
  if (dimension === 'tentativas_anteriores') return TENTATIVAS_LABEL[value] ?? value;
  if (dimension === 'budget_status') return BUDGET_LABEL[value] ?? value;
  if (dimension === 'sponsorship_lideranca') return SPONSORSHIP_LABEL[value] ?? value;
  // industry e porte_faixa já vêm legíveis da view
  return value;
}

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Snapshot top-line: total de respostas, distância pro threshold, % de progresso.
 */
export async function getStateTlgSnapshot(): Promise<StateTlgSnapshot> {
  const result = await db.execute<AggregateRow>(sql`
    SELECT dimension, value, count FROM state_tlg_aggregates WHERE dimension = 'total' LIMIT 1
  `);
  const row = result.rows[0];
  const total = row ? Number(row.count) : 0;
  const thresholdRemaining = Math.max(0, STATE_TLG_PUBLISH_THRESHOLD - total);
  const progressPercent = Math.min(100, Math.round((total / STATE_TLG_PUBLISH_THRESHOLD) * 100));
  return { total, thresholdRemaining, progressPercent };
}

/**
 * Distribuição por dimensão. Retorna lista ordenada por count desc.
 *
 * Dimensões válidas: area, seniority, industry, dor_principal,
 * tentativas_anteriores, budget_status, sponsorship_lideranca, porte_faixa.
 */
export async function getAggregateByDimension(dimension: string): Promise<AggregateBucket[]> {
  const result = await db.execute<AggregateRow>(sql`
    SELECT dimension, value, count FROM state_tlg_aggregates
    WHERE dimension = ${dimension}
    ORDER BY count DESC
  `);
  const rows = result.rows;
  const total = rows.reduce((acc, r) => acc + Number(r.count), 0);
  if (total === 0) return [];
  return rows.map((r) => ({
    value: r.value,
    label: labelForDimension(dimension, r.value),
    count: Number(r.count),
    percent: Math.round((Number(r.count) / total) * 100),
  }));
}

/**
 * Últimos N respondentes com info de pessoa, empresa e setor. Cada linha
 * linka pro perfil em /internal/crm/people/[id].
 */
export async function getLastPlaybookOutputs(limit: number = 20): Promise<LastResponder[]> {
  const result = await db.execute<{
    person_id: string;
    person_name: string;
    person_email: string | null;
    company_name: string | null;
    industry: string | null;
    slug: string;
    template_key: string;
    created_at: Date;
  }>(sql`
    SELECT
      p.id           AS person_id,
      p.name         AS person_name,
      p.email        AS person_email,
      c.name         AS company_name,
      c.industry     AS industry,
      po.slug        AS slug,
      po.template_key AS template_key,
      po.created_at  AS created_at
    FROM playbook_outputs po
    JOIN people p     ON p.id = po.person_id
    LEFT JOIN companies c ON c.id = po.company_id
    ORDER BY po.created_at DESC
    LIMIT ${limit}
  `);
  return result.rows.map((r) => ({
    personId: r.person_id,
    personName: r.person_name,
    personEmail: r.person_email,
    companyName: r.company_name,
    industry: r.industry,
    slug: r.slug,
    templateKey: r.template_key,
    createdAt: new Date(r.created_at),
  }));
}

/**
 * Série temporal de respostas/semana (últimas N semanas).
 * Retorna array contínua (semanas sem submit aparecem com count=0).
 */
export async function getPlaybooksPorSemana(weeks: number = 12): Promise<WeeklyResponse[]> {
  const result = await db.execute<{ week_start: Date; count: number }>(sql`
    SELECT
      date_trunc('week', created_at)::date AS week_start,
      COUNT(*)::int AS count
    FROM playbook_outputs
    WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(weeks))} weeks'
    GROUP BY 1
    ORDER BY 1
  `);

  // Preenche semanas vazias pra série ficar contínua (sparkline esperaria isso)
  const map = new Map<string, number>();
  for (const r of result.rows) {
    const iso = new Date(r.week_start).toISOString().slice(0, 10);
    map.set(iso, Number(r.count));
  }
  const series: WeeklyResponse[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    // Início da semana (segunda — Postgres date_trunc('week') usa ISO)
    const day = d.getDay();
    const diff = (day + 6) % 7; // dias desde segunda
    d.setDate(d.getDate() - diff);
    const iso = d.toISOString().slice(0, 10);
    series.push({ weekStart: iso, count: map.get(iso) ?? 0 });
  }
  return series;
}
