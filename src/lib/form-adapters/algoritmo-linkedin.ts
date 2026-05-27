/**
 * Adapter pro form Algoritmo LinkedIn 2026 (report de topo de funil).
 *
 * Naming: slug interno SEMPRE espelha o slug da URL pública (/algoritmo-linkedin).
 * Termos genéricos tipo 'report' são proibidos — quando o segundo material chegar,
 * 'report' deixaria de identificar de qual estamos falando. Ver AGENTS.md.
 *
 * Particularidades:
 *  - Pergunta intencao_uso → deriva segment dinamicamente (3 possibilidades).
 *  - Newsletter opt-in é checkbox opcional (default false).
 *  - empresa só preenchida quando intencao_uso='marca-empresa' (gate de UI).
 *  - Cargo NÃO é capturado nesse form.
 */

import type { z } from 'zod';
import type { AlgoritmoLinkedinLeadSchema } from '@/app/actions/_schemas';
import { buildLegibleACTags, segmentFromIntencao } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import { getChannelHint, combineSourcePage } from '../source-detection';
import type { ClassifiedLead } from './types';

type AlgoritmoLinkedinInput = z.infer<typeof AlgoritmoLinkedinLeadSchema>;

const FORM_SLUG = 'algoritmo-linkedin' as const;
const def = getFormDefinitionSync(FORM_SLUG);

export function adaptAlgoritmoLinkedin(input: AlgoritmoLinkedinInput): ClassifiedLead {
  const segment = segmentFromIntencao(input.intencaoUso);
  const newsletterOptIn = input.newsletterOptIn === true;

  // Empresa só vem quando intencao_uso='marca-empresa' (validação no form)
  const empresaInformada =
    input.intencaoUso === 'marca-empresa' ? input.empresa?.trim() || undefined : undefined;

  // Canal: utm_source explícito > inferência via referrer > 'direct'/'unknown'.
  const channel = getChannelHint({ utmSource: input.utm_source, referrer: input.referrer });

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

  // Activity data — vai pra timeline (Task 2 §8: "mostra TODOS os campos
  // preenchidos"). Incluir AQUI tudo que o form captura, mesmo redundante
  // com header — o lead detail mostra como chips visuais.
  const activityData: Record<string, unknown> = {
    form_type: 'algoritmo-linkedin',
    nome: input.nome,
    email: input.email,
    ...(empresaInformada ? { empresa: empresaInformada } : {}),
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
    sourcePage: combineSourcePage(input.origem || 'LP Algoritmo LinkedIn', input.landing_pathname),
    sourceMethod: 'form_algoritmo_linkedin',
    firstTouchSource: input.utm_source ?? channel,
    firstTouchCampaign: input.utm_campaign,
    lastTouchSource: input.utm_source ?? channel,
    lastTouchCampaign: input.utm_campaign,
    activityData,
    source: 'web',
    personMetadataPatch,
  };
}
