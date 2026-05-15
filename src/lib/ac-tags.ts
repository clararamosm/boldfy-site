/**
 * Utility to build consistent ActiveCampaign tags across all form actions
 * (report, demo, beta, proposal).
 *
 * Important: this file is NOT a server action — it's pure client/server
 * utility. That's why it lives in /lib and not in /app/actions.
 * (Next.js requires all exports of 'use server' files to be async.)
 *
 * --- Convenção de prefixos (alinhada com o Notion) ---
 *
 *  Form:      tipo de form que originou o lead — É a tag-mãe que dispara
 *             cadências e relatórios de aquisição.
 *             (ex: "Form: Demo", "Form: Algoritmo LinkedIn 2026")
 *  Status:    estágio do funil — sincroniza com Status outreach (Pessoas)
 *             e Estágio (Empresas) no Notion
 *             (ex: "Status: Demo agendada", "Status: Proposta enviada")
 *  Módulo:    módulo da Boldfy de interesse
 *             (ex: "Módulo: SaaS", "Módulo: Content Full-Service")
 *  Segmento:  cohort persistente (espelha a DB Listas/Cohorts no Notion)
 *             (ex: "Segmento: Líderes B2B", "Segmento: Newsletter Boldfy")
 *  Outreach:  canal/sequência de outreach que tocou o lead
 *             (uso reservado pra automações de prospecção saindo do AC)
 *
 * Nota: a `Origem:` foi abolida em mai/2026 — a info ainda vai pro AC como
 * note no contato + custom fields de UTM, mas não cria tag dedicada.
 */

/**
 * Forms suportados — cada um tem rota específica no `routeSegments`.
 * Adicionar form novo aqui obriga a tratar o caso onde for relevante.
 */
export type FormType =
  | 'Algoritmo LinkedIn 2026'
  | 'Demo'
  | 'Beta Program'
  | 'Simulador de Proposta'
  | 'Newsletter';

/**
 * Intenção de uso declarada pelo lead ao baixar um material da Boldfy.
 * Essa info decide:
 *  1. O segmento (lista AC) em que o lead entra
 *  2. Se ele recebe a cadência completa (só ICP) ou apenas o E1 de entrega
 *
 * - 'marca-empresa'  → ICP. Recebe cadência completa, entra em Líderes B2B.
 * - 'marca-clientes' → Agência/consultor. Só E1, entra em Parceiros.
 * - 'marca-pessoal'  → Criador/autônomo. Só E1, entra em Profissionais
 *                       Individuais (audiência editorial pra ativar depois).
 */
export type IntencaoUso = 'marca-empresa' | 'marca-clientes' | 'marca-pessoal';

/**
 * Calcula os Segmentos persistentes (tags `Segmento:`) que o lead deve
 * receber no AC com base no form que ele preencheu, na intenção de uso
 * declarada e no opt-in opcional de newsletter.
 *
 * Diferença entre `Lead:` e `Segmento:`
 *   `Lead:` é classificação do EVENTO de captura (efêmero) — usado pra
 *           disparar cadências e relatórios de aquisição.
 *   `Segmento:` é cohort PERSISTENTE — espelha as listas que vivem no
 *               Notion (DB Listas/Cohorts). É o que decide se o lead
 *               recebe newsletter, ofertas pra parceiros etc.
 */
export function routeSegments(params: {
  formType: FormType;
  /** Lead marcou o checkbox opcional de receber a newsletter da Boldfy. */
  newsletterOptIn?: boolean;
  /**
   * Intenção declarada de uso do material (ex: report, ebook).
   * Cada intenção mapeia pra um cohort persistente no AC/Notion.
   */
  intencaoUso?: IntencaoUso;
}): string[] {
  const segments: string[] = [];

  // Form que se chama explicitamente "Newsletter" sempre vira opt-in.
  if (params.formType === 'Newsletter') {
    segments.push('Segmento: Newsletter Boldfy');
  }

  // Roteamento por intenção de uso declarada (Report Algoritmo LinkedIn e
  // futuros materiais ricos). Cada opção mapeia pra um cohort persistente:
  //   marca-empresa  → Líderes B2B (ICP)
  //   marca-clientes → Parceiros estratégicos (agências/consultores)
  //   marca-pessoal  → Profissionais Individuais (criadores/autônomos)
  if (params.intencaoUso === 'marca-empresa') {
    segments.push('Segmento: Líderes B2B');
  } else if (params.intencaoUso === 'marca-clientes') {
    segments.push('Segmento: Parceiros estratégicos');
  } else if (params.intencaoUso === 'marca-pessoal') {
    segments.push('Segmento: Profissionais Individuais');
  }

  // Opt-in adicional da newsletter, marcado em qualquer outro form.
  // Garantia de não-duplicação caso já tenha sido adicionado acima.
  if (params.newsletterOptIn && !segments.includes('Segmento: Newsletter Boldfy')) {
    segments.push('Segmento: Newsletter Boldfy');
  }

  return segments;
}

/**
 * Valor do campo customizado `tipo_lead` derivado da intenção declarada.
 * Substitui as tags `ICP:`/`Persona:` (mais ruído que sinal — cada lead
 * ganhava 1 tag de classificação que ninguém usava em filtro).
 *
 * Uso principal: gate do If/Else da cadência do Report — agora compara
 * `Campo tipo_lead = "ICP B2B"` em vez de `Tag ICP: Empresa B2B existe`.
 *
 * Migration nota: o If/Else da automação no AC precisa ser atualizado
 * MANUALMENTE pra usar esse campo antes deste código entrar em produção.
 * Caso contrário, leads novos não passarão pelo gate (e ninguém recebe
 * E2-E5).
 */
export function tipoLeadFromIntencao(intencaoUso?: IntencaoUso): string | undefined {
  if (intencaoUso === 'marca-empresa') return 'ICP B2B';
  if (intencaoUso === 'marca-clientes') return 'Agência';
  if (intencaoUso === 'marca-pessoal') return 'Criador';
  return undefined;
}

export function buildACTags(params: {
  formType: string;
  extraTags?: string[];
}): string[] {
  const tags: string[] = [];

  // Sempre taggeia o tipo de form — é a tag-mãe que dispara automações
  // (cadências, sincronização Notion, relatórios de aquisição).
  tags.push(`Form: ${params.formType}`);

  // Extras específicos do form (Status:, Módulo:, Segmento:).
  // Origem foi abolida em mai/2026 — info vai pro AC via note + UTMs.
  // UTMs e tipo_lead também saíram daqui — agora são CAMPOS (ver
  // CUSTOM_FIELDS em activecampaign.ts e tipoLeadFromIntencao acima).
  if (params.extraTags) tags.push(...params.extraTags);

  return tags;
}
