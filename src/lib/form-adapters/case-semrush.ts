/**
 * Adapter pro form Case Semrush ELG ("Bastidores de uma estratégia que virou
 * referência global"). Meio-funil — pede mais qualificação que o algoritmo-
 * linkedin (report de topo).
 *
 * Naming: slug interno SEMPRE espelha o slug da URL pública (/case-semrush).
 * Termos genéricos tipo 'case' são proibidos — quando o segundo case chegar,
 * 'case' deixaria de identificar de qual estamos falando. Ver AGENTS.md.
 *
 * Particularidades:
 *  - Mesmo padrão topo_funil do algoritmo-linkedin: pergunta intencao_uso,
 *    deriva segment dinamicamente (3 possibilidades).
 *  - Quando intencao_uso='marca-empresa': captura cargo + porte (tamanho da
 *    empresa) também — campos que o algoritmo-linkedin não pega. Pros outros
 *    casos (agência, criador), só nome+email+intenção+newsletter.
 *  - Tags AC: 'Form: Case Semrush ELG' (cadência criada depois) + segment +
 *    newsletter conforme opt-in. Mesmo helper buildLegibleACTags.
 *  - source_method dedicado 'form_case_semrush' (migration 0002) pra
 *    diferenciar do algoritmo-linkedin nos analytics do CRM.
 */

import type { z } from 'zod';
import type { CaseSemrushLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags, segmentFromIntencao } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import type { ClassifiedLead } from './types';
import type { SourceChannel } from '../crm';

type CaseSemrushInput = z.infer<typeof CaseSemrushLeadSchema>;

const FORM_SLUG = 'case-semrush' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Mapeia o select de tamanho da empresa pro valor textual que vai no custom
 * field `porte` do AC. Labels legíveis (não os values do select) — o time
 * de SDR lê isso direto no contato sem precisar decodificar.
 */
function tamanhoEmpresaLabel(v: CaseSemrushInput['tamanhoEmpresa']): string | undefined {
  switch (v) {
    case 'ate-10': return 'Até 10 colaboradores';
    case '11-50': return '11-50 colaboradores';
    case '51-200': return '51-200 colaboradores';
    case '201-500': return '201-500 colaboradores';
    case '500+': return '500+ colaboradores';
    default: return undefined;
  }
}

/**
 * Mapeia utm_source pro enum SourceChannel. Fallback 'unknown' quando
 * UTM não bate com nenhum canal conhecido. Mesma lógica do algoritmo-linkedin.
 */
function utmSourceToChannel(src: string | undefined): SourceChannel {
  const known: SourceChannel[] = ['linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual'];
  if (src && (known as string[]).includes(src)) return src as SourceChannel;
  return 'unknown';
}

export function adaptCaseSemrush(input: CaseSemrushInput): ClassifiedLead {
  const segment = segmentFromIntencao(input.intencaoUso);
  const newsletterOptIn = input.newsletterOptIn === true;
  const isB2B = input.intencaoUso === 'marca-empresa';

  // Campos B2B só vêm quando intencao_uso='marca-empresa' (validação no
  // schema + gate na UI). Pros outros casos, viram undefined.
  const empresaInformada = isB2B ? input.empresa?.trim() || undefined : undefined;
  const cargoInformado = isB2B ? input.cargo?.trim() || undefined : undefined;
  const porteInformado = isB2B ? tamanhoEmpresaLabel(input.tamanhoEmpresa) : undefined;

  const channel = utmSourceToChannel(input.utm_source);

  // Tag-mãe + segment + newsletter. Cadência da tag-mãe ainda não está
  // configurada no AC — Clara cria depois. Por enquanto, lead recebe o PDF
  // só pelo botão de download da tela de sucesso (não por email).
  const acTags = buildLegibleACTags({
    segment,
    formAcTag: def.acTag,
    newsletterOptIn,
  });

  // Label legível pro custom field `tipo_de_lead`. Mesmo padrão do
  // algoritmo-linkedin.
  const tipoLead =
    segment === 'lider_b2b' ? 'Líder B2B'
    : segment === 'parceiro' ? 'Parceiro estratégico'
    : segment === 'profissional_individual' ? 'Profissional individual'
    : undefined;

  const acFields: ClassifiedLead['acFields'] = {
    ...(empresaInformada ? { empresa: empresaInformada } : {}),
    ...(cargoInformado ? { cargo: cargoInformado } : {}),
    ...(porteInformado ? { porte: porteInformado } : {}),
    ...(tipoLead ? { tipo_de_lead: tipoLead } : {}),
    intencao_uso: input.intencaoUso,
    newsletter_opt_in: newsletterOptIn ? 'SIM' : 'NAO',
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — tudo que o form captura, pra timeline mostrar como chips.
  const activityData: Record<string, unknown> = {
    form_type: 'case-semrush',
    nome: input.nome,
    email: input.email,
    ...(empresaInformada ? { empresa: empresaInformada } : {}),
    ...(cargoInformado ? { cargo: cargoInformado } : {}),
    ...(porteInformado ? { porte: porteInformado } : {}),
    intencao_uso: input.intencaoUso,
    tipo_lead: tipoLead,
    newsletter_opt_in: newsletterOptIn,
    ...(input.origem ? { origem: input.origem } : {}),
    utms: {
      source: input.utm_source,
      medium: input.utm_medium,
      campaign: input.utm_campaign,
      content: input.utm_content,
      term: input.utm_term,
    },
  };

  // metadata.form_data — campos legíveis na sidebar do perfil.
  const personMetadataPatch: Record<string, unknown> = {
    form_data: {
      intencao_uso: input.intencaoUso,
      tipo_de_lead: tipoLead,
      ...(empresaInformada ? { empresa: empresaInformada } : {}),
      ...(cargoInformado ? { cargo: cargoInformado } : {}),
      ...(porteInformado ? { porte: porteInformado } : {}),
    },
  };

  return {
    name: input.nome,
    email: input.email,
    jobTitle: cargoInformado,
    companyName: empresaInformada,
    companySize: porteInformado,
    segment,
    newsletterOptIn,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    sourcePage: input.origem || 'LP Case Semrush ELG',
    sourceMethod: 'form_case_semrush',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
