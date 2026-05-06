'use server';

/**
 * Server action para capturar leads que baixam o report
 * "O Algoritmo do LinkedIn Mudou Tudo" (LP /algoritmo-linkedin).
 *
 * Form leve: nome + email + empresa. Sem Notion DB — vai direto pro
 * ActiveCampaign com tags + nota completa, igual demo-leads.
 *
 * A entrega do PDF é dupla:
 *  - Download direto na tela de sucesso (link em /reports/algoritmo-linkedin-2026-boldfy.pdf)
 *  - Email da cadência de nutrição disparada pelo AC com base na tag
 *    'Report: Algoritmo LinkedIn 2026'
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';

export type ReportLeadInput = {
  nome: string;
  email: string;
  empresa: string;
  origem?: string;
  // UTM tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export async function sendReportLead(
  input: ReportLeadInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags = buildACTags({
      formType: 'Report Algoritmo LinkedIn 2026',
      origem: input.origem || 'LP Algoritmo LinkedIn',
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
      // A tag 'Report: Algoritmo LinkedIn 2026' é o gatilho da cadência
      // de nutrição no ActiveCampaign. O 1º email entrega o PDF, os
      // seguintes desenvolvem o tema e levam pra agendar conversa.
      extraTags: ['Report: Algoritmo LinkedIn 2026', 'Lead: Material rico'],
    });

    const contactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      origem: input.origem || 'LP Algoritmo LinkedIn',
      tags: acTags,
      fields: {
        empresa: input.empresa,
      },
    });

    if (!contactId) {
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    const note = [
      `📥 Download do Report Algoritmo LinkedIn 2026`,
      ``,
      `Nome: ${input.nome}`,
      `Email: ${input.email}`,
      `Empresa: ${input.empresa}`,
      ``,
      `— Tracking —`,
      `Origem: ${input.origem || 'LP Algoritmo LinkedIn'}`,
      input.utm_source ? `utm_source: ${input.utm_source}` : '',
      input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
      input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
      input.utm_content ? `utm_content: ${input.utm_content}` : '',
      input.utm_term ? `utm_term: ${input.utm_term}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await addNoteToContact(contactId, note);
    } catch (err) {
      console.error('[report-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[report-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
