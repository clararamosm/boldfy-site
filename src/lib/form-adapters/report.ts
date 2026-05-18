/**
 * Adapter pro form Report ("Algoritmo LinkedIn 2026"). Topo de funil.
 *
 * Particularidades:
 *  - Pergunta intencao_uso → deriva segment dinamicamente (3 possibilidades).
 *  - Newsletter opt-in é checkbox opcional (default false).
 *  - empresa só preenchida quando intencao_uso='marca-empresa' (gate de UI).
 *  - Cargo NÃO é capturado nesse form.
 */

import type { z } from 'zod';
import type { ReportLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags, segmentFromIntencao } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import type { ClassifiedLead } from './types';
import type { SourceChannel } from '../crm';

type ReportInput = z.infer<typeof ReportLeadSchema>;

const FORM_SLUG = 'report' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Mapeia utm_source pro enum SourceChannel. Fallback 'unknown' quando
 * UTM não bate com nenhum canal conhecido (ex: 'newsletter-junho-2026').
 */
function utmSourceToChannel(src: string | undefined): SourceChannel {
  const known: SourceChannel[] = ['linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual'];
  if (src && (known as string[]).includes(src)) return src as SourceChannel;
  return 'unknown';
}

export function adaptReport(input: ReportInput): ClassifiedLead {
  const segment = segmentFromIntencao(input.intencaoUso);
  const newsletterOptIn = input.newsletterOptIn === true;

  // Empresa só vem quando intencao_uso='marca-empresa' (validação no form)
  const empresaInformada =
    input.intencaoUso === 'marca-empresa' ? input.empresa?.trim() || undefined : undefined;

  const channel = utmSourceToChannel(input.utm_source);

  // Tag-mãe (Form: Algoritmo LinkedIn 2026 — naming mantido) + segment +
  // newsletter conforme opt-in.
  const acTags = buildLegibleACTags({
    segment,
    formAcTag: def.acTag,
    newsletterOptIn,
  });

  // Custom fields AC — gates da cadência + segmentação. tipo_de_lead vira
  // o label legível ('Líder B2B' / 'Parceiro estratégico' / 'Profissional
  // individual'). NOTA: a cadência atual no AC ainda compara com nomes
  // antigos ('ICP B2B' etc) — Clara confirma se o gate já foi atualizado
  // pros labels novos.
  const tipoLead =
    segment === 'lider_b2b' ? 'Líder B2B'
    : segment === 'parceiro' ? 'Parceiro estratégico'
    : segment === 'profissional_individual' ? 'Profissional individual'
    : undefined;

  const acFields: ClassifiedLead['acFields'] = {
    ...(empresaInformada ? { empresa: empresaInformada } : {}),
    ...(tipoLead ? { tipo_de_lead: tipoLead } : {}),
    intencao_uso: input.intencaoUso,
    newsletter_opt_in: newsletterOptIn ? 'SIM' : 'NAO',
    ...(input.utm_source ? { utm_source_first: input.utm_source } : {}),
    ...(input.utm_medium ? { utm_medium_first: input.utm_medium } : {}),
    ...(input.utm_campaign ? { utm_campaign_first: input.utm_campaign } : {}),
  };

  // Activity data — vai pra timeline (Task 2 renderiza rica).
  const activityData: Record<string, unknown> = {
    form_type: 'report',
    intencao_uso: input.intencaoUso,
    tipo_lead: tipoLead,
    newsletter_opt_in: newsletterOptIn,
    utms: {
      source: input.utm_source,
      medium: input.utm_medium,
      campaign: input.utm_campaign,
      content: input.utm_content,
      term: input.utm_term,
    },
  };

  // metadata.form_data — campos legíveis que viram fonte de info na sidebar
  // do perfil (até virarem coluna canônica se merecer).
  const personMetadataPatch: Record<string, unknown> = {
    form_data: {
      intencao_uso: input.intencaoUso,
      tipo_de_lead: tipoLead,
      ...(empresaInformada ? { empresa: empresaInformada } : {}),
    },
  };

  return {
    name: input.nome,
    email: input.email,
    companyName: empresaInformada,
    segment,
    newsletterOptIn,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: channel,
    sourcePage: input.origem || 'LP Algoritmo LinkedIn',
    sourceMethod: 'form_report',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
