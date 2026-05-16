/**
 * Bootstrap dos custom fields novos no ActiveCampaign.
 *
 * Cria via API os 4 campos que o form sempre coletou mas só guardava em
 * NOTAS (e por isso não aparecia estruturado na aba Formulários):
 *
 *   1. INTENCAO_USO       — Intenção de uso (Marca empresa / Desenvolver-se)
 *   2. NEWSLETTER_OPT_IN  — Opt-in newsletter (SIM/NÃO)
 *   3. COMO_CONHECEU      — Como conheceu a Boldfy
 *   4. OBSERVACOES        — Observações livres
 *
 * Idempotent: se o campo já existe (mesmo perstag), não duplica — retorna o ID
 * existente. Pode rodar quantas vezes precisar.
 *
 * Depois disso rodar, os forms passam a popular esses campos nos próximos
 * submits (via syncContact.fields). Pros leads ANTIGOS, o import enriquecido
 * extrai esses dados das notas (parseFormNote).
 */

'use server';

import { createCustomFieldIfMissing } from '@/lib/activecampaign';

type FieldSpec = {
  perstag: string;
  title: string;
  type: 'text' | 'textarea';
};

const FIELDS_TO_CREATE: FieldSpec[] = [
  { perstag: 'INTENCAO_USO', title: 'Intenção de uso', type: 'text' },
  { perstag: 'NEWSLETTER_OPT_IN', title: 'Newsletter opt-in', type: 'text' },
  { perstag: 'COMO_CONHECEU', title: 'Como conheceu a Boldfy', type: 'text' },
  { perstag: 'OBSERVACOES', title: 'Observações', type: 'textarea' },
];

export type BootstrapResult =
  | { ok: true; created: Array<{ perstag: string; id: string | null; status: 'created_or_existing' | 'failed' }> }
  | { ok: false; error: string };

export async function bootstrapACCustomFields(): Promise<BootstrapResult> {
  if (!process.env.ACTIVECAMPAIGN_API_URL || !process.env.ACTIVECAMPAIGN_API_KEY) {
    return { ok: false, error: 'AC não configurado (env vars ausentes)' };
  }

  const results: Array<{ perstag: string; id: string | null; status: 'created_or_existing' | 'failed' }> = [];
  for (const field of FIELDS_TO_CREATE) {
    const id = await createCustomFieldIfMissing(field);
    results.push({
      perstag: field.perstag,
      id,
      status: id ? 'created_or_existing' : 'failed',
    });
  }

  return { ok: true, created: results };
}
