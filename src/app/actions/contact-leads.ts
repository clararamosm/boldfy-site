'use server';

/**
 * Server action to capture generic contact form leads.
 *
 * Arquitetura simplificada (a partir de Abr/2026):
 * - Sem database de Contatos no Notion — CRM é 100% ActiveCampaign
 * - Lead vai pro AC com tags (form + origem + UTMs + colaboradores)
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';

type ContactLeadInput = {
  nome: string;
  email: string;
  telefone?: string;
  empresa: string;
  colaboradores?: string;
  mensagem?: string;
  origem?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export async function sendContactLeadToNotion(
  input: ContactLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Mantido nome do export pra compatibilidade — na prática só dispara pro AC
  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags = buildACTags({
      formType: 'Contato',
      origem: input.origem || 'Site - Contato',
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
    });

    const contactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      phone: input.telefone,
      origem: input.origem || 'Site - Contato',
      tags: acTags,
      fields: {
        empresa: input.empresa,
        porte: input.colaboradores,
      },
    });

    if (!contactId) {
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // Anexa note com os detalhes (incluindo a mensagem livre do usuário)
    const note = [
      `📨 Contato via ${input.origem || 'Formulário'}`,
      ``,
      `Nome: ${input.nome}`,
      `Email: ${input.email}`,
      input.telefone ? `Telefone: ${input.telefone}` : '',
      `Empresa: ${input.empresa}`,
      input.colaboradores ? `Colaboradores: ${input.colaboradores}` : '',
      ``,
      input.mensagem ? `💬 Mensagem:\n${input.mensagem}` : '',
      ``,
      `— Tracking —`,
      `Origem no site: ${input.origem || 'Site - Contato'}`,
      input.utm_source ? `utm_source: ${input.utm_source}` : '',
      input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
      input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    // AWAIT essencial em serverless
    try {
      await addNoteToContact(contactId, note);
    } catch (err) {
      console.error('[contact-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[contact-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
