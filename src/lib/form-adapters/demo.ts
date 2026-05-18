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
import type { ClassifiedLead } from './types';
import type { SourceChannel } from '../crm';

type DemoInput = z.infer<typeof DemoLeadSchema>;

const FORM_SLUG = 'demo' as const;
const def = getFormDefinitionSync(FORM_SLUG);

function utmSourceToChannel(src: string | undefined): SourceChannel {
  const known: SourceChannel[] = ['linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual'];
  if (src && (known as string[]).includes(src)) return src as SourceChannel;
  return 'unknown';
}

export function adaptDemo(input: DemoInput): ClassifiedLead {
  const channel = utmSourceToChannel(input.utm_source);

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

  const activityData: Record<string, unknown> = {
    form_type: 'demo',
    origem: input.origem,
    funcionarios: input.funcionarios,
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
    sourcePage: input.origem ?? 'Popup Demo',
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
