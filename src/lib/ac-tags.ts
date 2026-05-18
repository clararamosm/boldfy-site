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
 *
 * Mai/2026 ciclo 3 — REFORMULADO:
 *   Antes retornava "ICP B2B", "Agência", "Criador" — labels diferentes dos
 *   segmentos correspondentes ("Líderes B2B", "Parceiros estratégicos",
 *   "Profissionais Individuais"). Causava confusão (duas classificações
 *   paralelas pra mesma coisa).
 *
 *   Agora retorna o MESMO label do segmento (singular). Elimina conceito
 *   duplicado "ICP B2B" — se a pessoa é Líder B2B, ponto.
 *
 * Migration nota: o If/Else da automação no AC continua comparando o campo
 * tipo_lead. Atualizar o gate no AC pra comparar com 'Líder B2B' (novo)
 * em vez de 'ICP B2B' (antigo). Ver §7.16 do spec.
 */
export function tipoLeadFromIntencao(intencaoUso?: IntencaoUso): string | undefined {
  if (intencaoUso === 'marca-empresa') return 'Líder B2B';
  if (intencaoUso === 'marca-clientes') return 'Parceiro';
  if (intencaoUso === 'marca-pessoal') return 'Profissional Individual';
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

/* -------------------------------------------------------------------------- */
/*  buildLegibleACTags — naming legível (Task 1 — CRM source of truth)         */
/* -------------------------------------------------------------------------- */
/**
 * Constrói o set MÍNIMO de tags AC pro novo fluxo CRM-first. 4 famílias só:
 *
 *  1. Tipo de lead (1):  'Líder B2B' | 'Parceiro estratégico' | 'Profissional individual'
 *  2. Form de origem (1): 'Form: Algoritmo LinkedIn 2026' | 'Form: Beta Test' |
 *                          'Form: Demo' | 'Form: Proposta' | 'Form: LinkedIn'
 *                          (vem do form_definitions.ac_tag — NÃO renomeado)
 *  3. Newsletter (opcional): 'Newsletter' se opt-in true
 *  4. Unsubscribed (opcional): 'Unsubscribed' se webhook AC indicou unsub
 *
 * Substitui `routeSegments` + `buildACTags` no fluxo novo dos adapters.
 * Aliases antigos (Segmento: X, ICP: X, Persona: X) saem na Task 3 (cleanup).
 *
 * IMPORTANTE: a tag-mãe (Form: ...) é a que dispara a cadência atual do AC.
 * Naming foi MANTIDO específico por slug pra não quebrar automation existente.
 */
export function buildLegibleACTags(params: {
  segment: 'lider_b2b' | 'parceiro' | 'profissional_individual' | null;
  formAcTag: string; // vem de form_definitions.acTag (ex: 'Form: Beta Test')
  newsletterOptIn?: boolean;
  unsubscribed?: boolean;
}): string[] {
  const tags: string[] = [];

  // Tipo de lead (1 das 3 ou nenhuma se segment=null)
  if (params.segment === 'lider_b2b') tags.push('Líder B2B');
  else if (params.segment === 'parceiro') tags.push('Parceiro estratégico');
  else if (params.segment === 'profissional_individual') tags.push('Profissional individual');

  // Form de origem (sempre presente — vem da form_definition correspondente)
  tags.push(params.formAcTag);

  if (params.newsletterOptIn) tags.push('Newsletter');
  if (params.unsubscribed) tags.push('Unsubscribed');

  return tags;
}

/**
 * Helper inverso pra retro-compat — converte LeadSegment do CRM em label
 * legível pra exibir em UI (badge no header do perfil, etc).
 */
export function segmentLabel(segment: string | null | undefined): string | null {
  switch (segment) {
    case 'lider_b2b': return 'Líder B2B';
    case 'parceiro': return 'Parceiro estratégico';
    case 'profissional_individual': return 'Profissional individual';
    default: return null;
  }
}

/**
 * Deriva LeadSegment a partir da intencao_uso do form Report. Centralizado
 * aqui pra adapter de report.ts e backfill da Task 3 usarem a mesma regra.
 *
 * Forms B2B-only (Beta/Demo/Proposta/extensão) NÃO usam essa função —
 * sempre derivam segment='lider_b2b' direto.
 */
export function segmentFromIntencao(
  intencaoUso: IntencaoUso | undefined,
): 'lider_b2b' | 'parceiro' | 'profissional_individual' | null {
  if (intencaoUso === 'marca-empresa') return 'lider_b2b';
  if (intencaoUso === 'marca-clientes') return 'parceiro';
  if (intencaoUso === 'marca-pessoal') return 'profissional_individual';
  return null;
}
