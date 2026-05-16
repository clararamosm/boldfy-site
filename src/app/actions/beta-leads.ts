'use server';

/**
 * Server action para capturar leads do Programa Beta (LP /beta-test).
 *
 * Arquitetura (mai/2026 — pós-deprecação do Notion CRM):
 *  - AC é o universo geral (cadência, segmentação, tag-mãe).
 *  - Folk é o CRM B2B (em integração na próxima etapa): vira Company
 *    em Prospects + Person em Leads. Como Beta é form 100% B2B, todo
 *    lead aqui vai pro Folk sem gate.
 *  - Notion não recebe mais nada relacionado a Beta.
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';
import { syncFolkLead } from '@/lib/folk';
import { recordLeadFromForm } from '@/lib/crm';
import { BetaLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

type BetaLeadInput = z.input<typeof BetaLeadSchema>;

export async function sendBetaLeadToNotion(
  rawInput: BetaLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Nome do export mantido pra não quebrar imports existentes — na
  // prática só dispara pro AC (+ Folk quando estiver plugado).
  const parsed = parseInput(BetaLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Beta é form 100% B2B — adiciona `Segmento: Líderes B2B` automático
    // (dispara a automação Tag→Lista que inscreve na lista no AC).
    const acTags = buildACTags({
      formType: 'Beta Program',
      extraTags: ['Segmento: Líderes B2B'],
    });

    const acId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      phone: input.telefone,
      tags: acTags,
      fields: {
        empresa: input.empresa,
        cargo: input.cargo,
        porte: input.colaboradores,
        setor: input.setor,
        objetivo_principal: input.objetivoPrincipal,
        como_conheceu: input.comoConheceu,
        // Beta é form 100% B2B
        tipo_de_lead: 'ICP B2B',
        intencao_uso: 'marca-empresa',
        ...(input.observacoes ? { observacoes: input.observacoes } : {}),
        // UTMs de primeiro toque (substituem tags utm_* — ver ac-tags.ts)
        ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
        ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
        ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
      },
    });

    if (!acId) {
      console.warn('[beta-leads] AC syncContact returned null — verificar env vars.');
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    /* -------------------------------------------------------------- */
    /*  Folk (TODO — próxima etapa)                                    */
    /* -------------------------------------------------------------- */
    // await syncFolkLead({
    //   person: { nome, email, telefone, cargo },
    //   company: { nome: input.empresa, setor: input.setor, porte: input.colaboradores },
    //   status: 'Lead', // Beta é form B2B → entra direto como Lead
    // });

    const note = [
      `🧪 Inscrição no Programa Beta`,
      ``,
      `Nome: ${input.nome}`,
      `Email: ${input.email}`,
      `WhatsApp: ${input.telefone}`,
      `Cargo: ${input.cargo}`,
      `Empresa: ${input.empresa}`,
      `Setor: ${input.setor}`,
      `Colaboradores: ${input.colaboradores}`,
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

    try {
      await addNoteToContact(acId, note);
    } catch (err) {
      console.error('[beta-leads] Error adding note (non-blocking):', err);
    }

    // CRM Boldfy (dual-write) — nosso DB próprio, vai substituir Folk em breve.
    try {
      await recordLeadFromForm({
        name: input.nome,
        email: input.email,
        phone: input.telefone,
        jobTitle: input.cargo,
        companyName: input.empresa,
        companyIndustry: input.setor,
        companySize: input.colaboradores,
        acContactId: acId,
        sourceChannel: (input.utm_source as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | undefined) ?? 'unknown',
        sourcePage: input.origem,
        sourceMethod: 'form_beta',
        utmCampaign: input.utm_campaign,
        activityType: 'form_submit_beta',
        activityData: {
          form_type: 'beta',
          objetivo_principal: input.objetivoPrincipal,
          como_conheceu: input.comoConheceu,
          observacoes: input.observacoes,
          utm_source: input.utm_source,
          utm_medium: input.utm_medium,
          utm_campaign: input.utm_campaign,
        },
      });
    } catch (err) {
      console.error('[beta-leads] CRM dual-write error (non-blocking):', err);
    }

    // Folk: Beta é form 100% B2B → todo lead vai pro Folk como Person Lead.
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
            form_origem: 'Beta',
            ac_contact_id: acId,
            ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
            ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
            ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
          },
        },
        company: {
          name: input.empresa,
          industry: input.setor,
          customFields: {
            origem: 'Beta',
            porte: input.colaboradores,
          },
        },
      });
    } catch (err) {
      console.error('[beta-leads] Folk sync error (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[beta-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
