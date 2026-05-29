/**
 * Action de busca global do CRM (Cmd+K).
 *
 * Busca em Pessoas (nome, email, headline, jobTitle) e Empresas (name).
 * Limita 5 de cada pra resposta rápida.
 */

'use server';

import { db, people, companies } from '@/db';
import { ilike, and, eq, or, isNull, desc } from 'drizzle-orm';

export type SearchHit =
  | { kind: 'person'; id: string; name: string; email: string | null; jobTitle: string | null; companyName: string | null }
  | { kind: 'company'; id: string; name: string; industry: string | null };

export async function searchCrm(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const term = `%${q.toLowerCase()}%`;

  try {
    const [peopleRows, companyRows] = await Promise.all([
      db
        .select({
          id: people.id,
          name: people.name,
          email: people.email,
          jobTitle: people.jobTitle,
          companyId: people.companyId,
        })
        .from(people)
        .where(
          and(
            eq(people.archived, false),
            isNull(people.mergedIntoId),
            or(
              ilike(people.name, term),
              ilike(people.email, term),
              ilike(people.jobTitle, term),
              ilike(people.headline, term),
            ),
          ),
        )
        .orderBy(desc(people.leadScore))
        .limit(5),
      db
        .select({ id: companies.id, name: companies.name, industry: companies.industry })
        .from(companies)
        .where(ilike(companies.name, term))
        .limit(5),
    ]);

    // Resolve company names das pessoas em batch
    const companyIds = peopleRows.map((p) => p.companyId).filter((id): id is string => id !== null);
    const companyMap = new Map<string, string>();
    if (companyIds.length > 0) {
      const cs = await db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(or(...companyIds.map((id) => eq(companies.id, id))));
      cs.forEach((c) => companyMap.set(c.id, c.name));
    }

    const hits: SearchHit[] = [
      ...peopleRows.map((p) => ({
        kind: 'person' as const,
        id: p.id,
        name: p.name,
        email: p.email,
        jobTitle: p.jobTitle,
        companyName: p.companyId ? companyMap.get(p.companyId) ?? null : null,
      })),
      ...companyRows.map((c) => ({
        kind: 'company' as const,
        id: c.id,
        name: c.name,
        industry: c.industry,
      })),
    ];

    return hits;
  } catch (err) {
    console.error('[searchCrm] failed:', err);
    return [];
  }
}
