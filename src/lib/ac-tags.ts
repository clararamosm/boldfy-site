/**
 * Utility to build consistent ActiveCampaign tags across all form actions
 * (report, demo, contact, beta, proposal).
 *
 * Important: this file is NOT a server action — it's pure client/server
 * utility. That's why it lives in /lib and not in /app/actions.
 * (Next.js requires all exports of 'use server' files to be async.)
 *
 * --- Convenção de prefixos (alinhada com o Notion) ---
 *
 *  Form:      tipo de form que originou o lead
 *             (ex: "Form: Demo", "Form: Report Algoritmo LinkedIn 2026")
 *  Origem:    de onde no site veio o clique
 *             (ex: "Origem: home:hero", "Origem: LP Algoritmo LinkedIn")
 *  Status:    estágio do funil — sincroniza com Status outreach (Pessoas)
 *             e Estágio (Empresas) no Notion
 *             (ex: "Status: Demo agendada", "Status: Proposta enviada")
 *  Módulo:    módulo da Boldfy de interesse
 *             (ex: "Módulo: SaaS", "Módulo: Content Full-Service")
 *  Lead:      tipo de captura
 *             (ex: "Lead: Material rico", "Lead: Demo solicitada")
 *  Segmento:  cohort persistente (espelha a DB Listas/Cohorts no Notion)
 *             (ex: "Segmento: Beta tester", "Segmento: Newsletter Boldfy")
 *  Outreach:  canal/sequência de outreach que tocou o lead
 *             (uso reservado pra automações de prospecção saindo do AC)
 */

/**
 * Forms suportados — cada um tem rota específica no `routeSegments`.
 * Adicionar form novo aqui obriga a tratar o caso no switch.
 */
export type FormType =
  | 'Report Algoritmo LinkedIn 2026'
  | 'Demo'
  | 'Contato'
  | 'Beta'
  | 'Proposta'
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

  // Beta tester é cohort permanente — quem se inscreve ENTRA no segmento
  // mesmo sem opt-in extra (a inscrição é o opt-in implícito do programa).
  if (params.formType === 'Beta') {
    segments.push('Segmento: Beta tester');
  }

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
 * Tags de classificação derivadas da intenção de uso. Diferentes de
 * `Segmento:` (que define lista) e de `Lead:` (que classifica evento) —
 * essas tags `ICP:` e `Persona:` qualificam QUEM é o lead.
 *
 * Uso principal: branch da cadência do Report (só `ICP: Empresa B2B`
 * recebe os emails de aprofundamento E2-E6).
 */
export function classificacaoIntencao(intencaoUso?: IntencaoUso): string[] {
  if (intencaoUso === 'marca-empresa') return ['ICP: Empresa B2B'];
  if (intencaoUso === 'marca-clientes') return ['Persona: Agência'];
  if (intencaoUso === 'marca-pessoal') return ['Persona: Criador'];
  return [];
}

export function buildACTags(params: {
  formType: string;
  origem?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  extraTags?: string[];
}): string[] {
  const tags: string[] = [];

  // Sempre taggeia o tipo de form
  tags.push(`Form: ${params.formType}`);

  // Origem do botão no site (ex: "home:solutions", "precos:saas", "caas:hero")
  if (params.origem) tags.push(`Origem: ${params.origem}`);

  // UTMs — cada um vira uma tag separada pra facilitar segmentação no AC
  const u = params.utms ?? {};
  if (u.utm_source) tags.push(`utm_source:${u.utm_source}`);
  if (u.utm_medium) tags.push(`utm_medium:${u.utm_medium}`);
  if (u.utm_campaign) tags.push(`utm_campaign:${u.utm_campaign}`);
  if (u.utm_content) tags.push(`utm_content:${u.utm_content}`);
  if (u.utm_term) tags.push(`utm_term:${u.utm_term}`);

  // Extras específicos do form (Lead:, Status:, Módulo:, Segmento:)
  if (params.extraTags) tags.push(...params.extraTags);

  return tags;
}
