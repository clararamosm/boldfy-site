/**
 * Import do Folk via UPLOAD CSV.
 *
 * Aceita até 3 CSVs do export do Folk:
 *   - people.csv         (do grupo Leads)
 *   - companies.csv      (do grupo Prospects)
 *   - companies_notes.csv (opcional — research briefs das empresas)
 *
 * Estratégia de match em PERSONS (a mais delicada):
 *   1. Match por email primário (favoriteEmail / emails[0])
 *   2. Se não bate, fallback por nome (firstname+lastname lower)
 *      — só aplica se houver UM match único pra evitar dar update no lead errado
 *      — quando bate por nome, o email do Folk vai pra metadata.secondary_emails
 *        (porque o email primário é sempre o que veio do form no AC)
 *   3. Se não acha NEM por email NEM por nome, INSERT — lead vive só no Folk
 *      e precisa entrar no nosso CRM mesmo assim.
 *
 * Em COMPANIES:
 *   - INSERT/UPDATE por nome lower (já funcionava)
 *   - Guarda folk_contact_id no metadata pra match das notes
 *
 * Em NOTES (companies):
 *   - Match pelo folk_contact_id (que veio do companies.csv) ou nome lower
 *   - Popula description da company (se vazia) com o markdown do brief
 *   - Também guarda em metadata.folk_research_brief pra preservar original
 *
 * Idempotent. Não toca em leads que estão só no AC (não no Folk).
 */

'use server';

import { db, people, companies, statuses } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type Result =
  | {
      ok: true;
      companies: { inserted: number; updated: number; errors: number };
      persons: {
        inserted: number;
        updatedByEmail: number;
        updatedByAlternateEmail: number;
        updatedByName: number;
        errors: number;
      };
      notes: { applied: number; skipped: number };
    }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  CSV parser manual — lida com quoted fields + commas dentro de aspas       */
/* -------------------------------------------------------------------------- */

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field);
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        current.push(field);
        field = '';
        if (current.length > 1 || current[0] !== '') rows.push(current);
        current = [];
        if (ch === '\r' && text[i + 1] === '\n') i++;
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field !== '' || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] ?? '').trim();
    });
    return obj;
  });
}

/* -------------------------------------------------------------------------- */
/*  Status mapping Folk → nosso CRM                                            */
/* -------------------------------------------------------------------------- */

const PERSON_STATUS_MAP: Record<string, string> = {
  Ativo: 'Ativo',
  Lead: 'Lead',
  Quente: 'Quente',
  Reunião: 'Reunião marcada',
  'Reunião marcada': 'Reunião marcada',
  'Em andamento': 'Reunião marcada', // Folk "Em andamento" → Reunião marcada (não temos esse status pra pessoa)
  Fechado: 'Fechado',
  Perdido: 'Perdido',
};

const COMPANY_STATUS_MAP: Record<string, string> = {
  '': 'No status',
  'No status': 'No status',
  'Quero prospectar': 'Quero prospectar',
  'Reunião marcada': 'Reunião marcada',
  'Em andamento': 'Em andamento',
  Fechado: 'Fechado',
  Perdido: 'Perdido',
};

async function getStatusId(kind: 'person' | 'company', label: string): Promise<string | null> {
  const rows = await db
    .select({ id: statuses.id })
    .from(statuses)
    .where(and(eq(statuses.kind, kind), sql`LOWER(${statuses.label}) = LOWER(${label})`))
    .limit(1);
  return rows[0]?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildPersonName(row: Record<string, string>): string {
  const first = (row['firstname'] || '').trim();
  const last = (row['lastname'] || '').trim();
  return `${first} ${last}`.trim();
}

type MatchedBy = 'email' | 'alternate_email' | 'name' | 'insert';

function buildFolkMetadata(
  existing: Record<string, unknown> | null,
  folkRow: Record<string, string>,
  folkEmail: string | null,
  matchedBy: MatchedBy,
): Record<string, unknown> {
  const meta: Record<string, unknown> = { ...(existing ?? {}) };

  const channel = folkRow['Channel']?.trim().toLowerCase() || null;
  const closedDate = folkRow['Closed date']?.trim() || null;
  const dealValue = folkRow['Deal value']?.trim() || null;
  const lostReason = folkRow['Lost reason']?.trim() || null;
  const nextSteps = folkRow['Next steps']?.trim() || null;
  const folkId = folkRow['id']?.trim() || null;

  if (channel) meta.folk_channel = channel;
  if (closedDate) meta.folk_closed_date = closedDate;
  if (dealValue) meta.folk_deal_value = dealValue;
  if (lostReason) meta.folk_lost_reason = lostReason;
  if (nextSteps) meta.folk_next_steps = nextSteps;
  if (folkId) meta.folk_contact_id = folkId;

  // Emails alternativos: quando o match não veio pelo email primário, o email
  // do Folk vira "alternativo" — ele é REAL (pessoa usou em algum momento), só
  // não é o primário (que é o do form no AC).
  // Pra próxima rodada de import, esses alternates já dão match direto.
  if (folkEmail && matchedBy !== 'email') {
    const existing = Array.isArray(meta.alternate_emails) ? (meta.alternate_emails as string[]) : [];
    if (!existing.includes(folkEmail)) {
      meta.alternate_emails = [...existing, folkEmail];
    }
    meta.folk_email = folkEmail;
  }

  return meta;
}

/* -------------------------------------------------------------------------- */
/*  Main entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function importFolkCSV(formData: FormData): Promise<Result> {
  const peopleFile = formData.get('people') as File | null;
  const companiesFile = formData.get('companies') as File | null;
  const companiesNotesFile = formData.get('companies_notes') as File | null;

  if (!peopleFile && !companiesFile && !companiesNotesFile) {
    return { ok: false, error: 'Selecione ao menos um arquivo CSV.' };
  }

  const companiesResult = { inserted: 0, updated: 0, errors: 0 };
  const personsResult = {
    inserted: 0,
    updatedByEmail: 0,
    updatedByAlternateEmail: 0,
    updatedByName: 0,
    errors: 0,
  };
  const notesResult = { applied: 0, skipped: 0 };

  try {
    /* ---------- 1. COMPANIES (primeiro pra ter ID disponível pros Persons) -- */
    if (companiesFile) {
      const text = await companiesFile.text();
      const rows = parseCSV(text);

      for (const row of rows) {
        try {
          const name = (row['name'] || '').trim();
          if (!name) continue;
          const folkId = row['id']?.trim() || null;
          const statusLabel = COMPANY_STATUS_MAP[row['Status'] || ''] || 'No status';
          const statusId = await getStatusId('company', statusLabel);
          const industry = row['industry']?.trim() || null;
          const size = row['employeeRange']?.trim() || null;
          const website = row['favoriteUrl']?.trim() || null;
          const description = row['description']?.trim() || null;

          const existing = await db
            .select({ id: companies.id, metadata: companies.metadata })
            .from(companies)
            .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
            .limit(1);

          if (existing[0]) {
            const existingMeta = (existing[0].metadata as Record<string, unknown> | null) ?? {};
            const newMeta = { ...existingMeta };
            if (folkId) newMeta.folk_contact_id = folkId;

            await db
              .update(companies)
              .set({
                statusId: statusId ?? null,
                industry: sql`COALESCE(${companies.industry}, ${industry})`,
                size: sql`COALESCE(${companies.size}, ${size})`,
                website: sql`COALESCE(${companies.website}, ${website})`,
                description: sql`COALESCE(${companies.description}, ${description})`,
                metadata: newMeta,
                updatedAt: new Date(),
              })
              .where(eq(companies.id, existing[0].id));
            companiesResult.updated++;
          } else {
            await db.insert(companies).values({
              name,
              statusId: statusId ?? null,
              industry,
              size,
              website,
              description,
              metadata: folkId ? { folk_contact_id: folkId } : null,
              firstTouchAt: new Date(),
            });
            companiesResult.inserted++;
          }
        } catch (err) {
          console.error('[importFolkCSV] company error:', err);
          companiesResult.errors++;
        }
      }
    }

    /* ---------- 2. PERSONS — email primário → nome → insert ---------------- */
    if (peopleFile) {
      const text = await peopleFile.text();
      const rows = parseCSV(text);

      for (const row of rows) {
        try {
          const email = (row['favoriteEmail'] || row['emails']?.split(',')[0] || '').trim().toLowerCase();
          const name = buildPersonName(row);
          if (!email && !name) continue;

          const statusLabel = PERSON_STATUS_MAP[row['Status'] || ''] || 'Ativo';
          const statusId = await getStatusId('person', statusLabel);
          const jobTitle = row['jobTitle']?.trim() || null;
          const phone = (row['favoritePhone'] || row['phones']?.split(',')[0] || '').trim() || null;
          const linkedinUrl = row['favoriteUrl']?.trim() || null;
          const description = row['description']?.trim() || null;
          const companyName = row['companies']?.trim() || null;

          // Resolve companyId
          let companyId: string | null = null;
          if (companyName) {
            const c = await db
              .select({ id: companies.id })
              .from(companies)
              .where(sql`LOWER(${companies.name}) = LOWER(${companyName})`)
              .limit(1);
            companyId = c[0]?.id ?? null;
          }

          // ----- match em 3 níveis -----
          // 1) email primário (people.email)
          // 2) email alternativo (metadata.alternate_emails — populado pelo Cal webhook + Folk import)
          // 3) nome (firstname+lastname lower) — só se único
          let existing: { id: string; metadata: unknown } | null = null;
          let matchedBy: MatchedBy = 'insert';

          if (email) {
            // 1) email primário
            const rows1 = await db
              .select({ id: people.id, metadata: people.metadata })
              .from(people)
              .where(eq(people.email, email))
              .limit(1);
            if (rows1[0]) {
              existing = rows1[0];
              matchedBy = 'email';
            }
          }

          if (!existing && email) {
            // 2) alternate_emails — populado por Cal webhook + Folk import (match por nome)
            const rowsAlt = await db
              .select({ id: people.id, metadata: people.metadata })
              .from(people)
              .where(sql`${people.metadata}->'alternate_emails' @> ${JSON.stringify([email])}::jsonb`)
              .limit(1);
            if (rowsAlt[0]) {
              existing = rowsAlt[0];
              matchedBy = 'alternate_email';
            }
          }

          if (!existing && name) {
            // 3) nome — só se único (pra evitar update no lead errado)
            const rows2 = await db
              .select({ id: people.id, metadata: people.metadata })
              .from(people)
              .where(sql`LOWER(${people.name}) = LOWER(${name})`)
              .limit(2);
            if (rows2.length === 1) {
              existing = rows2[0];
              matchedBy = 'name';
            } else if (rows2.length > 1) {
              console.warn('[importFolkCSV] ambiguous name match, skipping:', name);
            }
          }

          // ----- ação -----
          if (existing) {
            const newMeta = buildFolkMetadata(
              existing.metadata as Record<string, unknown> | null,
              row,
              email || null,
              matchedBy,
            );

            const updates: Record<string, unknown> = {
              statusId: statusId ?? null,
              metadata: newMeta,
              updatedAt: new Date(),
            };
            if (jobTitle) updates.jobTitle = sql`COALESCE(NULLIF(${people.jobTitle}, ''), ${jobTitle})`;
            if (phone) updates.phone = sql`COALESCE(NULLIF(${people.phone}, ''), ${phone})`;
            if (linkedinUrl) updates.linkedinUrl = sql`COALESCE(NULLIF(${people.linkedinUrl}, ''), ${linkedinUrl})`;
            if (description) updates.description = sql`COALESCE(NULLIF(${people.description}, ''), ${description})`;
            if (companyId) updates.companyId = sql`COALESCE(${people.companyId}, ${companyId})`;

            await db.update(people).set(updates).where(eq(people.id, existing.id));

            if (matchedBy === 'email') personsResult.updatedByEmail++;
            else if (matchedBy === 'alternate_email') personsResult.updatedByAlternateEmail++;
            else personsResult.updatedByName++;
          } else {
            // INSERT — lead que vive só no Folk
            const newMeta = buildFolkMetadata(null, row, email || null, 'insert');
            // Se não tem email, gera placeholder único (schema exige notNull + unique)
            const insertEmail = email || `folk-${row['id'] || crypto.randomUUID()}@folk.local`;

            await db.insert(people).values({
              name: name || insertEmail,
              email: insertEmail,
              phone,
              jobTitle,
              linkedinUrl,
              description,
              companyId,
              statusId: statusId ?? null,
              sourceMethod: 'imported_folk',
              sourceChannel: 'unknown',
              metadata: newMeta,
              firstTouchAt: new Date(),
            });
            personsResult.inserted++;
          }
        } catch (err) {
          console.error('[importFolkCSV] person error:', err);
          personsResult.errors++;
        }
      }
    }

    /* ---------- 3. COMPANIES NOTES (research briefs) ----------------------- */
    if (companiesNotesFile) {
      const text = await companiesNotesFile.text();
      const rows = parseCSV(text);

      // Agrupa notas por contactId — uma empresa pode ter múltiplas notas
      const notesByCompany = new Map<string, { name: string; notes: string[] }>();
      for (const row of rows) {
        const contactId = row['contactId']?.trim();
        const contactName = row['contactName']?.trim();
        const noteContent = row['noteContent']?.trim();
        if (!contactId || !noteContent) continue;
        const existing = notesByCompany.get(contactId) ?? { name: contactName || '', notes: [] };
        existing.notes.push(noteContent);
        if (!existing.name && contactName) existing.name = contactName;
        notesByCompany.set(contactId, existing);
      }

      for (const [folkId, { name, notes }] of notesByCompany) {
        try {
          // Match: 1) folk_contact_id no metadata, 2) nome lower
          let company = (
            await db
              .select({ id: companies.id, description: companies.description, metadata: companies.metadata })
              .from(companies)
              .where(sql`${companies.metadata}->>'folk_contact_id' = ${folkId}`)
              .limit(1)
          )[0];

          if (!company && name) {
            company = (
              await db
                .select({ id: companies.id, description: companies.description, metadata: companies.metadata })
                .from(companies)
                .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
                .limit(1)
            )[0];
          }

          if (!company) {
            notesResult.skipped++;
            continue;
          }

          const combined = notes.join('\n\n---\n\n');
          const existingMeta = (company.metadata as Record<string, unknown> | null) ?? {};
          const newMeta = { ...existingMeta, folk_research_brief: combined };

          await db
            .update(companies)
            .set({
              description: sql`COALESCE(NULLIF(${companies.description}, ''), ${combined})`,
              metadata: newMeta,
              updatedAt: new Date(),
            })
            .where(eq(companies.id, company.id));
          notesResult.applied++;
        } catch (err) {
          console.error('[importFolkCSV] note error for folkId', folkId, err);
          notesResult.skipped++;
        }
      }
    }

    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    return { ok: true, companies: companiesResult, persons: personsResult, notes: notesResult };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
