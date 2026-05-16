/**
 * Queries de leitura do CRM Boldfy — usadas pelas views (kanban, lead detail,
 * feed). Separadas do core (lib/crm.ts) pra deixar claro o que muta vs lê.
 *
 * Todas as queries excluem rows arquivadas e merged_into_id != null por padrão
 * (a menos que explicitado).
 */

import { db, people, companies, activities, meetings } from '@/db';
import type { Person, Company, Activity, Meeting } from '@/db';
import { and, eq, isNull, desc, sql, count, gte } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Pessoas                                                                    */
/* -------------------------------------------------------------------------- */

export type PersonWithCompany = Person & { company: Company | null };

export type PeopleByStatus = {
  Ativo: PersonWithCompany[];
  Lead: PersonWithCompany[];
  Quente: PersonWithCompany[];
};

/**
 * Lista todas as pessoas agrupadas por status (pra renderizar kanban).
 * Limita N por coluna pra evitar query monstro — UI mostra "ver mais" depois.
 */
export async function getPeopleByStatus(perColumn = 50): Promise<PeopleByStatus> {
  const rows = await db
    .select()
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
    .orderBy(desc(people.lastTouchAt), desc(people.createdAt));

  const grouped: PeopleByStatus = { Ativo: [], Lead: [], Quente: [] };
  for (const row of rows) {
    const status = row.people.status;
    if (grouped[status].length < perColumn) {
      grouped[status].push({ ...row.people, company: row.companies });
    }
  }
  return grouped;
}

export async function getPersonById(id: string): Promise<PersonWithCompany | null> {
  const rows = await db
    .select()
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .where(eq(people.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].people, company: rows[0].companies };
}

/* -------------------------------------------------------------------------- */
/*  Empresas                                                                   */
/* -------------------------------------------------------------------------- */

export type CompanyWithStats = Company & {
  peopleCount: number;
  topScore: number;
};

export type CompaniesByStatus = Record<Company['status'], CompanyWithStats[]>;

export async function getCompaniesByStatus(perColumn = 50): Promise<CompaniesByStatus> {
  // Subquery: count + max score por company
  const rows = await db
    .select({
      company: companies,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
    })
    .from(companies)
    .orderBy(desc(companies.updatedAt));

  const grouped: CompaniesByStatus = {
    'No status': [],
    'Quero prospectar': [],
    'Reunião marcada': [],
    'Em andamento': [],
    Fechado: [],
    Perdido: [],
  };

  for (const row of rows) {
    const status = row.company.status;
    if (grouped[status].length < perColumn) {
      grouped[status].push({
        ...row.company,
        peopleCount: row.peopleCount,
        topScore: row.topScore,
      });
    }
  }
  return grouped;
}

export async function getCompanyById(id: string): Promise<CompanyWithStats | null> {
  const rows = await db
    .select({
      company: companies,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
    })
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].company, peopleCount: rows[0].peopleCount, topScore: rows[0].topScore };
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
/*  Dashboards quickstats (usado em Visão Geral)                              */
/* -------------------------------------------------------------------------- */

export async function getCrmCounts(): Promise<{
  totalPeople: number;
  totalCompanies: number;
  totalActivities: number;
  quentes: number;
  reunioesMarcadas: number;
  fechados: number;
}> {
  const [p, c, a, q, r, f] = await Promise.all([
    db.select({ n: count() }).from(people).where(and(eq(people.archived, false), isNull(people.mergedIntoId))),
    db.select({ n: count() }).from(companies),
    db.select({ n: count() }).from(activities),
    db.select({ n: count() }).from(people).where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.status, 'Quente'))),
    db.select({ n: count() }).from(companies).where(eq(companies.status, 'Reunião marcada')),
    db.select({ n: count() }).from(companies).where(eq(companies.status, 'Fechado')),
  ]);
  return {
    totalPeople: p[0]?.n ?? 0,
    totalCompanies: c[0]?.n ?? 0,
    totalActivities: a[0]?.n ?? 0,
    quentes: q[0]?.n ?? 0,
    reunioesMarcadas: r[0]?.n ?? 0,
    fechados: f[0]?.n ?? 0,
  };
}
