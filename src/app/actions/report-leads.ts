'use server';

/**
 * Server action para capturar leads que baixam o report
 * "O Algoritmo do LinkedIn Mudou Tudo" (LP /algoritmo-linkedin).
 *
 * Form leve: nome + email + empresa.
 *
 * Fluxo de captura:
 *  1. Notion CRM (3 DBs): upsert Empresa → upsert Pessoa → cria Interação.
 *     - Pessoa não duplica se já existe (match por email).
 *     - Empresa não duplica se já existe (match por domínio do email).
 *     - Interação SEMPRE é criada (log append-only).
 *  2. ActiveCampaign: sync contato + tags pra disparar a cadência de
 *     nutrição. Anota o AC Contact ID de volta na Pessoa do Notion.
 *  3. Entrega do PDF: dupla
 *     - Download direto na tela de sucesso (link em /reports/...)
 *     - Email de confirmação disparado pela cadência do AC
 *
 * Graceful degradation: se o Notion não estiver configurado (env vars
 * faltando), só roda o AC. Se o AC falhar, lead já está salvo no Notion.
 * Em ambos os casos, retornamos success ao usuário pra não bloquear o
 * download — perder um lead em uma das integrações é melhor que
 * bloquear o usuário.
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import {
  buildACTags,
  routeSegments,
  tipoLeadFromIntencao,
} from '@/lib/ac-tags';
import { captureLead, upsertPessoa } from '@/lib/notion-leads';
import { ReportLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type ReportLeadInput = z.input<typeof ReportLeadSchema>;

export async function sendReportLead(
  rawInput: ReportLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // Validação zod — bloqueia inputs malformados antes de chamar Notion/AC
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

    // Fallback semântico pro campo `empresa`: só leads que declaram
    // intenção 'marca-empresa' informam empresa real. Pros outros, o
    // Notion ainda recebe um label coerente que identifica o tipo de
    // lead (necessário porque CaptureLeadInput.empresa é required).
    const empresaForCRM =
      input.intencaoUso === 'marca-empresa'
        ? input.empresa?.trim() || 'Empresa não informada'
        : input.intencaoUso === 'marca-clientes'
          ? 'Agência / Consultor'
          : 'Profissional Individual';

    // Label legível da intenção (pra entrar em notas e no Notion).
    const intencaoLabel =
      input.intencaoUso === 'marca-empresa'
        ? 'Marca da empresa onde trabalha'
        : input.intencaoUso === 'marca-clientes'
          ? 'Marca dos clientes (agência/consultor)'
          : 'Marca pessoal (criador/autônomo)';

    /* ---------------------------------------------------------------- */
    /*  1. Notion CRM: upsert Empresa + Pessoa + criar Interação          */
    /* ---------------------------------------------------------------- */

    let notionResult: Awaited<ReturnType<typeof captureLead>> = {
      empresaId: null,
      pessoaId: null,
      interacaoId: null,
    };

    try {
      notionResult = await captureLead({
        nome: input.nome,
        email: input.email,
        empresa: empresaForCRM,
        origemNoSite,
        // Email opt-in agora é especificamente NEWSLETTER (ongoing), não
        // a cadência transacional do report. A cadência roda
        // independente do checkbox — é o material que o lead pediu.
        emailOptIn: !!input.newsletterOptIn,
        interacaoTitulo: `Download Report Algoritmo LinkedIn — ${input.nome}`,
        interacaoTipo: 'Download material',
        interacaoCanal: 'Site',
        conteudoResumo: [
          `Baixou o report "O Algoritmo do LinkedIn Mudou Tudo" via LP.`,
          `Intenção declarada: ${intencaoLabel}.`,
          input.intencaoUso === 'marca-empresa'
            ? `Empresa informada: ${input.empresa || '(em branco)'}.`
            : '',
          input.newsletterOptIn ? `Opt-in newsletter: SIM.` : `Opt-in newsletter: não.`,
          input.utm_source ? `UTM source: ${input.utm_source}` : '',
          input.utm_medium ? `UTM medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `UTM campaign: ${input.utm_campaign}` : '',
        ]
          .filter(Boolean)
          .join(' '),
        utmSource: input.utm_source,
        utmMedium: input.utm_medium,
        utmCampaign: input.utm_campaign,
      });
    } catch (err) {
      console.error('[report-leads] Notion capture error (non-blocking):', err);
    }

    /* ---------------------------------------------------------------- */
    /*  2. ActiveCampaign: sync contato + tags                            */
    /* ---------------------------------------------------------------- */

    // Roteamento de segmentos persistentes baseado no form + intenção +
    // opt-in. A intenção declarada decide o cohort: Líderes B2B (ICP),
    // Parceiros estratégicos (agência) ou Profissionais Individuais
    // (criador). Cada segmento é uma lista no AC, vinculada via
    // automação `Tag Segmento: X → Lista X` que já está ativa.
    const segmentTags = routeSegments({
      formType: 'Report Algoritmo LinkedIn 2026',
      newsletterOptIn: input.newsletterOptIn,
      intencaoUso: input.intencaoUso,
    });

    // Classificação do lead (ICP B2B / Agência / Criador) — agora é CAMPO
    // (`tipo_lead`), não mais tags `ICP:`/`Persona:`. O If/Else da cadência
    // no AC compara `tipo_lead = "ICP B2B"` pra liberar E2-E5.
    const tipoLead = tipoLeadFromIntencao(input.intencaoUso);

    const acTags = buildACTags({
      formType: 'Report Algoritmo LinkedIn 2026',
      origem: origemNoSite,
      extraTags: [
        // 'Report: Algoritmo LinkedIn 2026' é o gatilho da cadência de
        // 5 emails (1º entrega o PDF, depois If/Else: ICP B2B recebe os
        // 4 de aprofundamento; outros encerram).
        'Report: Algoritmo LinkedIn 2026',
        // Segmentos persistentes (Líderes B2B / Parceiros / Individuais
        // + Newsletter Boldfy se marcou opt-in). Cada um dispara a
        // automação Tag→Lista que inscreve o contato na lista correta.
        ...segmentTags,
      ],
    });

    const acContactId = await syncContact({
      email: input.email,
      firstName,
      lastName,
      origem: origemNoSite,
      tags: acTags,
      fields: {
        empresa: empresaForCRM,
        // Classificação do lead (gate da cadência via If/Else)
        ...(tipoLead ? { tipo_de_lead: tipoLead } : {}),
        // UTMs de PRIMEIRO toque — substituem 5 tags `utm_*` por 3 campos
        // que aparecem direto no perfil do contato. Setados sempre que
        // existirem; idealmente "primeiro toque" deveria ser preservado
        // (não sobrescrever em capturas posteriores), mas o AC não tem
        // upsert condicional nativo — deixaremos pra próxima iteração se
        // virar dor (ver task de migration).
        ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
        ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
        ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
      },
    });

    /* ---------------------------------------------------------------- */
    /*  3. Linkagem reversa: AC Contact ID volta pra Pessoa no Notion    */
    /* ---------------------------------------------------------------- */

    if (acContactId && notionResult.pessoaId) {
      try {
        await upsertPessoa({
          nome: input.nome,
          email: input.email,
          acContactId,
        });
      } catch (err) {
        console.error('[report-leads] AC ID linkback error (non-blocking):', err);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  4. Nota no AC com tracking completo                              */
    /* ---------------------------------------------------------------- */

    if (acContactId) {
      const note = [
        `📥 Download do Report Algoritmo LinkedIn 2026`,
        ``,
        `Nome: ${input.nome}`,
        `Email: ${input.email}`,
        `Intenção: ${intencaoLabel}`,
        input.intencaoUso === 'marca-empresa'
          ? `Empresa: ${input.empresa || '(em branco)'}`
          : `Empresa: ${empresaForCRM}`,
        `Opt-in newsletter: ${input.newsletterOptIn ? 'SIM' : 'não'}`,
        ``,
        `— Tracking —`,
        `Origem: ${origemNoSite}`,
        input.utm_source ? `utm_source: ${input.utm_source}` : '',
        input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
        input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        input.utm_content ? `utm_content: ${input.utm_content}` : '',
        input.utm_term ? `utm_term: ${input.utm_term}` : '',
        ``,
        notionResult.pessoaId ? `Notion Pessoa: ${notionResult.pessoaId}` : '',
        notionResult.empresaId ? `Notion Empresa: ${notionResult.empresaId}` : '',
        notionResult.interacaoId ? `Notion Interação: ${notionResult.interacaoId}` : '',
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
    /*  5. Retorno                                                       */
    /* ---------------------------------------------------------------- */

    // Se nem Notion nem AC funcionaram, retornamos erro pra o usuário.
    // Se pelo menos um dos dois salvou, success — o lead está em algum
    // lugar e podemos reconciliar depois.
    const anySaved = !!(acContactId || notionResult.pessoaId);
    if (!anySaved) {
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    return { success: true };
  } catch (error) {
    console.error('[report-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
