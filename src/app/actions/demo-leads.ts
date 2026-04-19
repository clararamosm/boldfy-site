'use server';

/**
 * Server action to capture Demo leads.
 *
 * Arquitetura simplificada (a partir de Abr/2026):
 * - Sem database de Pessoas/Empresas no Notion — CRM é 100% ActiveCampaign
 * - Todo lead vai pro AC com tags completas (form + origem + UTMs + porte)
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';

export type DemoLeadInput = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  funcionarios: string;
  origem?: string;
  // UTM tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export async function sendDemoLeadToNotion(
  input: DemoLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Mantido nome do export pra não quebrar as imports existentes —
  // na prática agora só dispara pro ActiveCampaign
  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags = buildACTags({
      formType: 'Demo',
      origem: input.origem || 'Popup Demo',
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
      // Tag de rastreamento: lead pediu demo mas ainda nao agendou horario
      // no Cal.com. O webhook /api/webhooks/cal remove essa tag quando a
      // pessoa agenda — permite rodar cadencia de recuperacao pra quem
      // submeteu o form mas nao chegou a escolher horario.
      extraTags: ['Demo: Aguardando agendamento'],
    });

    const contactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      phone: input.telefone,
      origem: input.origem || 'Popup Demo',
      tags: acTags,
      fields: {
        empresa: input.empresa,
        cargo: input.cargo,
        porte: input.funcionarios,
      },
    });

    if (!contactId) {
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // Anexa uma note com os dados completos ao contato
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

    // AWAIT essencial em serverless — fire-and-forget e descartado quando
    // a funcao retorna
    try {
      await addNoteToContact(contactId, note);
    } catch (err) {
      console.error('[demo-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[demo-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
