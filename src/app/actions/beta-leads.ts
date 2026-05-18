'use server';

/**
 * Server action para capturar leads do Programa Beta (LP /beta-test).
 *
 * Task 1 (mai/2026 — spec crm-source-of-truth):
 *  - Fluxo CRM-first via adapter + recordLeadFromForm.
 *  - Beta é 100% B2B (lider_b2b_only). Adapter já marca segment='lider_b2b'
 *    e tag legível 'Líder B2B' + 'Form: Beta Test'.
 *  - `colaboradores` vai pra company.metadata.beta_data.seats_requested
 *    (NÃO company.size — bug fix da Task 1).
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptBeta } from '@/lib/form-adapters/beta';
import { BetaLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

type BetaLeadInput = z.input<typeof BetaLeadSchema>;

export async function sendBetaLeadToNotion(
  rawInput: BetaLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Nome do export mantido pra não quebrar imports existentes.
  const parsed = parseInput(BetaLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    const lead = adaptBeta(input);

    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[beta-leads] recordLeadFromForm failed:', result.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // Nota descritiva no AC (best-effort)
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const note = [
          `🧪 Inscrição no Programa Beta`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          `WhatsApp: ${input.telefone}`,
          `Cargo: ${input.cargo}`,
          `Empresa: ${input.empresa}`,
          `Setor: ${input.setor}`,
          `Colaboradores no programa: ${input.colaboradores}`,
          `Objetivo principal: ${input.objetivoPrincipal}`,
          `Como conheceu: ${input.comoConheceu}`,
          input.observacoes ? `\n💬 ${input.observacoes}` : '',
          ``,
          `— Tracking —`,
          `Origem: ${input.origem || 'Beta Test'}`,
          input.utm_source ? `utm_source: ${input.utm_source}` : '',
          input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acContactId, note);
      }
    } catch (err) {
      console.error('[beta-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[beta-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
