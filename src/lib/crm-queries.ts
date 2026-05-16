/**
 * Queries de leitura do CRM Boldfy.
 *
 * Status agora vive em tabela `statuses` editável — todas queries fazem join
 * pra trazer label + color + sort_order.
 */

import { db, people, companies, activities, meetings, statuses } from '@/db';
import type { Person, Company, Activity, Meeting, Status } from '@/db';
import { and, eq, isNull, desc, sql, count, gte } from 'drizzle-orm';
import { getStatuses } from './statuses';

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

export async function getPeopleByStatus(perColumn = 100): Promise<PeopleByStatus> {
  const [allStatuses, rows] = await Promise.all([
    getStatuses('person'),
    db
      .select()
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
      .orderBy(desc(people.lastTouchAt), desc(people.createdAt)),
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
};

export type CompaniesByStatus = {
  status: Status;
  companies: CompanyWithDetails[];
}[];

export async function getCompaniesByStatus(perColumn = 100): Promise<CompaniesByStatus> {
  const [allStatuses, rows] = await Promise.all([
    getStatuses('company'),
    db
      .select({
        company: companies,
        status: statuses,
        peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
        topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
      })
      .from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .orderBy(desc(companies.updatedAt)),
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

export async function getCompanyById(id: string): Promise<CompanyWithDetails | null> {
  const rows = await db
    .select({
      company: companies,
      status: statuses,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
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

/* -------------------------------------------------------------------------- */
/*  CRM Counts (usado em topbar/visão geral)                                  */
/* -------------------------------------------------------------------------- */

export async function getCrmCounts(): Promise<{
  totalPeople: number;
  totalCompanies: number;
  totalActivities: number;
}> {
  const [p, c, a] = await Promise.all([
    db.select({ n: count() }).from(people).where(and(eq(people.archived, false), isNull(people.mergedIntoId))),
    db.select({ n: count() }).from(companies),
    db.select({ n: count() }).from(activities),
  ]);
  return {
    totalPeople: p[0]?.n ?? 0,
    totalCompanies: c[0]?.n ?? 0,
    totalActivities: a[0]?.n ?? 0,
  };
}
