/**
 * CRM · Formulários — tabela única por pessoa.
 *
 * Mai/2026 ciclo 3.1: refatorado pra agrupar por PESSOA em vez de por
 * activity. Cada row mostra 1 pessoa com badges de TODOS os forms que ela
 * preencheu. Chips de filtro acima (Todos / Demo / Beta / Report / Proposta)
 * mais os filtros já existentes (período, segmento, status, canal, página).
 *
 * Pessoa não duplica: 1 row por person.id. Pessoa que preencheu Demo + Report
 * aparece 1 vez com 2 badges. Filtrar por Demo mostra essa pessoa; filtrar
 * por Report também. Filtrar por "Todos" mostra ela 1x.
 *
 * Filtros via URL searchParams. Server-side render. Suspense pros componentes
 * client que usam useSearchParams.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { db, activities, people, companies, statuses } from '@/db';
import { eq, desc, asc, and, like, gte, sql, type SQL } from 'drizzle-orm';
import { FormsList } from './forms-list';
import { FormsFilters } from './forms-filters';
import { getStatuses } from '@/lib/statuses';
import type { FormType, PersonRow } from './shared';
// re-export pra compat com código existente que importa de './page'
export type { FormType, PersonRow } from './shared';
export { FORM_LABELS } from './shared';

export const metadata: Metadata = {
  title: 'CRM · Formulários',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Params = {
  period: 'all' | '7d' | '30d' | '90d';
  segmento: 'all' | 'lider_b2b' | 'parceiro' | 'profissional_individual' | 'newsletter';
  formType: 'all' | FormType;
  statusId: string | null;
  canal: string | null;
  pagina: string | null;
  sortBy: 'lastFormAt' | 'name' | 'email';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: 20 | 50 | 100;
};

function parseParams(sp: Record<string, string | string[] | undefined>): Params {
  const period = sp.period as Params['period'] | undefined;
  const segmento = sp.segmento as Params['segmento'] | undefined;
  const formType = sp.formType as Params['formType'] | undefined;
  const statusId = typeof sp.statusId === 'string' && sp.statusId.length > 0 ? sp.statusId : null;
  const canal = typeof sp.canal === 'string' && sp.canal.length > 0 ? sp.canal : null;
  const pagina = typeof sp.pagina === 'string' && sp.pagina.length > 0 ? sp.pagina : null;
  const sortBy = (sp.sortBy as Params['sortBy']) ?? 'lastFormAt';
  const sortDir = (sp.sortDir as Params['sortDir']) ?? 'desc';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);
  const pageSize = ([20, 50, 100].includes(Number(sp.pageSize)) ? Number(sp.pageSize) : 20) as Params['pageSize'];
  const validFormTypes: Array<Params['formType']> = ['all', 'form_submit_demo', 'form_submit_beta', 'form_submit_report', 'form_submit_proposta'];
  return {
    period: ['all', '7d', '30d', '90d'].includes(period as string) ? (period as Params['period']) : 'all',
    segmento: ['all', 'lider_b2b', 'parceiro', 'profissional_individual', 'newsletter'].includes(segmento as string)
      ? (segmento as Params['segmento']) : 'all',
    formType: validFormTypes.includes(formType as Params['formType']) ? (formType as Params['formType']) : 'all',
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
 * Query principal: pega TODAS as activities form_submit_* + agrega por pessoa.
 * Filtros aplicados no SQL (segmento, status, canal, página, período).
 * Sort + paginação aplicados após o agrupamento em memória (pessoas únicas
 * — volume baixo justifica).
 *
 * Counts por form: contam pessoas distintas que preencheram cada form
 * (não total de submissões). Pessoa com 2x Report conta 1 em Report.
 */
async function getPeopleWithForms(params: Params): Promise<{
  rows: PersonRow[];
  countsByForm: Record<FormType, number>;
  totalPeople: number;
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

  const rawRows = await db
    .select({
      activityId: activities.id,
      createdAt: activities.createdAt,
      type: activities.type,
      personId: people.id,
      personName: people.name,
      personEmail: people.email,
      personJobTitle: people.jobTitle,
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
    .orderBy(desc(activities.createdAt))
    .limit(10000);

  // Agrega por person.id — pessoa com múltiplas activities form_submit_*
  // vira 1 row com lista única de forms preenchidos.
  const byPersonId = new Map<string, PersonRow>();
  for (const row of rawRows) {
    if (!row.personId) continue;
    const ft = row.type as FormType;
    const existing = byPersonId.get(row.personId);
    if (existing) {
      if (!existing.forms.includes(ft)) existing.forms.push(ft);
      if (row.createdAt > existing.lastFormAt) existing.lastFormAt = row.createdAt;
      if (row.createdAt < existing.firstFormAt) existing.firstFormAt = row.createdAt;
    } else {
      byPersonId.set(row.personId, {
        person: {
          id: row.personId,
          name: row.personName ?? '',
          email: row.personEmail ?? '',
          jobTitle: row.personJobTitle ?? null,
          sourceChannel: row.personSourceChannel,
          sourcePage: row.personSourcePage,
          acTags: row.personAcTags as string[] | null,
          statusLabel: row.personStatusLabel ?? null,
          statusColor: row.personStatusColor ?? null,
          metadata: row.personMetadata as Record<string, unknown> | null,
        },
        company: row.companyId ? { id: row.companyId, name: row.companyName ?? '' } : null,
        forms: [ft],
        lastFormAt: row.createdAt,
        firstFormAt: row.createdAt,
      });
    }
  }

  // Counts por form (sobre TODAS as pessoas filtradas, antes do filtro de formType)
  const countsByForm: Record<FormType, number> = {
    form_submit_demo: 0, form_submit_beta: 0, form_submit_report: 0, form_submit_proposta: 0,
  };
  for (const r of byPersonId.values()) {
    for (const f of r.forms) if (countsByForm[f] !== undefined) countsByForm[f]++;
  }

  // Filtro por formType (aplicado APÓS o agrupamento, sobre lista única de pessoas)
  let people_ = Array.from(byPersonId.values());
  if (params.formType !== 'all') {
    people_ = people_.filter((r) => r.forms.includes(params.formType as FormType));
  }
  const totalPeople = people_.length;

  // Sort
  people_.sort((a, b) => {
    let cmp = 0;
    if (params.sortBy === 'name') cmp = a.person.name.localeCompare(b.person.name);
    else if (params.sortBy === 'email') cmp = a.person.email.localeCompare(b.person.email);
    else cmp = a.lastFormAt.getTime() - b.lastFormAt.getTime();
    return params.sortDir === 'asc' ? cmp : -cmp;
  });

  // Paginação
  const offset = (params.page - 1) * params.pageSize;
  const paged = people_.slice(offset, offset + params.pageSize);

  return { rows: paged, countsByForm, totalPeople };
}

async function getFilterOptions(): Promise<{ channels: string[]; pages: string[] }> {
  const [chanRows, pageRows] = await Promise.all([
    db.selectDistinct({ v: people.sourceChannel }).from(people),
    db.selectDistinct({ v: people.sourcePage }).from(people),
  ]);
  const channels = chanRows
    .map((r) => r.v)
    .filter((v): v is NonNullable<typeof v> => v !== null && v !== 'unknown')
    .map((v) => v as string)
    .sort();
  const pages = pageRows
    .map((r) => r.v)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .sort();
  return { channels, pages };
}

export default async function CrmFormsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const params = parseParams(sp);

  let rows: PersonRow[] = [];
  let countsByForm: Record<FormType, number> = {
    form_submit_demo: 0, form_submit_beta: 0, form_submit_report: 0, form_submit_proposta: 0,
  };
  let totalPeople = 0;
  let dbError: string | null = null;
  let personStatuses: Array<{ id: string; label: string; color: string | null }> = [];
  let filterOptions: { channels: string[]; pages: string[] } = { channels: [], pages: [] };

  try {
    const [result, statusesData, options] = await Promise.all([
      getPeopleWithForms(params),
      getStatuses('person'),
      getFilterOptions(),
    ]);
    rows = result.rows;
    countsByForm = result.countsByForm;
    totalPeople = result.totalPeople;
    personStatuses = statusesData.map((s) => ({ id: s.id, label: s.label, color: s.color }));
    filterOptions = options;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const totalPages = Math.max(1, Math.ceil(totalPeople / params.pageSize));

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Formulários</h1>
          <p className="crm-subtitle">
            Todos os respondentes do site · {totalPeople} pessoas {params.formType !== 'all' || params.segmento !== 'all' ? '(filtrado)' : ''}
          </p>
        </div>
      </div>

      <Suspense fallback={<div style={{ height: 60, marginBottom: 16, background: '#FAF7FF', borderRadius: 10 }} />}>
        <FormsFilters
          statuses={personStatuses}
          channels={filterOptions.channels}
          pages={filterOptions.pages}
          countsByForm={countsByForm}
        />
      </Suspense>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>{dbError}</p>
        </div>
      ) : (
        <FormsList
          rows={rows}
          totalPeople={totalPeople}
          totalPages={totalPages}
          currentPage={params.page}
        />
      )}
    </div>
  );
}
