/**
 * Adapter pro form Demo. 100% B2B (lider_b2b_only).
 *
 * Particularidades:
 *  - segment SEMPRE 'lider_b2b'.
 *  - newsletter_opt_in NÃO existe.
 *  - `funcionarios` → company.size (tamanho real da empresa).
 *  - Tag adicional 'Demo: Aguardando agendamento' continua sendo aplicada
 *    pelo server action (não pelo adapter) porque é flag operacional do
 *    fluxo Cal — fica no escopo do action junto com a integração Cal.
 */

import type { z } from 'zod';
import type { DemoLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import { getChannelHint, combineSourcePage } from '../source-detection';
import type { ClassifiedLead } from './types';

type DemoInput = z.infer<typeof DemoLeadSchema>;

const FORM_SLUG = 'demo' as const;
const def = getFormDefinitionSync(FORM_SLUG);

export function adaptDemo(input: DemoInput): ClassifiedLead {
  // Canal: prefere utm_source explícito; senão infere via referrer
  // (linkedin.com→linkedin, google.com→organic, sem referrer→direct, etc).
  // Antes só usava utm_source — sem UTM tudo virava 'unknown'.
  const channel = getChannelHint({
    utmSource: input.utm_source,
    referrer: input.referrer,
  });

  const acTags = buildLegibleACTags({
    segment: 'lider_b2b',
    formAcTag: def.acTag,
    newsletterOptIn: false,
  });

  const acFields: ClassifiedLead['acFields'] = {
    empresa: input.empresa,
    cargo: input.cargo,
    porte: input.funcionarios,
    tipo_de_lead: 'Líder B2B',
    intencao_uso: 'marca-empresa',
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — TODOS os campos do form Demo na timeline (spec §8)
  const activityData: Record<string, unknown> = {
    form_type: 'demo',
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    cargo: input.cargo,
    empresa: input.empresa,
    funcionarios: input.funcionarios,
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

  const personMetadataPatch: Record<string, unknown> = {
    form_data: {
      cargo: input.cargo,
    },
  };

  return {
    name: input.nome,
    email: input.email,
    phone: input.telefone,
    jobTitle: input.cargo,
    companyName: input.empresa,
    companySize: input.funcionarios,
    segment: 'lider_b2b',
    newsletterOptIn: false,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    // sourcePage rico: slot do botão + URL real (ex: 'header:desktop em /solucoes/saas').
    // Antes salvava só o slot — você sabia o BOTÃO clicado mas não a página.
    sourcePage: combineSourcePage(input.origem ?? 'Popup Demo', input.landing_pathname),
    sourceMethod: 'form_demo',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
