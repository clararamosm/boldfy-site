/**
 * Adapter pro form Playbook de Employee-Led Growth
 * (mai/2026, LP `/ferramentas/playbook-employee-led-growth`).
 *
 * Naming: slug interno SEMPRE espelha o slug da URL pública. Termos genéricos
 * tipo 'playbook' são proibidos — quando o segundo playbook chegar, 'playbook'
 * deixaria de identificar de qual estamos falando. Ver AGENTS.md.
 *
 * Particularidades:
 *  - Sempre `segment='lider_b2b'` — o gate de elegibilidade (porte ≥ 5 +
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
import type { ClassifiedLead } from './types';
import type { SourceChannel } from '../crm';

type PlaybookInput = z.infer<typeof PlaybookEmployeeLedGrowthLeadSchema>;

const FORM_SLUG = 'playbook-employee-led-growth' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Mapeia utm_source pro enum SourceChannel. Fallback 'unknown' quando UTM
 * não bate com nenhum canal conhecido. Mesmo padrão de algoritmo-linkedin.ts.
 */
function utmSourceToChannel(src: string | undefined): SourceChannel {
  const known: SourceChannel[] = [
    'linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual',
  ];
  if (src && (known as string[]).includes(src)) return src as SourceChannel;
  return 'unknown';
}

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
  const channel = utmSourceToChannel(input.utm_source);

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
    cargo_senioridade: input.cargoSenioridade,
    cargo_area: input.cargoArea,
    dores_principais: input.doresPrincipais.join(', '),
    budget_status: input.budgetStatus,
    sponsorship_lideranca: input.sponsorshipLideranca,
    tentativas_anteriores: input.tentativasAnteriores,
    newsletter_opt_in: newsletterOptIn ? 'SIM' : 'NAO',
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
    cargo_senioridade: input.cargoSenioridade,
    cargo_area: input.cargoArea,
    setor: input.setor,
    colaboradores_postando: input.colaboradoresPostando,
    voz_atual: input.vozAtual,
    tentativas_anteriores: input.tentativasAnteriores,
    dores_principais: input.doresPrincipais,
    resultados_prioritarios: input.resultadosPrioritarios,
    budget_status: input.budgetStatus,
    sponsorship_lideranca: input.sponsorshipLideranca,
    observacoes_livres: input.observacoesLivres ?? null,
    // Consent + tracking
    lgpd_consent: input.lgpdConsent,
    newsletter_opt_in: newsletterOptIn,
    origem: input.origem ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_content: input.utm_content ?? null,
    utm_term: input.utm_term ?? null,
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

    // Cargo — colunas dedicadas em people (enums novos da migration 0004)
    jobSeniority: input.cargoSenioridade,
    jobArea: input.cargoArea,

    // Tags + Custom fields AC
    acTags,
    acFields,

    // Tracking
    sourceChannel: channel,
    sourcePage: '/ferramentas/playbook-employee-led-growth',
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
