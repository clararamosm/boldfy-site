/**
 * Adapter pro form Beta Test. 100% B2B (lider_b2b_only).
 *
 * Particularidades:
 *  - segment SEMPRE 'lider_b2b' (gate de UI implícito).
 *  - newsletter_opt_in NÃO existe (não tem checkbox no form Beta).
 *  - `setor` → company.industry, `colaboradores` → company.metadata.beta_data
 *    .seats_requested (NÃO company.size — colaboradores aqui é "quantos vão
 *    pro programa beta", diferente de tamanho real da empresa).
 */

import type { z } from 'zod';
import type { BetaLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import type { ClassifiedLead } from './types';
import type { SourceChannel } from '../crm';

type BetaInput = z.infer<typeof BetaLeadSchema>;

const FORM_SLUG = 'beta' as const;
const def = getFormDefinitionSync(FORM_SLUG);

function utmSourceToChannel(src: string | undefined): SourceChannel {
  const known: SourceChannel[] = ['linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual'];
  if (src && (known as string[]).includes(src)) return src as SourceChannel;
  return 'unknown';
}

export function adaptBeta(input: BetaInput): ClassifiedLead {
  const channel = utmSourceToChannel(input.utm_source);

  const acTags = buildLegibleACTags({
    segment: 'lider_b2b',
    formAcTag: def.acTag,
    newsletterOptIn: false,
  });

  const acFields: ClassifiedLead['acFields'] = {
    empresa: input.empresa,
    cargo: input.cargo,
    setor: input.setor,
    // Mantém porte populado com colaboradores pra cadência do AC que
    // referenciava o campo histórico (mesmo sendo semanticamente "seats").
    porte: input.colaboradores,
    objetivo_principal: input.objetivoPrincipal,
    como_conheceu: input.comoConheceu,
    tipo_de_lead: 'Líder B2B',
    intencao_uso: 'marca-empresa',
    ...(input.observacoes ? { observacoes: input.observacoes } : {}),
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  const activityData: Record<string, unknown> = {
    form_type: 'beta',
    objetivo_principal: input.objetivoPrincipal,
    como_conheceu: input.comoConheceu,
    observacoes: input.observacoes,
    setor: input.setor,
    colaboradores_para_beta: input.colaboradores,
    utms: {
      source: input.utm_source,
      medium: input.utm_medium,
      campaign: input.utm_campaign,
      content: input.utm_content,
      term: input.utm_term,
    },
  };

  const personMetadataPatch: Record<string, unknown> = {
    form_data: {
      cargo: input.cargo,
      objetivo_principal: input.objetivoPrincipal,
      como_conheceu: input.comoConheceu,
      ...(input.observacoes ? { observacoes: input.observacoes } : {}),
    },
  };

  // colaboradores → company.metadata.beta_data.seats_requested
  // (≠ size — size é tamanho real da empresa que aqui não vem do form)
  const companyMetadataPatch: Record<string, unknown> = {
    beta_data: {
      seats_requested: input.colaboradores,
      captured_at: new Date().toISOString(),
    },
  };

  return {
    name: input.nome,
    email: input.email,
    phone: input.telefone,
    jobTitle: input.cargo,
    companyName: input.empresa,
    companyIndustry: input.setor,
    companyMetadataPatch,
    segment: 'lider_b2b',
    newsletterOptIn: false,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    sourcePage: input.origem ?? 'LP Beta Test',
    sourceMethod: 'form_beta',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
