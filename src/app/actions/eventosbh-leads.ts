'use server';

/**
 * Server action para capturar leads da pré-inscrição dos Eventos BH
 * (LP /eventosbh) — jun/2026.
 *
 *  - Fluxo CRM-first via adapter + recordLeadFromForm (mesmo padrão do beta).
 *  - 100% B2B (lider_b2b_only). Adapter marca segment='lider_b2b' + tag
 *    legível 'Líder B2B' + 'Form: Pré-inscrição Eventos BH'.
 *  - Só `nome`, `email` e `empresa` são obrigatórios. `telefone` (zap) e
 *    `cargo` são opcionais — atrito mínimo pra topo de funil.
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptEventosbh } from '@/lib/form-adapters/eventosbh';
import { EventosbhLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

type EventosbhLeadInput = z.input<typeof EventosbhLeadSchema>;

export async function submitEventosbhLead(
  rawInput: EventosbhLeadInput,
): Promise<{ success: boolean; error?: string }> {
  const parsed = parseInput(EventosbhLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    const lead = adaptEventosbh(input);

    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[eventosbh-leads] recordLeadFromForm failed:', result.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // Nota descritiva no AC (best-effort)
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const note = [
          `📍 Pré-inscrição Eventos BH`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          input.telefone ? `WhatsApp: ${input.telefone}` : '',
          input.cargo ? `Cargo: ${input.cargo}` : '',
          `Empresa: ${input.empresa}`,
          ``,
          `Tracking`,
          `Origem: ${input.origem || 'LP Eventos BH'}`,
          input.utm_source ? `utm_source: ${input.utm_source}` : '',
          input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acContactId, note);
      }
    } catch (err) {
      console.error('[eventosbh-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[eventosbh-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
