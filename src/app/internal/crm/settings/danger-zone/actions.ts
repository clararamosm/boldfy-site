/**
 * Danger Zone — operações destrutivas do CRM.
 *
 * Tools:
 *   - snapshotCrm() → dumpa people/companies/activities/meetings em JSON
 *   - nukeCrm(confirmation) → drop dessas 4 tabelas (mantém statuses,
 *     google_oauth_tokens, extension_tokens). Exige string exata "DELETAR TUDO".
 *
 * Caso de uso (mai/2026):
 *   Limpeza pra começar o CRM do zero usando só sync do AC + extensão futura.
 *   Folk legado vai junto. snapshot serve como rede de proteção pra
 *   recuperar manualmente algo perdido.
 */

'use server';

import { db, people, companies, activities, meetings } from '@/db';
import { revalidatePath } from 'next/cache';

export type SnapshotResult =
  | { ok: true; data: string; counts: { people: number; companies: number; activities: number; meetings: number } }
  | { ok: false; error: string };

export async function snapshotCrm(): Promise<SnapshotResult> {
  try {
    const [peopleRows, companiesRows, activitiesRows, meetingsRows] = await Promise.all([
      db.select().from(people),
      db.select().from(companies),
      db.select().from(activities),
      db.select().from(meetings),
    ]);

    const dump = {
      generated_at: new Date().toISOString(),
      schema_version: 'crm-2026-05-17',
      counts: {
        people: peopleRows.length,
        companies: companiesRows.length,
        activities: activitiesRows.length,
        meetings: meetingsRows.length,
      },
      people: peopleRows,
      companies: companiesRows,
      activities: activitiesRows,
      meetings: meetingsRows,
    };

    return {
      ok: true,
      data: JSON.stringify(dump, null, 2),
      counts: dump.counts,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[snapshotCrm] failed:', msg);
    return { ok: false, error: msg };
  }
}

export type NukeResult = { ok: true; deleted: { people: number; companies: number; activities: number; meetings: number } } | { ok: false; error: string };

export async function nukeCrm(confirmation: string): Promise<NukeResult> {
  if (confirmation !== 'DELETAR TUDO') {
    return { ok: false, error: 'Confirmação inválida. Digite exatamente: DELETAR TUDO' };
  }

  try {
    // Ordem importa por FK:
    //   activities → person/company (cascade no schema, mas explícito é mais seguro)
    //   meetings   → person (cascade)
    //   people     → company (set null)
    //   companies  → standalone
    //
    // Delete em sequência pra contar cada.
    const activitiesDeleted = await db.delete(activities).returning({ id: activities.id });
    const meetingsDeleted = await db.delete(meetings).returning({ id: meetings.id });
    const peopleDeleted = await db.delete(people).returning({ id: people.id });
    const companiesDeleted = await db.delete(companies).returning({ id: companies.id });

    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    revalidatePath('/internal/crm/feed');

    return {
      ok: true,
      deleted: {
        people: peopleDeleted.length,
        companies: companiesDeleted.length,
        activities: activitiesDeleted.length,
        meetings: meetingsDeleted.length,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[nukeCrm] failed:', msg);
    return { ok: false, error: msg };
  }
}
