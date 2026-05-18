'use server';

/**
 * Server action para capturar leads de Demo.
 *
 * Task 1 (mai/2026 — spec crm-source-of-truth):
 *  - Fluxo CRM-first via adapter + recordLeadFromForm.
 *  - Demo é 100% B2B (lider_b2b_only).
 *  - Tag operacional 'Demo: Aguardando agendamento' é injetada AQUI (não no
 *    adapter) porque é flag de fluxo Cal — webhook /api/webhooks/cal remove
 *    quando lead agenda. Cadência de recuperação fica em quem não agendou.
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptDemo } from '@/lib/form-adapters/demo';
import { DemoLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type DemoLeadInput = z.input<typeof DemoLeadSchema>;

export async function sendDemoLeadToNotion(
  rawInput: DemoLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Nome do export mantido pra não quebrar imports.
  const parsed = parseInput(DemoLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    const lead = adaptDemo(input);
    // Tag operacional do fluxo Cal — webhook remove quando agendamento ocorre.
    lead.acTags = [...lead.acTags, 'Demo: Aguardando agendamento'];

    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[demo-leads] recordLeadFromForm failed:', result.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // Nota descritiva no AC (best-effort)
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const note = [
          `📅 Demo agendada via ${input.origem || 'Popup Demo'}`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          `WhatsApp: ${input.telefone}`,
          `Cargo: ${input.cargo}`,
          `Empresa: ${input.empresa}`,
          `Porte: ${input.funcionarios}`,
          ``,
          `— Tracking —`,
          `Origem no site: ${input.origem || 'Popup Demo'}`,
          input.utm_source ? `utm_source: ${input.utm_source}` : '',
          input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acContactId, note);
      }
    } catch (err) {
      console.error('[demo-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[demo-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
