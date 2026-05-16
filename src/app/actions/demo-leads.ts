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
import { syncFolkLead } from '@/lib/folk';
import { recordLeadFromForm } from '@/lib/crm';
import { DemoLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type DemoLeadInput = z.input<typeof DemoLeadSchema>;

export async function sendDemoLeadToNotion(
  rawInput: DemoLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Validação zod — bloqueia inputs malformados antes de chamar AC
  const parsed = parseInput(DemoLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  // Mantido nome do export pra não quebrar as imports existentes —
  // na prática agora só dispara pro ActiveCampaign
  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags = buildACTags({
      formType: 'Demo',
      extraTags: [
        // Demo é form 100% B2B — adiciona segmento automático (dispara a
        // automação Tag→Lista no AC que inscreve em Líderes B2B).
        'Segmento: Líderes B2B',
        // Tag de rastreamento: lead pediu demo mas ainda nao agendou
        // horario no Cal.com. O webhook /api/webhooks/cal remove essa
        // tag quando a pessoa agenda — permite rodar cadencia de
        // recuperacao pra quem submeteu o form mas nao chegou a escolher.
        'Demo: Aguardando agendamento',
      ],
    });

    const contactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      phone: input.telefone,
      tags: acTags,
      fields: {
        empresa: input.empresa,
        cargo: input.cargo,
        porte: input.funcionarios,
        // Demo é form 100% B2B por gate de UI — marca explicitamente
        tipo_de_lead: 'ICP B2B',
        intencao_uso: 'marca-empresa',
        // UTMs de primeiro toque (substituem tags utm_* — ver ac-tags.ts)
        ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
        ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
        ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
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

    // CRM Boldfy (dual-write) — nosso DB próprio, vai substituir Folk em breve.
    // Sprint 1 do CRM: começamos escrevendo em paralelo. Sprint 4: removemos Folk.
    // Falha aqui não bloqueia (graceful degradation).
    try {
      await recordLeadFromForm({
        name: input.nome,
        email: input.email,
        phone: input.telefone,
        jobTitle: input.cargo,
        companyName: input.empresa,
        companySize: input.funcionarios,
        acContactId: contactId,
        sourceChannel: (input.utm_source as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | undefined) ?? 'unknown',
        sourcePage: input.origem,
        sourceMethod: 'form_demo',
        utmCampaign: input.utm_campaign,
        activityType: 'form_submit_demo',
        activityData: {
          form_type: 'demo',
          origem: input.origem,
          utm_source: input.utm_source,
          utm_medium: input.utm_medium,
          utm_campaign: input.utm_campaign,
        },
      });
    } catch (err) {
      console.error('[demo-leads] CRM dual-write error (non-blocking):', err);
    }

    // Folk: lead vai como Person status=Lead + Company status=No status.
    // Demo é form 100% B2B → todo lead vai pro Folk sem gate.
    // Failure aqui não bloqueia o sucesso do AC (que é fonte de verdade).
    // TODO Sprint 4 CRM: remover esse bloco depois da migração do Folk.
    try {
      await syncFolkLead({
        person: {
          email: input.email,
          firstName,
          lastName,
          phone: input.telefone,
          jobTitle: input.cargo,
          status: 'Lead',
          customFields: {
            form_origem: 'Demo',
            ac_contact_id: contactId,
            ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
            ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
            ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
          },
        },
        company: {
          name: input.empresa,
          customFields: {
            origem: 'Demo',
            porte: input.funcionarios,
          },
        },
      });
    } catch (err) {
      console.error('[demo-leads] Folk sync error (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[demo-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
