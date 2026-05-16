'use server';

/**
 * Server action para capturar leads que baixam o report
 * "O Algoritmo do LinkedIn Mudou Tudo" (LP /algoritmo-linkedin).
 *
 * Form leve: nome + email + empresa (opcional) + intenção declarada.
 *
 * Fluxo de captura (mai/2026 — pós-deprecação do Notion CRM):
 *  1. ActiveCampaign: sync contato + tags pra disparar a cadência de
 *     nutrição. O gate da cadência (E2-E5) é o campo `tipo_de_lead`.
 *  2. Folk (CRM de vendas, pluga em etapa seguinte): só leads com
 *     intenção `marca-empresa` viram Company em Prospects + Person em
 *     Leads no Folk. Parceiros/criadores ficam só no AC.
 *  3. Entrega do PDF: dupla — download direto na tela de sucesso +
 *     email transacional disparado pela cadência do AC.
 *
 * Notion CRM (Pessoas/Empresas/Interações) foi removido — substituído
 * por AC (universo geral) + Folk (CRM B2B). O Notion continua sendo a
 * fonte de verdade SÓ pro blog e pro storage do JSON da proposta.
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import {
  buildACTags,
  routeSegments,
  tipoLeadFromIntencao,
} from '@/lib/ac-tags';
import { syncFolkLead } from '@/lib/folk';
import { recordLeadFromForm } from '@/lib/crm';
import { ReportLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type ReportLeadInput = z.input<typeof ReportLeadSchema>;

export async function sendReportLead(
  rawInput: ReportLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Validação zod — bloqueia inputs malformados antes de chamar o AC
  const parsed = parseInput(ReportLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const origemNoSite = input.origem || 'LP Algoritmo LinkedIn';

    // Empresa só faz sentido pra quem declarou `marca-empresa`. Os outros
    // ramos não preenchem esse campo no form, então gravamos vazio (o
    // Folk faz enrich depois quando esse lead chegar lá; AC fica sem o
    // custom field `empresa` quando não tem nome real).
    const empresaInformada =
      input.intencaoUso === 'marca-empresa'
        ? input.empresa?.trim() || ''
        : '';

    // Label legível da intenção (pra entrar em notas no AC).
    const intencaoLabel =
      input.intencaoUso === 'marca-empresa'
        ? 'Marca da empresa onde trabalha'
        : input.intencaoUso === 'marca-clientes'
          ? 'Marca dos clientes (agência/consultor)'
          : 'Marca pessoal (criador/autônomo)';

    /* ---------------------------------------------------------------- */
    /*  1. ActiveCampaign: sync contato + tags                            */
    /* ---------------------------------------------------------------- */

    // Roteamento de segmentos persistentes baseado no form + intenção +
    // opt-in. A intenção declarada decide o cohort: Líderes B2B (ICP),
    // Parceiros estratégicos (agência) ou Profissionais Individuais
    // (criador). Cada segmento é uma tag no AC, vinculada via automação
    // `Tag Segmento: X → Lista X` que já está ativa.
    const segmentTags = routeSegments({
      formType: 'Algoritmo LinkedIn 2026',
      newsletterOptIn: input.newsletterOptIn,
      intencaoUso: input.intencaoUso,
    });

    // Classificação do lead (ICP B2B / Agência / Criador) — agora é CAMPO
    // (`tipo_de_lead`), não mais tags `ICP:`/`Persona:`. O If/Else da
    // cadência no AC compara `tipo_de_lead = "ICP B2B"` pra liberar E2-E5.
    const tipoLead = tipoLeadFromIntencao(input.intencaoUso);

    const acTags = buildACTags({
      // 'Form: Algoritmo LinkedIn 2026' é o ÚNICO gatilho da cadência
      // de 5 emails (1º entrega o PDF, depois If/Else: ICP B2B recebe
      // os 4 de aprofundamento; outros encerram).
      formType: 'Algoritmo LinkedIn 2026',
      // Segmentos persistentes (Líderes B2B / Parceiros / Individuais
      // + Newsletter Boldfy se marcou opt-in). Cada um dispara a
      // automação Tag→Lista que inscreve o contato na lista correta.
      extraTags: segmentTags,
    });

    const acContactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      tags: acTags,
      fields: {
        // Só grava empresa no AC se foi efetivamente informada — pros
        // outros ramos não polui o perfil com label semântico.
        ...(empresaInformada ? { empresa: empresaInformada } : {}),
        // Classificação do lead (gate da cadência via If/Else)
        ...(tipoLead ? { tipo_de_lead: tipoLead } : {}),
        // UTMs de PRIMEIRO toque — substituem 5 tags `utm_*` por 3 campos
        // que aparecem direto no perfil do contato. Setados sempre que
        // existirem; idealmente "primeiro toque" deveria ser preservado
        // (não sobrescrever em capturas posteriores), mas o AC não tem
        // upsert condicional nativo — deixaremos pra próxima iteração se
        // virar dor.
        ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
        ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
        ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
      },
    });

    /* ---------------------------------------------------------------- */
    /*  2. Folk: SÓ se intenção é marca-empresa (gate ICP B2B)           */
    /* ---------------------------------------------------------------- */
    // Report gera 3 tipos de leads (ICP B2B / Agência / Criador). Só os
    // ICP B2B viram leads de vendas — esses entram no Folk como Ativo
    // (só baixou material, ainda não preencheu form B2B). Os outros 2
    // tipos ficam só no AC pra cadência editorial.
    if (input.intencaoUso === 'marca-empresa' && acContactId) {
      try {
        await syncFolkLead({
          person: {
            email: input.email,
            firstName,
            lastName,
            status: 'Ativo',
            customFields: {
              form_origem: 'Report B2B',
              ac_contact_id: acContactId,
              ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
              ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
              ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
            },
          },
          // Só cria company se empresa foi informada — senão Folk Enrich
          // pode preencher depois a partir do email (Clara paga conta de Enrich).
          ...(empresaInformada
            ? {
                company: {
                  name: empresaInformada,
                  customFields: {
                    origem: 'Report B2B',
                  },
                },
              }
            : {}),
        });
      } catch (err) {
        console.error('[report-leads] Folk sync error (non-blocking):', err);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  2.5 CRM Boldfy (dual-write) — escreve TODOS os leads (gate é só */
    /*       no Folk). No nosso CRM filtramos por sourceMethod depois.   */
    /* ---------------------------------------------------------------- */
    if (acContactId) {
      try {
        await recordLeadFromForm({
          name: input.nome,
          email: input.email,
          jobTitle: undefined, // Report não captura cargo
          companyName: empresaInformada || undefined,
          acContactId,
          sourceChannel: (input.utm_source as 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | undefined) ?? 'unknown',
          sourcePage: origemNoSite,
          sourceMethod: 'form_report',
          utmCampaign: input.utm_campaign,
          activityType: 'form_submit_report',
          activityData: {
            form_type: 'report',
            intencao_uso: input.intencaoUso,
            tipo_lead: tipoLead,
            newsletter_opt_in: input.newsletterOptIn,
            utm_source: input.utm_source,
            utm_medium: input.utm_medium,
            utm_campaign: input.utm_campaign,
            utm_content: input.utm_content,
            utm_term: input.utm_term,
          },
        });
      } catch (err) {
        console.error('[report-leads] CRM dual-write error (non-blocking):', err);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  3. Nota no AC com tracking completo                              */
    /* ---------------------------------------------------------------- */

    if (acContactId) {
      const note = [
        `📥 Download do Report Algoritmo LinkedIn 2026`,
        ``,
        `Nome: ${input.nome}`,
        `Email: ${input.email}`,
        `Intenção: ${intencaoLabel}`,
        empresaInformada ? `Empresa: ${empresaInformada}` : '',
        `Opt-in newsletter: ${input.newsletterOptIn ? 'SIM' : 'não'}`,
        ``,
        `— Tracking —`,
        `Origem: ${origemNoSite}`,
        input.utm_source ? `utm_source: ${input.utm_source}` : '',
        input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
        input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        input.utm_content ? `utm_content: ${input.utm_content}` : '',
        input.utm_term ? `utm_term: ${input.utm_term}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await addNoteToContact(acContactId, note);
      } catch (err) {
        console.error('[report-leads] Error adding note (non-blocking):', err);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  4. Retorno                                                       */
    /* ---------------------------------------------------------------- */

    if (!acContactId) {
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    return { success: true };
  } catch (error) {
    console.error('[report-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
