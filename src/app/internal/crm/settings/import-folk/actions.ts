/**
 * Import do Folk via UPLOAD CSV.
 *
 * Aceita os 2 CSVs que o Folk exporta:
 *   - people.csv (do grupo Leads)
 *   - companies.csv (do grupo Prospects)
 *
 * Aplica:
 *   - INSERT/UPDATE Companies match por nome lower
 *   - UPDATE Persons match por email
 *   - Status do Folk vence
 *   - Outros campos só preenche se vazios
 *   - Vincula Person → Company
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
      persons: { updated: number; notFound: number; errors: number };
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
          // Escaped quote
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
  'Em andamento': 'Em andamento',
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
/*  Main entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function importFolkCSV(formData: FormData): Promise<Result> {
  const peopleFile = formData.get('people') as File | null;
  const companiesFile = formData.get('companies') as File | null;

  if (!peopleFile && !companiesFile) {
    return { ok: false, error: 'Selecione ao menos um arquivo CSV.' };
  }

  const companiesResult = { inserted: 0, updated: 0, errors: 0 };
  const personsResult = { updated: 0, notFound: 0, errors: 0 };

  try {
    /* ---------- Companies primeiro (pra ter ID disponível pros Persons) ----- */
    if (companiesFile) {
      const text = await companiesFile.text();
      const rows = parseCSV(text);

      for (const row of rows) {
        try {
          const name = (row['name'] || '').trim();
          if (!name) continue;
          const statusLabel = COMPANY_STATUS_MAP[row['Status'] || ''] || 'No status';
          const statusId = await getStatusId('company', statusLabel);
          const industry = row['industry']?.trim() || null;
          const size = row['employeeRange']?.trim() || null;
          const website = row['favoriteUrl']?.trim() || null;
          const description = row['description']?.trim() || null;

          // Tenta update primeiro
          const existing = await db
            .select({ id: companies.id })
            .from(companies)
            .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
            .limit(1);

          if (existing[0]) {
            await db
              .update(companies)
              .set({
                statusId: statusId ?? null,
                industry: sql`COALESCE(${companies.industry}, ${industry})`,
                size: sql`COALESCE(${companies.size}, ${size})`,
                website: sql`COALESCE(${companies.website}, ${website})`,
                description: sql`COALESCE(${companies.description}, ${description})`,
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

    /* ---------- Persons (UPDATE apenas — quem está só no AC fica) ---------- */
    if (peopleFile) {
      const text = await peopleFile.text();
      const rows = parseCSV(text);

      for (const row of rows) {
        try {
          const email = (row['favoriteEmail'] || row['emails']?.split(',')[0] || '').trim().toLowerCase();
          if (!email) continue;

          const statusLabel = PERSON_STATUS_MAP[row['Status'] || ''] || 'Ativo';
          const statusId = await getStatusId('person', statusLabel);
          const jobTitle = row['jobTitle']?.trim() || null;
          const phone = (row['favoritePhone'] || row['phones']?.split(',')[0] || '').trim() || null;
          const linkedinUrl = row['favoriteUrl']?.trim() || null;
          const description = row['description']?.trim() || null;
          const companyName = row['companies']?.trim() || null;
          const channel = row['Channel']?.trim().toLowerCase() || null;
          const closedDate = row['Closed date']?.trim() || null;
          const dealValue = row['Deal value']?.trim() || null;
          const lostReason = row['Lost reason']?.trim() || null;
          const nextSteps = row['Next steps']?.trim() || null;

          // Verifica se person existe
          const existing = await db
            .select({ id: people.id, metadata: people.metadata })
            .from(people)
            .where(eq(people.email, email))
            .limit(1);

          if (!existing[0]) {
            personsResult.notFound++;
            continue;
          }

          // Resolve companyId se tiver
          let companyId: string | null = null;
          if (companyName) {
            const c = await db
              .select({ id: companies.id })
              .from(companies)
              .where(sql`LOWER(${companies.name}) = LOWER(${companyName})`)
              .limit(1);
            companyId = c[0]?.id ?? null;
          }

          // Merge metadata Folk
          const existingMeta = (existing[0].metadata as Record<string, unknown> | null) ?? {};
          const newMeta = { ...existingMeta };
          if (channel) newMeta.folk_channel = channel;
          if (closedDate) newMeta.folk_closed_date = closedDate;
          if (dealValue) newMeta.folk_deal_value = dealValue;
          if (lostReason) newMeta.folk_lost_reason = lostReason;
          if (nextSteps) newMeta.folk_next_steps = nextSteps;

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

          await db.update(people).set(updates).where(eq(people.id, existing[0].id));
          personsResult.updated++;
        } catch (err) {
          console.error('[importFolkCSV] person error:', err);
          personsResult.errors++;
        }
      }
    }

    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    return { ok: true, companies: companiesResult, persons: personsResult };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
