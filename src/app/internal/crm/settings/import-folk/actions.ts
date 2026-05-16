/**
 * Import inicial do Folk pro nosso CRM.
 *
 * Estratégia:
 *  - Lê Companies do grupo Prospects do Folk (paginado) → upsert por nome
 *  - Lê Persons do grupo Leads do Folk → match com Company se tiver, upsert por email
 *  - Status do Folk vence (Clara disse que tá mais atualizado lá)
 *  - Idempotent: match por email/nome, não duplica
 *
 * Folk vai ser desativado em fase 2 — esse código é descartável junto.
 */

'use server';

import {
  listAllFolkPersons,
  listAllFolkCompanies,
  getFolkLeadsGroupId,
  getFolkProspectsGroupId,
  isFolkConfigured,
  type FolkPersonRaw,
  type FolkCompanyRaw,
} from '@/lib/folk';
import { upsertPerson, upsertCompany, logActivity } from '@/lib/crm';
import { db, people, companies, statuses } from '@/db';
import { eq, and, sql } from 'drizzle-orm';

type Result = {
  ok: true;
  importedPeople: number;
  updatedPeople: number;
  importedCompanies: number;
  updatedCompanies: number;
  errors: number;
} | { ok: false; error: string };

const SLEEP_MS = 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/*  Extract helpers — Folk armazena custom fields aninhados por groupId       */
/* -------------------------------------------------------------------------- */

function extractCustomField(
  obj: FolkPersonRaw | FolkCompanyRaw,
  groupId: string | undefined,
  field: string,
): string | undefined {
  if (!groupId) return undefined;
  const groupValues = obj.customFieldValues?.[groupId];
  if (!groupValues) return undefined;
  const value = groupValues[field];
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    return (value as { name: string }).name;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  Mappers Folk → nosso CRM                                                   */
/* -------------------------------------------------------------------------- */

async function getStatusIdByLabel(kind: 'person' | 'company', label: string): Promise<string | null> {
  const rows = await db
    .select({ id: statuses.id })
    .from(statuses)
    .where(and(eq(statuses.kind, kind), sql`LOWER(${statuses.label}) = LOWER(${label})`))
    .limit(1);
  return rows[0]?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Import Companies — primeiro, pra ter o ID disponível pros Persons         */
/* -------------------------------------------------------------------------- */

async function importCompanies(prospectsGroupId: string | undefined): Promise<{ imported: number; updated: number; errors: number; idMap: Map<string, string> }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const idMap = new Map<string, string>(); // folkCompanyId → nosso companyId

  for await (const batch of listAllFolkCompanies()) {
    for (const c of batch) {
      try {
        const statusLabel = extractCustomField(c, prospectsGroupId, 'Status');
        const origem = extractCustomField(c, prospectsGroupId, 'origem');
        const porte = extractCustomField(c, prospectsGroupId, 'porte');

        // Upsert company (match por nome lower)
        const result = await upsertCompany({
          name: c.name,
          industry: c.industry,
          size: porte,
        });

        if (!result.ok) {
          errors++;
          continue;
        }

        idMap.set(c.id, result.data.id);

        // Atualiza status se vier do Folk
        if (statusLabel) {
          const statusId = await getStatusIdByLabel('company', statusLabel);
          if (statusId) {
            await db
              .update(companies)
              .set({ statusId, updatedAt: new Date() })
              .where(eq(companies.id, result.data.id));
          }
        }

        // Heurística pra contar imported vs updated: se created muito recentemente, é novo
        const isNew = (Date.now() - new Date(result.data.createdAt).getTime()) < 60_000;
        if (isNew) imported++;
        else updated++;
      } catch (err) {
        console.error('[import-folk] company error:', c.name, err);
        errors++;
      }
    }
    await sleep(SLEEP_MS);
  }

  return { imported, updated, errors, idMap };
}

/* -------------------------------------------------------------------------- */
/*  Import Persons — depois, linkando com companies já importadas             */
/* -------------------------------------------------------------------------- */

async function importPersons(
  leadsGroupId: string | undefined,
  companyIdMap: Map<string, string>,
): Promise<{ imported: number; updated: number; errors: number }> {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for await (const batch of listAllFolkPersons()) {
    for (const p of batch) {
      try {
        const email = p.emails?.[0]?.trim().toLowerCase();
        if (!email) {
          errors++;
          continue;
        }

        const statusLabel = extractCustomField(p, leadsGroupId, 'Status');
        const linkedinUrl = extractCustomField(p, leadsGroupId, 'linkedin_url');

        // Resolve companyId: pega primeira company do Folk, mapeia pra nossa
        const folkCompanyId = p.companies?.[0]?.id;
        const ourCompanyId = folkCompanyId ? companyIdMap.get(folkCompanyId) : undefined;

        // Verifica se já existe pra reportar como updated
        const existing = await db
          .select({ id: people.id, createdAt: people.createdAt })
          .from(people)
          .where(eq(people.email, email))
          .limit(1);
        const wasExisting = !!existing[0];

        const result = await upsertPerson({
          name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || email,
          email,
          phone: p.phones?.[0],
          jobTitle: p.jobTitle,
          linkedinUrl,
          sourceChannel: 'manual',
          sourceMethod: 'imported_folk',
        }, ourCompanyId);

        if (!result.ok) {
          errors++;
          continue;
        }

        // Folk vence em conflito: atualiza status sempre que vier
        if (statusLabel) {
          const statusId = await getStatusIdByLabel('person', statusLabel);
          if (statusId) {
            await db
              .update(people)
              .set({ statusId, updatedAt: new Date() })
              .where(eq(people.id, result.data.id));
          }
        }

        // Activity sintética de importação
        await logActivity({
          personId: result.data.id,
          type: 'imported_from_folk',
          weight: 0,
          source: 'system',
          data: { folk_person_id: p.id, folk_status: statusLabel },
        });

        if (wasExisting) updated++;
        else imported++;
      } catch (err) {
        console.error('[import-folk] person error:', err);
        errors++;
      }
    }
    await sleep(SLEEP_MS);
  }

  return { imported, updated, errors };
}

/* -------------------------------------------------------------------------- */
/*  Main entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function importFromFolk(): Promise<Result> {
  if (!isFolkConfigured()) {
    return { ok: false, error: 'Folk não configurado (FOLK_API_KEY, FOLK_GROUP_LEADS_ID, FOLK_GROUP_PROSPECTS_ID ausentes)' };
  }

  try {
    const prospectsGroupId = getFolkProspectsGroupId();
    const leadsGroupId = getFolkLeadsGroupId();

    // 1) Companies primeiro
    const companyResult = await importCompanies(prospectsGroupId);

    // 2) Persons depois, usando idMap pra linkar
    const personResult = await importPersons(leadsGroupId, companyResult.idMap);

    return {
      ok: true,
      importedPeople: personResult.imported,
      updatedPeople: personResult.updated,
      importedCompanies: companyResult.imported,
      updatedCompanies: companyResult.updated,
      errors: companyResult.errors + personResult.errors,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
