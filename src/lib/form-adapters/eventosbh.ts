/**
 * Adapter pro form Pré-inscrição Eventos BH (LP /eventosbh). 100% B2B
 * (lider_b2b_only) — jun/2026.
 *
 * Particularidades:
 *  - segment SEMPRE 'lider_b2b'. O gate é o campo `empresa` (obrigatório no
 *    form): quem preenche empresa é tratado como líder B2B. Não há branching
 *    de intenção como nos forms topo_funil (algoritmo-linkedin/case-semrush).
 *  - `telefone` (zap) e `cargo` são OPCIONAIS — podem vir undefined. Só
 *    populamos os campos do AC / activity quando existem.
 *  - newsletter_opt_in NÃO existe (sem checkbox no form).
 *  - Não cria campo novo no contato — reusa empresa/cargo/telefone/email/nome
 *    que já existem no CRM.
 */

import type { z } from 'zod';
import type { EventosbhLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import { getChannelHint, combineSourcePage } from '../source-detection';
import type { ClassifiedLead } from './types';

type EventosbhInput = z.infer<typeof EventosbhLeadSchema>;

const FORM_SLUG = 'eventosbh' as const;
const def = getFormDefinitionSync(FORM_SLUG);

export function adaptEventosbh(input: EventosbhInput): ClassifiedLead {
  // Canal: utm_source explícito > inferência via referrer > 'direct'/'unknown'.
  const channel = getChannelHint({ utmSource: input.utm_source, referrer: input.referrer });

  const acTags = buildLegibleACTags({
    segment: 'lider_b2b',
    formAcTag: def.acTag,
    newsletterOptIn: false,
  });

  const acFields: ClassifiedLead['acFields'] = {
    empresa: input.empresa,
    tipo_de_lead: 'Líder B2B',
    intencao_uso: 'marca-empresa',
    ...(input.cargo ? { cargo: input.cargo } : {}),
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — TODOS os campos do form na timeline (spec §8)
  const activityData: Record<string, unknown> = {
    form_type: 'eventosbh',
    nome: input.nome,
    email: input.email,
    empresa: input.empresa,
    ...(input.telefone ? { telefone: input.telefone } : {}),
    ...(input.cargo ? { cargo: input.cargo } : {}),
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
      ...(input.cargo ? { cargo: input.cargo } : {}),
      evento: 'Eventos BH',
    },
  };

  return {
    name: input.nome,
    email: input.email,
    ...(input.telefone ? { phone: input.telefone } : {}),
    ...(input.cargo ? { jobTitle: input.cargo } : {}),
    companyName: input.empresa,
    segment: 'lider_b2b',
    newsletterOptIn: false,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    // Slot do botão + URL real (ex: 'LP Eventos BH em /eventosbh')
    sourcePage: combineSourcePage(input.origem ?? 'LP Eventos BH', input.landing_pathname),
    sourceMethod: 'form_eventosbh',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
