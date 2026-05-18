/**
 * Queries de leitura do CRM Boldfy.
 *
 * Status agora vive em tabela `statuses` editável — todas queries fazem join
 * pra trazer label + color + sort_order.
 */

import { db, people, companies, activities, meetings, statuses } from '@/db';
import type { Person, Company, Activity, Meeting, Status } from '@/db';
import { and, eq, isNull, desc, asc, sql, count, gte, type SQL } from 'drizzle-orm';
import { getStatuses } from './statuses';

/**
 * Filtros opcionais aplicáveis tanto em getPeopleByStatus quanto em
 * getCompaniesByStatus. URL searchParams → server → query.
 *
 * Task 1 (mai/2026): includeUnsubscribed=false (default) filtra leads que
 * saíram da lista. Aba "Leads inativos" passa true pra ver só esses.
 */
export type CrmFilters = {
  period?: 'all' | '7d' | '30d' | '90d';
  statusId?: string | null;
  canal?: string | null;
  pagina?: string | null;
  /** Default false. Quando true, traz unsubscribed também. */
  includeUnsubscribed?: boolean;
  /** Quando true, traz APENAS unsubscribed (aba "Leads inativos"). */
  onlyUnsubscribed?: boolean;
  /**
   * Sort string formato "{key}-{dir}". Vem do searchParam ?sort= do CrmFilters
   * UI. Tipos suportados por kind (parser lida com inválidos via default):
   *  person:  lastTouchAt|createdAt|name|leadScore × asc|desc
   *  company: updatedAt|createdAt|name|peopleCount|topScore × asc|desc
   */
  sort?: string | null;
};

function periodCutoff(period?: CrmFilters['period']): Date | null {
  if (!period || period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Resolve sort string "{key}-{dir}" pra orderBy clauses do Drizzle.
 * Fallback: pra person → lastTouchAt desc; pra company → updatedAt desc.
 * Sort secundário sempre createdAt desc pra estabilidade quando o primário
 * tiver empate.
 */
function resolvePersonSort(sort: string | null | undefined): SQL[] {
  const [keyRaw, dirRaw] = (sort ?? '').split('-');
  const dir = dirRaw === 'asc' ? asc : desc;
  const secondary = desc(people.createdAt);
  switch (keyRaw) {
    case 'name':        return [dir(people.name), secondary];
    case 'createdAt':   return [dir(people.createdAt)];
    case 'leadScore':   return [dir(people.leadScore), secondary];
    case 'lastTouchAt':
    default:
      return [desc(people.lastTouchAt), secondary];
  }
}
function resolveCompanySort(sort: string | null | undefined): SQL[] {
  const [keyRaw, dirRaw] = (sort ?? '').split('-');
  const dir = dirRaw === 'asc' ? asc : desc;
  const secondary = desc(companies.createdAt);
  switch (keyRaw) {
    case 'name':        return [dir(companies.name), secondary];
    case 'createdAt':   return [dir(companies.createdAt)];
    case 'peopleCount':
      return [sql`(SELECT COUNT(*) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL) DESC`, secondary];
    case 'topScore':
      return [sql`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0) DESC`, secondary];
    case 'updatedAt':
    default:
      return [desc(companies.updatedAt), secondary];
  }
}

/* -------------------------------------------------------------------------- */
/*  Pessoas                                                                    */
/* -------------------------------------------------------------------------- */

export type PersonWithDetails = Person & {
  company: Company | null;
  status: Status | null;
};

export type PeopleByStatus = {
  status: Status;
  people: PersonWithDetails[];
}[];

/**
 * Gate B2B do kanban de pessoas: só Líderes B2B aparecem. Outros segmentos
 * (Profissional Individual, Parceiro) ficam só na aba Formulários, evitando
 * ruído no pipeline B2B.
 *
 * Task 1+ (mai/2026): gate agora usa people.segment direto (não acTags antigo
 * `Segmento: Líderes B2B`). Razão: o fluxo novo grava segment como coluna
 * dedicada; ac_tags do CRM serve só como espelho/auditoria das tags AC.
 * O bug antigo (Patricia/Heloisa não aparecendo no kanban) vinha do gate
 * olhar ac_tags que nem sempre estava sincronizado.
 *
 * Reaplica em todas as queries do kanban + counters da sub-nav pra
 * consistência.
 */
const KANBAN_B2B_CLAUSE = eq(people.segment, 'lider_b2b');

export async function getPeopleByStatus(perColumn = 100, filters: CrmFilters = {}): Promise<PeopleByStatus> {
  const filterClauses: SQL[] = [
    eq(people.archived, false),
    isNull(people.mergedIntoId),
    // Gate B2B no kanban (mai/2026 ciclo 3+) — usa coluna dedicada segment
    KANBAN_B2B_CLAUSE,
  ];

  // Task 1: filtro implícito unsubscribed=false. Aba "Inativos" passa
  // onlyUnsubscribed=true; "Mostrar inativos" passa includeUnsubscribed=true.
  if (filters.onlyUnsubscribed) {
    filterClauses.push(eq(people.unsubscribed, true));
  } else if (!filters.includeUnsubscribed) {
    filterClauses.push(eq(people.unsubscribed, false));
  }

  const cutoff = periodCutoff(filters.period);
  if (cutoff) filterClauses.push(gte(people.createdAt, cutoff));
  if (filters.statusId) filterClauses.push(eq(people.statusId, filters.statusId));
  if (filters.canal) {
    filterClauses.push(eq(people.sourceChannel, filters.canal as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown'));
  }
  if (filters.pagina) filterClauses.push(eq(people.sourcePage, filters.pagina));

  const [allStatuses, rows] = await Promise.all([
    getStatuses('person'),
    db
      .select()
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(...filterClauses))
      .orderBy(...resolvePersonSort(filters.sort)),
  ]);

  // Inicializa todas as colunas vazias na ordem correta
  const grouped: PeopleByStatus = allStatuses.map((s) => ({ status: s, people: [] }));
  const byId = new Map<string, PersonWithDetails[]>();
  for (const g of grouped) byId.set(g.status.id, g.people);

  // Pessoas sem status (status_id null) vão pro default; se não tiver, ignora
  const defaultColumn = grouped.find((g) => g.status.isDefault) ?? grouped[0];

  for (const row of rows) {
    const personData: PersonWithDetails = {
      ...row.people,
      company: row.companies,
      status: row.statuses,
    };
    const targetCol = row.people.statusId
      ? byId.get(row.people.statusId)
      : defaultColumn?.people;
    if (targetCol && targetCol.length < perColumn) {
      targetCol.push(personData);
    }
  }

  return grouped;
}

export async function getPersonById(id: string): Promise<PersonWithDetails | null> {
  const rows = await db
    .select()
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(eq(people.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return {
    ...rows[0].people,
    company: rows[0].companies,
    status: rows[0].statuses,
  };
}

/* -------------------------------------------------------------------------- */
/*  Empresas                                                                   */
/* -------------------------------------------------------------------------- */

export type CompanyWithDetails = Company & {
  status: Status | null;
  peopleCount: number;
  topScore: number;
  /**
   * Nomes dos primeiros 5 leads (por score desc), separados por vírgula.
   * Exibido na tabela de empresas pra detectar dupes/empresas órfãs.
   * Pode ser null se a empresa não tem pessoas linkadas.
   */
  peopleNames: string | null;
};

export type CompaniesByStatus = {
  status: Status;
  companies: CompanyWithDetails[];
}[];

/**
 * Empresa "inativa" = tem pessoas linkadas E TODAS estão unsubscribed.
 * Empresa sem pessoas, ou com pelo menos 1 pessoa ativa, NÃO é inativa.
 *
 * Lógica: NOT EXISTS (pessoa ativa não-unsub) AND EXISTS (pessoa unsub).
 * Subquery via SQL bruto pra evitar correlacionar 2x.
 */
const COMPANY_INACTIVE_CLAUSE = sql`(
  EXISTS (
    SELECT 1 FROM people p
    WHERE p.company_id = ${companies.id}
      AND p.archived = FALSE
      AND p.merged_into_id IS NULL
      AND p.unsubscribed = TRUE
  )
  AND NOT EXISTS (
    SELECT 1 FROM people p
    WHERE p.company_id = ${companies.id}
      AND p.archived = FALSE
      AND p.merged_into_id IS NULL
      AND p.unsubscribed = FALSE
  )
)`;

export async function getCompaniesByStatus(perColumn = 100, filters: CrmFilters = {}): Promise<CompaniesByStatus> {
  const filterClauses: SQL[] = [];

  // Task 2 (spec §8): filtro implícito de inativos na empresa. Default
  // exclui empresas inativas (todos linkados unsubscribed). onlyUnsubscribed
  // inverte; includeUnsubscribed traz todas.
  if (filters.onlyUnsubscribed) {
    filterClauses.push(COMPANY_INACTIVE_CLAUSE);
  } else if (!filters.includeUnsubscribed) {
    filterClauses.push(sql`NOT ${COMPANY_INACTIVE_CLAUSE}`);
  }

  const cutoff = periodCutoff(filters.period);
  if (cutoff) filterClauses.push(gte(companies.createdAt, cutoff));
  if (filters.statusId) filterClauses.push(eq(companies.statusId, filters.statusId));

  const [allStatuses, rows] = await Promise.all([
    getStatuses('company'),
    db
      .select({
        company: companies,
        status: statuses,
        peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
        topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
        // Lista os primeiros 5 nomes de pessoas vinculadas (pra exibir
        // direto na tabela e detectar dupes/órfãs). string_agg com ORDER BY
        // garante ordem estável. LIMIT via subquery pq string_agg não tem
        // limit nativo do Postgres.
        peopleNames: sql<string | null>`(
          SELECT string_agg(name, ', ' ORDER BY name)
          FROM (
            SELECT name FROM people
            WHERE company_id = ${companies.id}
              AND archived = FALSE
              AND merged_into_id IS NULL
            ORDER BY lead_score DESC
            LIMIT 5
          ) AS top5
        )`,
      })
      .from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(filterClauses.length > 0 ? and(...filterClauses) : undefined)
      .orderBy(...resolveCompanySort(filters.sort)),
  ]);

  const grouped: CompaniesByStatus = allStatuses.map((s) => ({ status: s, companies: [] }));
  const byId = new Map<string, CompanyWithDetails[]>();
  for (const g of grouped) byId.set(g.status.id, g.companies);
  const defaultColumn = grouped.find((g) => g.status.isDefault) ?? grouped[0];

  for (const row of rows) {
    const data: CompanyWithDetails = {
      ...row.company,
      status: row.status,
      peopleCount: row.peopleCount,
      topScore: row.topScore,
      peopleNames: row.peopleNames,
    };
    const targetCol = row.company.statusId
      ? byId.get(row.company.statusId)
      : defaultColumn?.companies;
    if (targetCol && targetCol.length < perColumn) {
      targetCol.push(data);
    }
  }

  return grouped;
}

/**
 * Empresas "inativas" — todas pessoas linkadas estão unsubscribed.
 * Usada pela coluna colapsada do CompanyKanban + toggle do CompanyTable.
 *
 * Mesmo shape de CompanyWithDetails (peopleCount, topScore, peopleNames)
 * pra dropar direto na UI existente.
 */
export async function getInactiveCompanies(perColumn = 100): Promise<CompanyWithDetails[]> {
  const rows = await db
    .select({
      company: companies,
      status: statuses,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
      peopleNames: sql<string | null>`(
        SELECT string_agg(name, ', ' ORDER BY name)
        FROM (
          SELECT name FROM people
          WHERE company_id = ${companies.id}
            AND archived = FALSE
            AND merged_into_id IS NULL
          ORDER BY lead_score DESC
          LIMIT 5
        ) AS top5
      )`,
    })
    .from(companies)
    .leftJoin(statuses, eq(companies.statusId, statuses.id))
    .where(COMPANY_INACTIVE_CLAUSE)
    .orderBy(desc(companies.updatedAt))
    .limit(perColumn);

  return rows.map((r) => ({
    ...r.company,
    status: r.status,
    peopleCount: r.peopleCount,
    topScore: r.topScore,
    peopleNames: r.peopleNames,
  }));
}

export async function getCompanyById(id: string): Promise<CompanyWithDetails | null> {
  const rows = await db
    .select({
      company: companies,
      status: statuses,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
      peopleNames: sql<string | null>`(
        SELECT string_agg(name, ', ' ORDER BY name)
        FROM (
          SELECT name FROM people
          WHERE company_id = ${companies.id}
            AND archived = FALSE
            AND merged_into_id IS NULL
          ORDER BY lead_score DESC
          LIMIT 5
        ) AS top5
      )`,
    })
    .from(companies)
    .leftJoin(statuses, eq(companies.statusId, statuses.id))
    .where(eq(companies.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return {
    ...rows[0].company,
    status: rows[0].status,
    peopleCount: rows[0].peopleCount,
    topScore: rows[0].topScore,
    peopleNames: rows[0].peopleNames,
  };
}

/* -------------------------------------------------------------------------- */
/*  Activities                                                                 */
/* -------------------------------------------------------------------------- */

export async function getActivitiesForPerson(
  personId: string,
  limit = 100,
): Promise<Activity[]> {
  return db
    .select()
    .from(activities)
    .where(eq(activities.personId, personId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

/**
 * Activities ligadas a uma empresa — inclui activities company-level (sem
 * personId) e activities das pessoas linkadas (via people.companyId).
 *
 * Por que via people.companyId em vez de só activities.companyId?
 * Muitas activities históricas (form_submit, page_view, email_open) foram
 * gravadas com personId mas sem companyId. Pra empresa enxergar tudo que
 * aconteceu, fazemos OR via subquery.
 */
export async function getActivitiesForCompany(
  companyId: string,
  limit = 200,
): Promise<(Activity & { personName: string | null; personId: string | null })[]> {
  const rows = await db
    .select({
      activity: activities,
      personName: people.name,
    })
    .from(activities)
    .leftJoin(people, eq(activities.personId, people.id))
    .where(
      sql`${activities.companyId} = ${companyId} OR ${activities.personId} IN (
            SELECT id FROM people WHERE company_id = ${companyId} AND archived = FALSE AND merged_into_id IS NULL
          )`,
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.activity,
    personName: r.personName ?? null,
    personId: r.activity.personId ?? null,
  }));
}

/**
 * Pessoas linkadas a uma empresa, com status, ordenadas por lead score desc.
 * Já inclui filtro archived/merged.
 */
export type CompanyPersonRow = {
  person: Person;
  status: Status | null;
};

export async function getPeopleForCompany(companyId: string): Promise<CompanyPersonRow[]> {
  const rows = await db
    .select({
      person: people,
      status: statuses,
    })
    .from(people)
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(eq(people.companyId, companyId), eq(people.archived, false), isNull(people.mergedIntoId)))
    .orderBy(desc(people.leadScore), desc(people.lastTouchAt));

  return rows.map((r) => ({ person: r.person, status: r.status }));
}

/**
 * União das AC tags de todas as pessoas linkadas. Útil pra ver o "footprint"
 * de uma empresa no AC (formulários que entraram, segmentos, etc).
 *
 * Tags retornadas em ordem alfabética, sem duplicatas.
 */
export async function getAggregatedAcTagsForCompany(companyId: string): Promise<string[]> {
  const rows = await db
    .select({ tags: people.acTags })
    .from(people)
    .where(and(eq(people.companyId, companyId), eq(people.archived, false), isNull(people.mergedIntoId)));

  const set = new Set<string>();
  for (const row of rows) {
    if (!row.tags) continue;
    for (const tag of row.tags) if (tag) set.add(tag);
  }
  return Array.from(set).sort();
}

export type FeedActivity = Activity & {
  person: { id: string; name: string; email: string } | null;
  company: { id: string; name: string } | null;
};

export async function getFeedActivities(limit = 100): Promise<FeedActivity[]> {
  const rows = await db
    .select({
      activity: activities,
      person: { id: people.id, name: people.name, email: people.email },
      company: { id: companies.id, name: companies.name },
    })
    .from(activities)
    .leftJoin(people, eq(activities.personId, people.id))
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.activity,
    person: r.person?.id ? (r.person as { id: string; name: string; email: string }) : null,
    company: r.company?.id ? (r.company as { id: string; name: string }) : null,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Meetings                                                                   */
/* -------------------------------------------------------------------------- */

export async function getUpcomingMeetingsForPerson(personId: string): Promise<Meeting[]> {
  return db
    .select()
    .from(meetings)
    .where(
      and(
        eq(meetings.personId, personId),
        eq(meetings.status, 'scheduled'),
        gte(meetings.scheduledAt, new Date()),
      ),
    )
    .orderBy(meetings.scheduledAt);
}

/**
 * Reuniões futuras agregadas de TODAS as pessoas linkadas à empresa.
 * Inclui nome da pessoa pra mostrar "Reunião com X em Y".
 */
export type CompanyUpcomingMeeting = Meeting & {
  personName: string | null;
  personIdRef: string | null;
};

export async function getUpcomingMeetingsForCompany(companyId: string): Promise<CompanyUpcomingMeeting[]> {
  const rows = await db
    .select({
      meeting: meetings,
      personName: people.name,
      personId: people.id,
    })
    .from(meetings)
    .innerJoin(people, eq(meetings.personId, people.id))
    .where(
      and(
        eq(people.companyId, companyId),
        eq(meetings.status, 'scheduled'),
        gte(meetings.scheduledAt, new Date()),
      ),
    )
    .orderBy(meetings.scheduledAt);

  return rows.map((r) => ({
    ...r.meeting,
    personName: r.personName ?? null,
    personIdRef: r.personId ?? null,
  }));
}

/* -------------------------------------------------------------------------- */
/*  CRM Counts (usado em topbar/visão geral)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Contagens pra exibir na sub-nav do CRM.
 *
 * totalPeople reflete só os LÍDERES B2B (mesmo gate visual do kanban —
 * filtro por acTags). Não-B2B (Profissional Individual, Parceiro,
 * Newsletter) ficam de fora do contador pra não causar confusão entre
 * número exibido vs cards visíveis. Esses outros segmentos aparecem só
 * na aba Formulários (que tem contador próprio).
 *
 * totalCompanies não filtra — todas as empresas do DB contam (alinhado
 * com getCompaniesByStatus que também não filtra).
 *
 * totalActivities é global pro feed (não filtra).
 */
export async function getCrmCounts(): Promise<{
  totalPeople: number;
  totalCompanies: number;
  totalActivities: number;
}> {
  // totalPeople = só ATIVOS (filtro implícito unsubscribed=false) — bate com
  // o que aparece no kanban default. Inativos viram coluna escondida do
  // kanban (não contam no badge da sub-nav).
  //
  // totalCompanies = exclui empresas inativas (todos linkados unsubscribed),
  // mesma semântica do filtro implícito no kanban de empresas.
  const [p, c, a] = await Promise.all([
    db.select({ n: count() }).from(people).where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      eq(people.unsubscribed, false),
      KANBAN_B2B_CLAUSE,
    )),
    db.select({ n: count() }).from(companies).where(sql`NOT ${COMPANY_INACTIVE_CLAUSE}`),
    db.select({ n: count() }).from(activities),
  ]);
  return {
    totalPeople: p[0]?.n ?? 0,
    totalCompanies: c[0]?.n ?? 0,
    totalActivities: a[0]?.n ?? 0,
  };
}

/**
 * Busca pessoas unsubscribed (gate B2B). Usado pela coluna "Inativos"
 * colapsada no final do kanban — fica oculta até user expandir.
 *
 * Spec §8: "Coluna 'Inativos' como ÚLTIMA etapa do kanban (depois de
 * 'Perdido'), colapsada por default. Click pra expandir mostra leads
 * unsubscribed dentro. Não ocupa espaço quando não usado."
 */
export async function getInactivePeople(perColumn = 100): Promise<PersonWithDetails[]> {
  const rows = await db
    .select()
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      eq(people.unsubscribed, true),
      KANBAN_B2B_CLAUSE,
    ))
    .orderBy(desc(people.unsubscribedAt), desc(people.lastTouchAt))
    .limit(perColumn);

  return rows.map((r) => ({
    ...r.people,
    company: r.companies,
    status: r.statuses,
  }));
}
