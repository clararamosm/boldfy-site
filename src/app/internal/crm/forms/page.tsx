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
import { db, activities, people, companies, statuses, campaigns } from '@/db';
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
  // 'unsubscribed' é uma visão especial (não um form): lista TODOS os
  // descadastrados, mesmo quem nunca preencheu form. Lista de "não contatar".
  formType: 'all' | FormType | 'unsubscribed';
  /** Slug de campanha/evento (chip de evento). Filtra por campaign_memberships. */
  evento: string | null;
  statusId: string | null;
  canal: string | null;
  pagina: string | null;
  /** 'hide' (default): só ativos. 'show': inclui unsubscribed também. 'only': só unsubscribed. */
  unsubscribed: 'hide' | 'show' | 'only';
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
  const evento = typeof sp.evento === 'string' && sp.evento.length > 0 ? sp.evento : null;
  const canal = typeof sp.canal === 'string' && sp.canal.length > 0 ? sp.canal : null;
  const pagina = typeof sp.pagina === 'string' && sp.pagina.length > 0 ? sp.pagina : null;
  const unsubscribedRaw = sp.unsubscribed as string | undefined;
  const unsubscribed: Params['unsubscribed'] =
    unsubscribedRaw === 'show' || unsubscribedRaw === 'only' ? unsubscribedRaw : 'hide';
  const sortBy = (sp.sortBy as Params['sortBy']) ?? 'lastFormAt';
  const sortDir = (sp.sortDir as Params['sortDir']) ?? 'desc';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);
  const pageSize = ([20, 50, 100].includes(Number(sp.pageSize)) ? Number(sp.pageSize) : 20) as Params['pageSize'];
  const validFormTypes: Array<Params['formType']> = ['all', 'form_submit_demo', 'form_submit_beta', 'form_submit_algoritmo_linkedin', 'form_submit_case_semrush', 'form_submit_proposta', 'form_submit_playbook_employee_led_growth', 'unsubscribed'];
  return {
    period: ['all', '7d', '30d', '90d'].includes(period as string) ? (period as Params['period']) : 'all',
    segmento: ['all', 'lider_b2b', 'parceiro', 'profissional_individual', 'newsletter'].includes(segmento as string)
      ? (segmento as Params['segmento']) : 'all',
    formType: validFormTypes.includes(formType as Params['formType']) ? (formType as Params['formType']) : 'all',
    evento, statusId, canal, pagina, unsubscribed, sortBy, sortDir, page, pageSize,
  };
}

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

  // Task 1: filtros lêem colunas dedicadas em vez de derivar de acTags.
  if (params.segmento === 'newsletter') {
    filters.push(eq(people.newsletterOptIn, true));
  } else if (params.segmento !== 'all') {
    filters.push(eq(people.segment, params.segmento));
  }

  // Default 'hide' filtra unsubscribed=false. 'only' inverte. 'show' não filtra.
  if (params.unsubscribed === 'hide') filters.push(eq(people.unsubscribed, false));
  if (params.unsubscribed === 'only') filters.push(eq(people.unsubscribed, true));

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
      personPhone: people.phone,
      personSourceChannel: people.sourceChannel,
      personSourcePage: people.sourcePage,
      personAcTags: people.acTags,
      personSegment: people.segment,
      personSourceMethod: people.sourceMethod,
      personCampaignMemberships: people.campaignMemberships,
      personOptIn: people.newsletterOptIn,
      personUnsubscribed: people.unsubscribed,
      personUnsubscribedAt: people.unsubscribedAt,
      personFormsSubmitted: people.formsSubmitted,
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
          email: row.personEmail,
          jobTitle: row.personJobTitle ?? null,
          phone: row.personPhone ?? null,
          sourceChannel: row.personSourceChannel,
          sourcePage: row.personSourcePage,
          acTags: row.personAcTags as string[] | null,
          statusLabel: row.personStatusLabel ?? null,
          statusColor: row.personStatusColor ?? null,
          metadata: row.personMetadata as Record<string, unknown> | null,
          segment: row.personSegment ?? null,
          sourceMethod: row.personSourceMethod ?? null,
          newsletterOptIn: row.personOptIn ?? false,
          unsubscribed: row.personUnsubscribed ?? false,
          unsubscribedAt: row.personUnsubscribedAt ?? null,
          formsSubmitted: (row.personFormsSubmitted as string[] | null) ?? [],
          campaignMemberships: (row.personCampaignMemberships as string[] | null) ?? [],
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
    form_submit_demo: 0, form_submit_beta: 0, form_submit_algoritmo_linkedin: 0, form_submit_case_semrush: 0, form_submit_proposta: 0, form_submit_playbook_employee_led_growth: 0,
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
    else if (params.sortBy === 'email') cmp = (a.person.email ?? '').localeCompare(b.person.email ?? '');
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

/**
 * Visão "Descadastrados" — lista TODOS os leads com unsubscribed=true, mesmo
 * os que nunca preencheram form (importados, extensão). É a lista de "não
 * contatar": garante visibilidade fácil pra não incluir essas pessoas em
 * nenhuma cadência ou prospecção ativa.
 *
 * Diferente de getPeopleWithForms, parte de `people` (não de activities), então
 * inclui quem não tem nenhum form_submit. Ignora o filtro de período (que é
 * sobre data de form) e não esconde inativos — aqui o ponto é justamente vê-los.
 */
async function getUnsubscribedPeople(params: Params): Promise<{ rows: PersonRow[]; totalPeople: number }> {
  const filters: SQL[] = [eq(people.unsubscribed, true)];

  if (params.segmento === 'newsletter') {
    filters.push(eq(people.newsletterOptIn, true));
  } else if (params.segmento !== 'all') {
    filters.push(eq(people.segment, params.segmento));
  }
  if (params.statusId) filters.push(eq(people.statusId, params.statusId));
  if (params.canal) filters.push(eq(people.sourceChannel, params.canal as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown'));
  if (params.pagina) filters.push(eq(people.sourcePage, params.pagina));

  const rawRows = await db
    .select({
      personId: people.id,
      personName: people.name,
      personEmail: people.email,
      personJobTitle: people.jobTitle,
      personMetadata: people.metadata,
      personPhone: people.phone,
      personSourceChannel: people.sourceChannel,
      personSourcePage: people.sourcePage,
      personAcTags: people.acTags,
      personSegment: people.segment,
      personSourceMethod: people.sourceMethod,
      personCampaignMemberships: people.campaignMemberships,
      personOptIn: people.newsletterOptIn,
      personUnsubscribed: people.unsubscribed,
      personUnsubscribedAt: people.unsubscribedAt,
      personFormsSubmitted: people.formsSubmitted,
      personCreatedAt: people.createdAt,
      personStatusLabel: statuses.label,
      personStatusColor: statuses.color,
      companyId: companies.id,
      companyName: companies.name,
      activityType: activities.type,
      activityCreatedAt: activities.createdAt,
    })
    .from(people)
    .leftJoin(activities, and(eq(activities.personId, people.id), like(activities.type, 'form_submit_%')))
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(...filters))
    .limit(10000);

  const byPersonId = new Map<string, PersonRow>();
  for (const row of rawRows) {
    const existing = byPersonId.get(row.personId);
    const ft = row.activityType as FormType | null;
    if (existing) {
      if (ft && !existing.forms.includes(ft)) existing.forms.push(ft);
      if (row.activityCreatedAt && row.activityCreatedAt > existing.lastFormAt) existing.lastFormAt = row.activityCreatedAt;
      if (row.activityCreatedAt && row.activityCreatedAt < existing.firstFormAt) existing.firstFormAt = row.activityCreatedAt;
    } else {
      // Fallback de data pra ordenação/exibição quando a pessoa não tem form:
      // usa a data de descadastro, senão a de criação.
      const fallbackDate = row.personUnsubscribedAt ?? row.personCreatedAt ?? new Date(0);
      byPersonId.set(row.personId, {
        person: {
          id: row.personId,
          name: row.personName ?? '',
          email: row.personEmail,
          jobTitle: row.personJobTitle ?? null,
          phone: row.personPhone ?? null,
          sourceChannel: row.personSourceChannel,
          sourcePage: row.personSourcePage,
          acTags: row.personAcTags as string[] | null,
          statusLabel: row.personStatusLabel ?? null,
          statusColor: row.personStatusColor ?? null,
          metadata: row.personMetadata as Record<string, unknown> | null,
          segment: row.personSegment ?? null,
          sourceMethod: row.personSourceMethod ?? null,
          newsletterOptIn: row.personOptIn ?? false,
          unsubscribed: row.personUnsubscribed ?? true,
          unsubscribedAt: row.personUnsubscribedAt ?? null,
          formsSubmitted: (row.personFormsSubmitted as string[] | null) ?? [],
          campaignMemberships: (row.personCampaignMemberships as string[] | null) ?? [],
        },
        company: row.companyId ? { id: row.companyId, name: row.companyName ?? '' } : null,
        forms: ft ? [ft] : [],
        lastFormAt: row.activityCreatedAt ?? fallbackDate,
        firstFormAt: row.activityCreatedAt ?? fallbackDate,
      });
    }
  }

  const list = Array.from(byPersonId.values());
  list.sort((a, b) => {
    let cmp = 0;
    if (params.sortBy === 'name') cmp = a.person.name.localeCompare(b.person.name);
    else if (params.sortBy === 'email') cmp = (a.person.email ?? '').localeCompare(b.person.email ?? '');
    else cmp = a.lastFormAt.getTime() - b.lastFormAt.getTime();
    return params.sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPeople = list.length;
  const offset = (params.page - 1) * params.pageSize;
  return { rows: list.slice(offset, offset + params.pageSize), totalPeople };
}

/** Total de leads descadastrados (badge do chip Descadastrados). */
async function getUnsubscribedCount(): Promise<number> {
  const res = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(people)
    .where(eq(people.unsubscribed, true));
  return res[0]?.c ?? 0;
}

/** Total de pessoas no CRM (badge do chip "Todos"). */
async function getTotalPeopleCount(): Promise<number> {
  const res = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(people)
    .where(eq(people.archived, false));
  return res[0]?.c ?? 0;
}

/**
 * Chips de evento/campanha: cada campanha cadastrada com pelo menos 1 pessoa
 * marcada em campaign_memberships. Conta a partir de `people` (não activities)
 * pra pegar também leads importados manualmente (sem form_submit).
 */
async function getEventChips(): Promise<Array<{ value: string; label: string; count: number }>> {
  const camps = await db.select({ slug: campaigns.slug, name: campaigns.name }).from(campaigns);
  if (camps.length === 0) return [];
  const counts = await db
    .select({ slug: sql<string>`unnest(${people.campaignMemberships})`, c: sql<number>`count(*)::int` })
    .from(people)
    .where(eq(people.archived, false))
    .groupBy(sql`unnest(${people.campaignMemberships})`);
  const countBySlug = new Map<string, number>();
  for (const r of counts) countBySlug.set(r.slug, Number(r.c));
  return camps
    .map((c) => ({ value: c.slug, label: c.name, count: countBySlug.get(c.slug) ?? 0 }))
    .filter((c) => c.count > 0);
}

/**
 * Pessoas a partir de `people` (não de activities). Quando eventoSlug é
 * informado, filtra por campaign_memberships (chip de evento). Quando é null,
 * retorna TODAS as pessoas ativas — usado pela visão "Todos", que precisa
 * incluir quem entrou sem form (inserção manual via import, extensão, etc).
 * Left join em activities só pra montar os chips de form de cada pessoa.
 */
async function getEventPeople(params: Params, eventoSlug: string | null): Promise<{ rows: PersonRow[]; totalPeople: number }> {
  const filters: SQL[] = [eq(people.archived, false)];
  if (eventoSlug) filters.push(sql`${eventoSlug} = ANY(${people.campaignMemberships})`);
  if (params.unsubscribed === 'hide') filters.push(eq(people.unsubscribed, false));
  if (params.unsubscribed === 'only') filters.push(eq(people.unsubscribed, true));
  if (params.segmento === 'newsletter') filters.push(eq(people.newsletterOptIn, true));
  else if (params.segmento !== 'all') filters.push(eq(people.segment, params.segmento));
  if (params.statusId) filters.push(eq(people.statusId, params.statusId));
  if (params.canal) filters.push(eq(people.sourceChannel, params.canal as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown'));
  if (params.pagina) filters.push(eq(people.sourcePage, params.pagina));

  const rawRows = await db
    .select({
      personId: people.id,
      personName: people.name,
      personEmail: people.email,
      personJobTitle: people.jobTitle,
      personMetadata: people.metadata,
      personPhone: people.phone,
      personSourceChannel: people.sourceChannel,
      personSourcePage: people.sourcePage,
      personAcTags: people.acTags,
      personSegment: people.segment,
      personSourceMethod: people.sourceMethod,
      personCampaignMemberships: people.campaignMemberships,
      personOptIn: people.newsletterOptIn,
      personUnsubscribed: people.unsubscribed,
      personUnsubscribedAt: people.unsubscribedAt,
      personFormsSubmitted: people.formsSubmitted,
      personCreatedAt: people.createdAt,
      personStatusLabel: statuses.label,
      personStatusColor: statuses.color,
      companyId: companies.id,
      companyName: companies.name,
      activityType: activities.type,
      activityCreatedAt: activities.createdAt,
    })
    .from(people)
    .leftJoin(activities, and(eq(activities.personId, people.id), like(activities.type, 'form_submit_%')))
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(...filters))
    .limit(10000);

  const byPersonId = new Map<string, PersonRow>();
  for (const row of rawRows) {
    const existing = byPersonId.get(row.personId);
    const ft = row.activityType as FormType | null;
    if (existing) {
      if (ft && !existing.forms.includes(ft)) existing.forms.push(ft);
      if (row.activityCreatedAt && row.activityCreatedAt > existing.lastFormAt) existing.lastFormAt = row.activityCreatedAt;
      if (row.activityCreatedAt && row.activityCreatedAt < existing.firstFormAt) existing.firstFormAt = row.activityCreatedAt;
    } else {
      const fallbackDate = row.personCreatedAt ?? new Date(0);
      byPersonId.set(row.personId, {
        person: {
          id: row.personId,
          name: row.personName ?? '',
          email: row.personEmail,
          jobTitle: row.personJobTitle ?? null,
          phone: row.personPhone ?? null,
          sourceChannel: row.personSourceChannel,
          sourcePage: row.personSourcePage,
          acTags: row.personAcTags as string[] | null,
          statusLabel: row.personStatusLabel ?? null,
          statusColor: row.personStatusColor ?? null,
          metadata: row.personMetadata as Record<string, unknown> | null,
          segment: row.personSegment ?? null,
          sourceMethod: row.personSourceMethod ?? null,
          newsletterOptIn: row.personOptIn ?? false,
          unsubscribed: row.personUnsubscribed ?? false,
          unsubscribedAt: row.personUnsubscribedAt ?? null,
          formsSubmitted: (row.personFormsSubmitted as string[] | null) ?? [],
          campaignMemberships: (row.personCampaignMemberships as string[] | null) ?? [],
        },
        company: row.companyId ? { id: row.companyId, name: row.companyName ?? '' } : null,
        forms: ft ? [ft] : [],
        lastFormAt: row.activityCreatedAt ?? fallbackDate,
        firstFormAt: row.activityCreatedAt ?? fallbackDate,
      });
    }
  }

  const list = Array.from(byPersonId.values());
  list.sort((a, b) => {
    let cmp = 0;
    if (params.sortBy === 'name') cmp = a.person.name.localeCompare(b.person.name);
    else if (params.sortBy === 'email') cmp = (a.person.email ?? '').localeCompare(b.person.email ?? '');
    else cmp = a.lastFormAt.getTime() - b.lastFormAt.getTime();
    return params.sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPeople = list.length;
  const offset = (params.page - 1) * params.pageSize;
  return { rows: list.slice(offset, offset + params.pageSize), totalPeople };
}

export default async function CrmFormsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const params = parseParams(sp);

  let rows: PersonRow[] = [];
  let countsByForm: Record<FormType, number> = {
    form_submit_demo: 0, form_submit_beta: 0, form_submit_algoritmo_linkedin: 0, form_submit_case_semrush: 0, form_submit_proposta: 0, form_submit_playbook_employee_led_growth: 0,
  };
  let totalPeople = 0;
  let unsubscribedCount = 0;
  let totalPeopleAll = 0;
  let eventChips: Array<{ value: string; label: string; count: number }> = [];
  let dbError: string | null = null;
  let personStatuses: Array<{ id: string; label: string; color: string | null }> = [];
  let filterOptions: { channels: string[]; pages: string[] } = { channels: [], pages: [] };

  try {
    // getPeopleWithForms roda sempre — fornece os counts dos chips de form.
    // A visão "Descadastrados"/"Evento" troca só as ROWS exibidas (counts reais).
    const [result, statusesData, options, unsubCount, totalAll, events] = await Promise.all([
      getPeopleWithForms(params),
      getStatuses('person'),
      getFilterOptions(),
      getUnsubscribedCount(),
      getTotalPeopleCount(),
      getEventChips(),
    ]);
    countsByForm = result.countsByForm;
    personStatuses = statusesData.map((s) => ({ id: s.id, label: s.label, color: s.color }));
    filterOptions = options;
    unsubscribedCount = unsubCount;
    totalPeopleAll = totalAll;
    eventChips = events;

    if (params.evento) {
      const ev = await getEventPeople(params, params.evento);
      rows = ev.rows;
      totalPeople = ev.totalPeople;
    } else if (params.formType === 'unsubscribed') {
      const unsub = await getUnsubscribedPeople(params);
      rows = unsub.rows;
      totalPeople = unsub.totalPeople;
    } else if (params.formType === 'all') {
      // "Todos" parte de `people` (não de activities) pra incluir quem entrou
      // sem form: inserção manual via import, captura de extensão, etc.
      const all = await getEventPeople(params, null);
      rows = all.rows;
      totalPeople = all.totalPeople;
    } else {
      rows = result.rows;
      totalPeople = result.totalPeople;
    }
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
          unsubscribedCount={unsubscribedCount}
          totalPeopleAll={totalPeopleAll}
          eventChips={eventChips}
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
