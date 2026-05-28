/**
 * Adapter pro Simulador de Proposta. 100% B2B (lider_b2b_only).
 *
 * Particularidades:
 *  - segment SEMPRE 'lider_b2b'.
 *  - proposal_url vira coluna dedicada em people (botão destacado no header).
 *  - Campos de cálculo (plataformaSeats, designPrice, fsTls, etc) vão pra
 *    metadata.proposal_data (json estruturado pra revisar a proposta depois).
 *  - Server action mantém a responsabilidade de criar a page no Notion ANTES
 *    de chamar o adapter (depende do propostaId pra montar a URL).
 */

import type { z } from 'zod';
import type { ProposalLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import { getChannelHint, combineSourcePage } from '../source-detection';
import type { ClassifiedLead } from './types';

type ProposalInput = z.infer<typeof ProposalLeadSchema>;

const FORM_SLUG = 'proposta' as const;
const def = getFormDefinitionSync(FORM_SLUG);

export type ProposalAdapterContext = {
  /** URL HTML pública da proposta gerada (após criar page no Notion). */
  proposalUrl?: string;
  /** ID da page do Notion (pra rastreabilidade em metadata). */
  propostaNotionId?: string;
};

export function adaptProposal(
  input: ProposalInput,
  ctx: ProposalAdapterContext = {},
): ClassifiedLead {
  // Canal: utm_source explícito > inferência via referrer > 'direct'/'unknown'.
  const channel = getChannelHint({ utmSource: input.utm_source, referrer: input.referrer });

  const acTags = buildLegibleACTags({
    segment: 'lider_b2b',
    formAcTag: def.acTag,
    newsletterOptIn: false,
  });
  // Módulos selecionados continuam como tag adicional (legado mantido —
  // facilita relatório de mix de produtos sem hit no DB).
  if (input.plataformaEnabled) acTags.push('Módulo: SaaS');
  if (input.designPlan) acTags.push('Módulo: Design on Demand');
  if (input.fsTls > 0) acTags.push('Módulo: Content Full-Service');

  const acFields: ClassifiedLead['acFields'] = {
    empresa: input.empresa,
    cargo: input.cargo,
    total_mensal_proposta: input.totalCurrent,
    ...(ctx.proposalUrl ? { url_proposta: ctx.proposalUrl } : {}),
    tipo_de_lead: 'Líder B2B',
    intencao_uso: 'marca-empresa',
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — TODOS os campos do form Proposta na timeline (spec §8)
  const activityData: Record<string, unknown> = {
    form_type: 'proposta',
    nome: input.nome,
    email: input.email,
    cargo: input.cargo,
    empresa: input.empresa,
    total_mensal: input.totalCurrent,
    total_full: input.totalFull,
    savings: input.savings,
    beta_active: input.betaActive,
    ...(ctx.proposalUrl ? { proposal_url: ctx.proposalUrl } : {}),
    ...(input.origem ? { origem: input.origem } : {}),
    utms: {
      source: input.utm_source,
      medium: input.utm_medium,
      campaign: input.utm_campaign,
      content: input.utm_content,
      term: input.utm_term,
    },
    engagement: {
      consent_status: input.consent_status,
      ga4_client_id: input.ga4_client_id,
    },
  };

  // metadata.proposal_data — snapshot completo do cálculo pra revisar
  // a proposta depois do submit (sidebar do perfil, audit, etc).
  const personMetadataPatch: Record<string, unknown> = {
    form_data: {
      cargo: input.cargo,
    },
    proposal_data: {
      beta_active: input.betaActive,
      platform: {
        enabled: input.plataformaEnabled,
        seats: input.plataformaSeats,
        per_seat_full: input.plataformaPriceFull,
        per_seat_beta: input.plataformaPriceBeta,
        enterprise: input.plataformaEnterprise,
      },
      design: {
        plan: input.designPlan,
        price: input.designPrice,
      },
      full_service: {
        tls: input.fsTls,
        freq: input.fsFreq,
        price: input.fsPrice,
      },
      totals: {
        current: input.totalCurrent,
        full: input.totalFull,
        savings: input.savings,
      },
      team_items: input.teamItems,
      ...(ctx.proposalUrl ? { proposal_url: ctx.proposalUrl } : {}),
      ...(ctx.propostaNotionId ? { proposta_notion_id: ctx.propostaNotionId } : {}),
      generated_at: new Date().toISOString(),
    },
  };

  return {
    name: input.nome,
    email: input.email,
    jobTitle: input.cargo,
    companyName: input.empresa,
    segment: 'lider_b2b',
    newsletterOptIn: false,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    sourcePage: combineSourcePage(input.origem || 'Simulador de Proposta', input.landing_pathname),
    sourceMethod: 'form_proposta',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
    proposalUrl: ctx.proposalUrl,
  };
}
