/**
 * CRM · Formulários — universo expandido (todos os segmentos).
 *
 * Mai/2026 ciclo 3: gate B2B removido, mostra todos os 160 leads do AC.
 * Filtros via URL searchParams (?period=&segmento=&status=&canal=&pagina=
 * &sortBy=&sortDir=&page=&pageSize=). Server-side render. Suspense pros
 * componentes client que usam useSearchParams (regra RSC #3).
 *
 * Pessoas em múltiplos forms aparecem em múltiplas sublistas — query agrupa
 * por activity type, então um lead com 3 forms gera 3 rows em sublistas
 * diferentes.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { db, activities, people, companies, statuses } from '@/db';
import { eq, desc, asc, and, like, gte, sql, inArray, type SQL } from 'drizzle-orm';
import { FormsList } from './forms-list';
import { FormsFilters } from './forms-filters';
import { getStatuses } from '@/lib/statuses';

export const metadata: Metadata = {
  title: 'CRM · Formulários',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export type FormType = 'form_submit_demo' | 'form_submit_beta' | 'form_submit_report' | 'form_submit_proposta';

export type FormSubmission = {
  activityId: string;
  createdAt: Date;
  data: Record<string, unknown> | null;
  personMetadata: Record<string, unknown> | null;
  person: { id: string; name: string; email: string; sourceChannel: string | null; sourcePage: string | null; acTags: string[] | null; statusLabel: string | null; statusColor: string | null } | null;
  company: { id: string; name: string } | null;
};

type Params = {
  period: 'all' | '7d' | '30d' | '90d';
  segmento: 'all' | 'lider_b2b' | 'parceiro' | 'profissional_individual' | 'newsletter';
  statusId: string | null;
  canal: string | null;
  pagina: string | null;
  sortBy: 'createdAt' | 'name' | 'email';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: 20 | 50 | 100;
};

function parseParams(sp: Record<string, string | string[] | undefined>): Params {
  const period = sp.period as Params['period'] | undefined;
  const segmento = sp.segmento as Params['segmento'] | undefined;
  const statusId = typeof sp.statusId === 'string' && sp.statusId.length > 0 ? sp.statusId : null;
  const canal = typeof sp.canal === 'string' && sp.canal.length > 0 ? sp.canal : null;
  const pagina = typeof sp.pagina === 'string' && sp.pagina.length > 0 ? sp.pagina : null;
  const sortBy = (sp.sortBy as Params['sortBy']) ?? 'createdAt';
  const sortDir = (sp.sortDir as Params['sortDir']) ?? 'desc';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);
  const pageSize = ([20, 50, 100].includes(Number(sp.pageSize)) ? Number(sp.pageSize) : 20) as Params['pageSize'];
  return {
    period: ['all', '7d', '30d', '90d'].includes(period as string) ? (period as Params['period']) : 'all',
    segmento: ['all', 'lider_b2b', 'parceiro', 'profissional_individual', 'newsletter'].includes(segmento as string)
      ? (segmento as Params['segmento']) : 'all',
    statusId, canal, pagina, sortBy, sortDir, page, pageSize,
  };
}

const SEGMENT_TO_TAG: Record<Exclude<Params['segmento'], 'all'>, string> = {
  lider_b2b: 'Segmento: Líderes B2B',
  parceiro: 'Segmento: Parceiros estratégicos',
  profissional_individual: 'Segmento: Profissionais Individuais',
  newsletter: 'Segmento: Newsletter Boldfy',
};

function dateFilter(period: Params['period']): SQL | undefined {
  if (period === 'all') return undefined;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return gte(activities.createdAt, cutoff);
}

/**
 * Query unificada de submissões com TODOS os filtros aplicados no SQL.
 * Retorna agrupado por form type + total geral pra paginação.
 */
async function getSubmissionsFiltered(params: Params): Promise<{
  byForm: Record<FormType, FormSubmission[]>;
  counts: Record<FormType, number>;
  total: number;
}> {
  const filters: SQL[] = [like(activities.type, 'form_submit_%')];

  const dateF = dateFilter(params.period);
  if (dateF) filters.push(dateF);

  if (params.segmento !== 'all') {
    const tag = SEGMENT_TO_TAG[params.segmento];
    filters.push(sql`${tag} = ANY(${people.acTags})`);
  }

  if (params.statusId) filters.push(eq(people.statusId, params.statusId));
  if (params.canal) filters.push(eq(people.sourceChannel, params.canal as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown'));
  if (params.pagina) filters.push(eq(people.sourcePage, params.pagina));

  // Sort SQL — pra createdAt usa activities.createdAt; pra name/email usa people
  const sortCol = params.sortBy === 'name' ? people.name
    : params.sortBy === 'email' ? people.email
    : activities.createdAt;
  const sortFn = params.sortDir === 'asc' ? asc : desc;

  const rows = await db
    .select({
      activityId: activities.id,
      createdAt: activities.createdAt,
      type: activities.type,
      data: activities.data,
      personId: people.id,
      personName: people.name,
      personEmail: people.email,
      personMetadata: people.metadata,
      personSourceChannel: people.sourceChannel,
      personSourcePage: people.sourcePage,
      personAcTags: people.acTags,
      personStatusLabel: statuses.label,
      personStatusColor: statuses.color,
      companyId: companies.id,
      companyName: companies.name,
    })
    .from(activities)
    .leftJoin(people, eq(activities.personId, people.id))
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(...filters))
    .orderBy(sortFn(sortCol))
    .limit(5000); // teto absoluto antes de paginar em JS

  const allSubmissions: FormSubmission[] = rows.map((row) => ({
    activityId: row.activityId,
    createdAt: row.createdAt,
    data: row.data as Record<string, unknown> | null,
    personMetadata: row.personMetadata as Record<string, unknown> | null,
    person: row.personId ? {
      id: row.personId,
      name: row.personName ?? '',
      email: row.personEmail ?? '',
      sourceChannel: row.personSourceChannel,
      sourcePage: row.personSourcePage,
      acTags: row.personAcTags as string[] | null,
      statusLabel: row.personStatusLabel ?? null,
      statusColor: row.personStatusColor ?? null,
    } : null,
    company: row.companyId ? { id: row.companyId, name: row.companyName ?? '' } : null,
  }));

  // Group by form type + paginação por form
  const byForm: Record<FormType, FormSubmission[]> = {
    form_submit_demo: [],
    form_submit_beta: [],
    form_submit_report: [],
    form_submit_proposta: [],
  };
  const counts: Record<FormType, number> = {
    form_submit_demo: 0,
    form_submit_beta: 0,
    form_submit_report: 0,
    form_submit_proposta: 0,
  };

  for (const row of rows) {
    const t = row.type as FormType;
    if (!byForm[t]) continue;
    counts[t]++;
  }

  // Paginação aplicada por form (não global) — cada sublist tem own page state
  const offset = (params.page - 1) * params.pageSize;
  for (const row of allSubmissions) {
    const t = row.type as FormType;
    if (!byForm[t]) continue;
    byForm[t].push(row);
  }
  // Pra simplificar Fase 2: cada form mostra OS X primeiros após sort.
  // Paginação real por form viria via params nomeados (?demoPage=2). Por
  // enquanto o offset/pageSize aplica em CADA form independentemente.
  for (const t of Object.keys(byForm) as FormType[]) {
    byForm[t] = byForm[t].slice(offset, offset + params.pageSize);
  }

  return { byForm, counts, total: allSubmissions.length };
}

/**
 * Pega valores únicos pra popular dropdowns de filtros (canal, página).
 * Cacheada por request (não muda durante a sessão).
 */
async function getFilterOptions(): Promise<{ channels: string[]; pages: string[] }> {
  const [chanRows, pageRows] = await Promise.all([
    db.selectDistinct({ v: people.sourceChannel }).from(people),
    db.selectDistinct({ v: people.sourcePage }).from(people),
  ]);
  return {
    channels: chanRows.map((r) => r.v).filter((v): v is string => !!v && v !== 'unknown').sort(),
    pages: pageRows.map((r) => r.v).filter((v): v is string => !!v).sort(),
  };
}

export default async function CrmFormsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const params = parseParams(sp);

  let byForm: Record<FormType, FormSubmission[]> = {
    form_submit_demo: [],
    form_submit_beta: [],
    form_submit_report: [],
    form_submit_proposta: [],
  };
  let counts: Record<FormType, number> = {
    form_submit_demo: 0,
    form_submit_beta: 0,
    form_submit_report: 0,
    form_submit_proposta: 0,
  };
  let total = 0;
  let dbError: string | null = null;

  let personStatuses: Array<{ id: string; label: string; color: string | null }> = [];
  let filterOptions: { channels: string[]; pages: string[] } = { channels: [], pages: [] };

  try {
    const [result, statusesData, options] = await Promise.all([
      getSubmissionsFiltered(params),
      getStatuses('person'),
      getFilterOptions(),
    ]);
    byForm = result.byForm;
    counts = result.counts;
    total = result.total;
    personStatuses = statusesData.map((s) => ({ id: s.id, label: s.label, color: s.color }));
    filterOptions = options;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Formulários</h1>
          <p className="crm-subtitle">
            Todos os respondentes do site · {total} submissões {params.segmento !== 'all' ? '(filtrado)' : ''}
          </p>
        </div>
      </div>

      <Suspense fallback={<div style={{ height: 60, marginBottom: 16, background: '#FAF7FF', borderRadius: 10 }} />}>
        <FormsFilters
          statuses={personStatuses}
          channels={filterOptions.channels}
          pages={filterOptions.pages}
        />
      </Suspense>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>{dbError}</p>
        </div>
      ) : (
        <FormsList submissions={byForm} counts={counts} pageSize={params.pageSize} currentPage={params.page} />
      )}
    </div>
  );
}
