/**
 * Adapter pro form Playbook de Employee-Led Growth
 * (mai/2026, LP `/ferramentas/playbook-employee-led-growth`).
 *
 * Naming: slug interno SEMPRE espelha o slug da URL pública. Termos genéricos
 * tipo 'playbook' são proibidos — quando o segundo playbook chegar, 'playbook'
 * deixaria de identificar de qual estamos falando. Ver AGENTS.md.
 *
 * Particularidades:
 *  - Sempre `segment='lider_b2b'` — o gate de elegibilidade (porte ≥ 3 +
 *    cargo válido) já filtrou autônomos/parceiros na UI antes do submit.
 *  - Coleta cargo (seniority + area) — primeiro form a usar os enums
 *    `job_seniority` e `job_area` da migration 0004. Esses enums viram
 *    colunas dedicadas em people (padrão recorrente pra forms futuros).
 *  - Quiz tem 11 respostas fechadas + 1 aberta opcional. Tudo vai pro
 *    `form_data.playbook` em metadata + activity_data (timeline rica).
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md §8.
 */

import type { z } from 'zod';
import type { PlaybookEmployeeLedGrowthLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import { getChannelHint, combineSourcePage } from '../source-detection';
import type { ClassifiedLead } from './types';

type PlaybookInput = z.infer<typeof PlaybookEmployeeLedGrowthLeadSchema>;

const FORM_SLUG = 'playbook-employee-led-growth' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Label legível pra exibição no AC (custom field tipo_de_lead).
 * Sempre 'Líder B2B' nesse form — gate já filtrou.
 */
const TIPO_LEAD_LABEL = 'Líder B2B';

export function adaptPlaybookEmployeeLedGrowth(input: PlaybookInput): ClassifiedLead {
  // Segment é sempre 'lider_b2b' nesse form (gate ≥5 colab no UI). Mesma
  // garantia do Beta/Demo/Proposta.
  const segment = 'lider_b2b' as const;
  const newsletterOptIn = input.newsletterOptIn === true;

  /**
   * State of ELG — opt-OUT por default (Zod default true). A pessoa precisa
   * desmarcar o toggle pra negar. Rastreado em acFields, activityData e
   * personMetadataPatch pra auditoria + futuras queries em state_elg_aggregates.
   *
   * Ver SPEC-playbook-state-of-elg-consent.md §4.
   */
  const stateElgConsent = input.stateElgConsent !== false;

  /**
   * State of ELG — opt-IN pra receber relatório. Só dispara inscrição na
   * lista AC `[Lista] Report: Panorama ELG no Brasil` se a pessoa marcou
   * explicitamente. UI bloqueia esse checkbox quando consent off.
   */
  const stateElgReportSubscribe = input.stateElgReportSubscribe === true;

  // Listas extras condicionais (resolvidas em buildAcListNames de crm.ts).
  const extraAcListNames: string[] = [];
  if (stateElgReportSubscribe) {
    extraAcListNames.push('[Lista] Report: Panorama ELG no Brasil');
  }

  // Canal: utm_source explícito > inferência via referrer > 'direct'/'unknown'.
  const channel = getChannelHint({ utmSource: input.utm_source, referrer: input.referrer });

  // Tags AC (4 famílias): Líder B2B + Form: Playbook ELG + Newsletter (opcional).
  const acTags = buildLegibleACTags({
    segment,
    formAcTag: def.acTag, // 'Form: Playbook Employee-Led Growth'
    newsletterOptIn,
  });

  // Custom fields AC — gates da cadência + segmentação. Incluem dados do
  // quiz pra automation segmentar (ex: dispara nurture diferente pra
  // budget=aprovado vs precisa_justificar).
  //
  // P8 vira multi (mai/2026): `dores_principais` chega como array. No AC
  // sincronizamos como STRING CONCATENADA com vírgula (`"CAC subindo, Concorrente
  // dominando"`) pra simplificar segmentação — AC não suporta arrays nativos em
  // custom fields, e regras de automation com `contains` cobrem o caso.
  const acFields: ClassifiedLead['acFields'] = {
    tipo_de_lead: TIPO_LEAD_LABEL,
    empresa: input.empresa,
    porte: String(input.porteColaboradores),
    setor: input.setor,
    // Custom fields enviados como LABELS LEGÍVEIS em português (não enum cru)
    // pra ficar bom de filtrar/segmentar no painel do AC. Conversão via
    // helpers label*() na parte de baixo deste arquivo.
    cargo_senioridade: labelSeniority(input.cargoSenioridade),
    cargo_area: labelArea(input.cargoArea),
    dores_principais: input.doresPrincipais.map(labelDorPrincipal).join(', '),
    budget_status: labelBudget(input.budgetStatus),
    // P11 reformulada: 'sim_proprio' | 'sim_full_content' | 'nao_foco' (mai/2026)
    // Detecta oportunidade de Full Content (CaaS) — segmentação no AC.
    sponsorship_lideranca: labelSponsorship(input.sponsorshipLideranca),
    tentativas_anteriores: labelTentativas(input.tentativasAnteriores),
    newsletter_opt_in: newsletterOptIn ? 'SIM' : 'NAO',
    // Compromisso 3 ativos (jun/2026): só vem populado quando a pessoa
    // passou pela tela intermediária (porte 5-20). Se respondeu NÃO o lead
    // nem chega aqui (cai em not-eligible), então o valor relevante é 'SIM'
    // ou ausência. Omitindo quando undefined pra não poluir leads grandes.
    ...(input.porteCompromisso5Ativos === true
      ? { porte_compromisso_5_ativos: 'SIM' }
      : {}),
    // Gasto em ads (jun/2026): só vem populado quando a pessoa respondeu
    // (pulou = ausência). Vai como label legível pra ficar fácil de filtrar
    // no AC ("R$ 11k a R$ 50k / mês" em vez de "11_a_50k").
    ...(input.gastoMensalAds
      ? { gasto_mensal_ads: labelGastoMensalAds(input.gastoMensalAds) }
      : {}),
    // State of ELG — campos de auditoria pra segmentação no AC.
    state_elg_consent: stateElgConsent ? 'SIM' : 'NAO',
    state_elg_report_subscribe: stateElgReportSubscribe ? 'SIM' : 'NAO',
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — vai pra timeline (mostra TODOS os campos preenchidos
  // no lead detail do CRM). Inclusive os campos redundantes com acFields
  // — a renderização da timeline vai puxar daqui (não do AC).
  const activityData: Record<string, unknown> = {
    form_type: FORM_SLUG,
    // Identidade
    nome: input.nome,
    email: input.email,
    empresa: input.empresa,
    telefone: input.telefone ?? null,
    // Respostas do quiz
    porte_colaboradores: input.porteColaboradores,
    // Só inclui quando a pergunta foi feita (porte 5-20). Undefined
    // significa que a empresa tem >20 e o piso de 3 ativos é trivial.
    ...(input.porteCompromisso5Ativos !== undefined
      ? { porte_compromisso_5_ativos: input.porteCompromisso5Ativos }
      : {}),
    cargo_senioridade: input.cargoSenioridade,
    cargo_area: input.cargoArea,
    setor: input.setor,
    // P5 (colaboradores_postando) e P9 (resultados_prioritarios) removidas
    // na curadoria mai/2026. Preservadas no payload SE chegarem (retrocompat).
    ...(input.colaboradoresPostando ? { colaboradores_postando: input.colaboradoresPostando } : {}),
    voz_atual: input.vozAtual,
    tentativas_anteriores: input.tentativasAnteriores,
    // Gasto em ads (jun/2026, opcional). Crú pra timeline; legível foi pro AC.
    gasto_mensal_ads: input.gastoMensalAds ?? null,
    dores_principais: input.doresPrincipais,
    ...(input.resultadosPrioritarios ? { resultados_prioritarios: input.resultadosPrioritarios } : {}),
    budget_status: input.budgetStatus,
    sponsorship_lideranca: input.sponsorshipLideranca,
    observacoes_livres: input.observacoesLivres ?? null,
    // Consent + tracking
    lgpd_consent: input.lgpdConsent,
    newsletter_opt_in: newsletterOptIn,
    // State of ELG — fica em metadata.form_data pra histórico (Opção A
    // da SPEC §3.3 — sem colunas dedicadas em people por enquanto).
    state_elg_consent: stateElgConsent,
    state_elg_report_subscribe: stateElgReportSubscribe,
    origem: input.origem ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_content: input.utm_content ?? null,
    utm_term: input.utm_term ?? null,
    /**
     * Engajamento (mai/2026) — consent LGPD + ga4_client_id capturados em
     * captureSubmissionMeta(). Aparece na aba Engajamento + timeline do
     * perfil. Campos opcionais.
     */
    engagement: {
      consent_status: input.consent_status,
      ga4_client_id: input.ga4_client_id,
    },
  };

  return {
    // Person canônicos
    name: input.nome,
    email: input.email,
    phone: input.telefone || undefined,
    // jobTitle não é coletado granularmente — concatenamos seniority+area
    // pra ter algo legível no perfil mesmo sem campo livre.
    jobTitle: `${labelSeniority(input.cargoSenioridade)} de ${labelArea(input.cargoArea)}`,

    // Company
    companyName: input.empresa,
    companyIndustry: input.setor,
    companySize: String(input.porteColaboradores),

    // Classificação
    segment,
    newsletterOptIn,
    formSlug: FORM_SLUG,

    // State of ELG — consent + opt-in pra report (rastreável no CRM,
    // resolvido em listas no buildAcListNames via extraAcListNames).
    stateElgConsent,
    stateElgReportSubscribe,
    extraAcListNames,

    // Cargo — colunas dedicadas em people (enums novos da migration 0004)
    jobSeniority: input.cargoSenioridade,
    jobArea: input.cargoArea,

    // Tags + Custom fields AC
    acTags,
    acFields,

    // Tracking
    sourceChannel: channel,
    // Quiz tem URL canônica fixa, mas combineSourcePage tolera (path repetido vai pro mesmo lugar)
    sourcePage: combineSourcePage('Quiz Playbook ELG', input.landing_pathname ?? '/ferramentas/playbook-employee-led-growth'),
    sourceMethod: 'form_playbook_employee_led_growth',
    firstTouchSource: input.utm_source ?? input.origem ?? channel,
    firstTouchCampaign: input.utm_campaign ?? undefined,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign ?? undefined,

    // Activity payload
    activityData,
    source: 'web',

    // Metadata patch — todas as respostas vão pra metadata.form_data.playbook
    // (estrutura agrupada por form pra evitar colisão com outros).
    personMetadataPatch: {
      form_data: {
        playbook_employee_led_growth: activityData,
      },
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Pretty labels (compartilhado com o render engine de páginas /playbook)    */
/* -------------------------------------------------------------------------- */

function labelSeniority(s: PlaybookInput['cargoSenioridade']): string {
  return ({
    analista: 'Analista',
    coordenador: 'Coordenador',
    gerente: 'Gerente',
    diretor: 'Diretor',
    c_level: 'C-Level',
  } as const)[s];
}

function labelArea(a: PlaybookInput['cargoArea']): string {
  return ({
    marketing: 'Marketing',
    growth: 'Growth',
    vendas: 'Vendas',
    rh: 'RH / People',
    employer_branding: 'Employer Branding',
    comunicacao: 'Comunicação',
    outro: 'Outro',
  } as const)[a];
}

function labelTentativas(t: PlaybookInput['tentativasAnteriores']): string {
  return ({
    nunca: 'Nunca tentou',
    morreu: 'Tentou e morreu',
    baixa_adesao: 'Tem mas com baixa adesão',
    maduro: 'Programa maduro',
  } as const)[t];
}

function labelDorPrincipal(d: NonNullable<PlaybookInput['doresPrincipais']>[number]): string {
  return ({
    company_page_morta: 'Company Page sem engajamento',
    cac_subindo: 'CAC subindo',
    concorrente_dominando: 'Concorrente domina o feed',
    vendedor_invisivel: 'Vendedores invisíveis',
    talento_saindo: 'Talentos saindo',
    marca_uma_pessoa: 'Marca depende de uma pessoa',
    outra: 'Outra',
  } as const)[d];
}

function labelBudget(b: PlaybookInput['budgetStatus']): string {
  return ({
    aprovado: 'Verba aprovada',
    planejando: 'Planejando incluir',
    precisa_justificar: 'Precisa justificar',
    sem_budget: 'Sem budget',
  } as const)[b];
}

/**
 * P11 reformulada (mai/2026) tem 3 valores novos (sim_proprio, sim_full_content,
 * nao_foco) + 4 valores antigos preservados pra retrocompat de payloads
 * pre-curadoria. Label cobre os 7 casos.
 */
function labelSponsorship(s: PlaybookInput['sponsorshipLideranca']): string {
  return ({
    sim_proprio: 'Sim, alguns executivos postam',
    sim_full_content: 'Sim, com Full Content',
    nao_foco: 'Não é prioridade',
    sim_alguns_postam: 'Sim, alguns executivos postam',
    sim_com_ajuda: 'Sim, precisariam de ajuda',
    talvez: 'Talvez, depende da proposta',
    nao: 'Não topariam',
  } as const)[s];
}

/**
 * Label legível das faixas de gasto em ads pra exibição no AC (jun/2026).
 * Casa com as opções em wizard-config.ts (P11.5). Argumento NonNullable
 * pra o caller só chamar quando o respondente preencheu.
 */
function labelGastoMensalAds(g: NonNullable<PlaybookInput['gastoMensalAds']>): string {
  return ({
    zero: 'Não investe em ads',
    ate_10k: 'Até R$ 10k / mês',
    '11_a_50k': 'R$ 11k a R$ 50k / mês',
    '51_a_100k': 'R$ 51k a R$ 100k / mês',
    '101_a_300k': 'R$ 101k a R$ 300k / mês',
    acima_300k: 'Mais de R$ 300k / mês',
  } as const)[g];
}
