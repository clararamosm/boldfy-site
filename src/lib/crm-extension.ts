/**
 * Lib do fluxo de captura da extensão Chrome.
 *
 * Spec: /source-of-truth/specs/SPEC-extension-linkedin.md.
 *
 * Wrappers de alto nível pros endpoints `/api/extension/capture-person` e
 * `/api/extension/capture-company` chamarem. Reusa `recordLeadFromForm`
 * (pessoa) e `upsertCompany` (empresa) — captura LinkedIn é cidadã do fluxo
 * de forms (§9 do crm-source-of-truth-fluxo-form.md).
 *
 * Funções aqui são thin wrappers — toda regra de dedup, segment, status
 * vive nos lugares canônicos (crm.ts, statuses.ts). Aqui só faz:
 *   - Captura de pessoa: adapt → recordLeadFromForm
 *   - Captura de empresa: adapt → upsertCompany + promoção de status +
 *     activity 'extension_company_capture'
 */

import { db, companies, statuses, activities } from '@/db';
import { eq } from 'drizzle-orm';
import { upsertCompany, recordLeadFromForm } from './crm';
import { getStatuses } from './statuses';
import {
  adaptLinkedInExtension,
  adaptLinkedInCompanyExtension,
  type LinkedInExtensionInput,
  type LinkedInCompanyExtensionInput,
} from './form-adapters';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  Captura de pessoa                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Endpoint `/api/extension/capture-person` chama isso direto.
 *
 * Reusa `recordLeadFromForm` — mesmo pipeline dos forms do site (upsertCompany,
 * upsertPerson com dedup por linkedinUrl, logActivity, classifyPersonBySourceMethod).
 *
 * AC sync é skipped automaticamente porque o adapter retorna `syncToAC=false`.
 */
export async function captureLinkedinPerson(
  input: LinkedInExtensionInput,
): Promise<Result<{ personId: string; companyId?: string }>> {
  const lead = adaptLinkedInExtension(input);
  const result = await recordLeadFromForm(lead);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

/* -------------------------------------------------------------------------- */
/*  Captura de empresa                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Endpoint `/api/extension/capture-company` chama isso.
 *
 * Regras de status da empresa (spec §6.1):
 *   - Empresa nova → cria com status "Quero prospectar"
 *   - Existia em "No status" → promove pra "Quero prospectar"
 *   - Existia em status mais avançado (Reunião marcada, Em andamento, etc) →
 *     mantém (regra de não-regressão)
 *
 * Logs activity `extension_company_capture` na company (sem person) pra
 * timeline da empresa.
 */
export async function captureLinkedinCompany(
  input: LinkedInCompanyExtensionInput,
): Promise<Result<{ companyId: string; promoted: boolean; created: boolean }>> {
  const adapted = adaptLinkedInCompanyExtension(input);

  // 1. upsertCompany cuida do match por nome (case-insensitive) — primeira
  //    chave de dedup. Quando a captura traz linkedinUrl novo, upsertCompany
  //    preenche o campo se vazio.
  //
  // Nota: a unique constraint nova `idx_companies_linkedin_url` (migration
  // 0007) garante que recapturas com mesmo URL caem no mesmo row, mesmo se
  // o nome tiver variação ("Boldfy" vs "Boldfy LLC"). Conflict é tratado
  // graciosamente: upsertCompany roda a query de match por nome primeiro,
  // depois INSERT. Em caso de race (2 requests simultâneas com mesmo URL),
  // a 2ª UNIQUE viola e o Postgres retorna erro — caller pode retentar.
  const c = await upsertCompany({
    name: adapted.name,
    industry: adapted.industry,
    size: adapted.size,
    website: adapted.website,
    linkedinUrl: adapted.linkedinUrl,
    metadataPatch: adapted.metadataPatch,
  });

  if (!c.ok) return { ok: false, error: c.error };

  // 2. Lê estado pós-upsert pra decidir promoção.
  const [current] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, c.data.id))
    .limit(1);
  if (!current) return { ok: false, error: 'Empresa sumiu logo após upsert' };

  // 3. Promove status se aplicável.
  const allStatuses = await getStatuses('company');
  const noStatusId = allStatuses.find((s) => s.label === 'No status')?.id;
  const queroProspectar = allStatuses.find((s) => s.label === 'Quero prospectar');

  let promoted = false;
  const isNewlyCreated = current.statusId === noStatusId || current.statusId === null;

  if (queroProspectar && isNewlyCreated) {
    await db
      .update(companies)
      .set({ statusId: queroProspectar.id, updatedAt: new Date() })
      .where(eq(companies.id, current.id));
    promoted = true;
  }
  // Se já estiver em status mais avançado, NÃO mexe (não-regressão §6.1).

  // 4. Log activity na company timeline.
  await db.insert(activities).values({
    companyId: current.id,
    type: 'extension_company_capture',
    weight: 0,
    source: 'linkedin',
    data: {
      source_url: input.sourceUrl,
      captured_at: input.capturedAt,
      promoted_to: promoted ? 'quero_prospectar' : null,
    },
  });

  // `created` indica se upsertCompany inseriu (vs atualizou). Conservativo:
  // se firstTouchAt veio agora (sem firstTouchAt no input), considera novo.
  // Pra simplificar a sinalização ao popup da extensão, retornamos `promoted`
  // que cobre ambos cenários de "saiu do limbo".
  return {
    ok: true,
    data: { companyId: current.id, promoted, created: isNewlyCreated && promoted },
  };
}
