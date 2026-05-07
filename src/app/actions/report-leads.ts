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
  classificacaoIntencao,
  routeSegments,
  type IntencaoUso,
} from '@/lib/ac-tags';
import { captureLead, upsertPessoa } from '@/lib/notion-leads';

export type ReportLeadInput = {
  nome: string;
  email: string;
  /**
   * Intenção declarada de uso do material — define qual segmento (lista
   * AC) e classificação (`ICP:`/`Persona:`) o lead recebe. Essa última é
   * o gate da cadência: só `ICP: Empresa B2B` recebe os emails E2-E6.
   */
  intencaoUso: IntencaoUso;
  /**
   * Nome da empresa onde o lead trabalha. Obrigatório APENAS quando
   * `intencaoUso === 'marca-empresa'` — pra outras intenções (marca
   * pessoal, marca de clientes) não faz sentido pedir empresa.
   */
  empresa?: string;
  origem?: string;
  /**
   * Lead marcou o checkbox de também receber a newsletter ongoing da
   * Boldfy. Default false (LGPD opt-in ativo). Quando true:
   *   - Pessoa.Email opt-in = true no Notion
   *   - Adiciona tag 'Segmento: Newsletter Boldfy' no AC
   *   - Adiciona à lista 'Newsletter Boldfy' (DB Listas/Cohorts)
   *     [feito separadamente pela automação interna do Notion]
   */
  newsletterOptIn?: boolean;
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

    // Tags de classificação (`ICP:` ou `Persona:`) derivadas da intenção.
    // O branch da automação da cadência usa `ICP: Empresa B2B` como gate
    // pra E2-E6 (não-ICP recebe só E1 com a entrega do PDF).
    const classificacaoTags = classificacaoIntencao(input.intencaoUso);

    const acTags = buildACTags({
      formType: 'Report Algoritmo LinkedIn 2026',
      origem: origemNoSite,
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
      extraTags: [
        // 'Lead: Material rico' classifica o tipo de captura — usado em
        // relatórios de aquisição (qualificação inicial do lead).
        'Lead: Material rico',
        // 'Report: Algoritmo LinkedIn 2026' é o gatilho da cadência de
        // 6 emails (1º email entrega o PDF, depois desenvolvem o tema
        // SE o lead for ICP — branch dentro da automação).
        // Mantido como tag de campanha (não-prefixada) por ser específica
        // dessa peça de conteúdo, não um cohort permanente.
        'Report: Algoritmo LinkedIn 2026',
        // Classificação ICP/Persona — gate da cadência completa.
        ...classificacaoTags,
        // Segmentos persistentes (Líderes B2B / Parceiros / Individuais
        // + Newsletter Boldfy se marcou opt-in).
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
