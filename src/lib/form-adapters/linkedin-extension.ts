/**
 * Adapter pra extensão LinkedIn — STUB pra Task 5.
 *
 * Estrutura está pronta pra ser preenchida quando a extensão estiver
 * implementada (§9 da spec). Por ora não é importada pelo fluxo de
 * server actions — só serve pra documentar a interface esperada.
 */

import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import type { ClassifiedLead } from './types';

const FORM_SLUG = 'linkedin_extension' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Shape esperado do payload vindo da extensão Chrome (content script extrai
 * do DOM do LinkedIn, background envia pra /api/extension/capture-person).
 *
 * Task 5 vai refinar conforme a extensão for ficando pronta.
 */
export type LinkedInExtensionInput = {
  name: string;
  email?: string;
  linkedinUrl: string;
  headline?: string;
  jobTitle?: string;
  companyName?: string;
  photoUrl?: string;
  location?: string;
  // Metadata rica
  about?: string;
  experience?: Array<{ title: string; company: string; period?: string }>;
  education?: { school: string; degree?: string; year?: string };
  connectionsCount?: string;
  recentPosts?: Array<{ title: string; date: string }>;
  capturedAt: string;
  sourceUrl: string;
};

export function adaptLinkedInExtension(input: LinkedInExtensionInput): ClassifiedLead {
  // Extensão SEMPRE marca lider_b2b (presunção de prospecção B2B intencional)
  const acTags = buildLegibleACTags({
    segment: 'lider_b2b',
    formAcTag: def.acTag,
    newsletterOptIn: false,
  });

  const acFields: ClassifiedLead['acFields'] = {
    ...(input.companyName ? { empresa: input.companyName } : {}),
    ...(input.jobTitle ? { cargo: input.jobTitle } : {}),
    tipo_de_lead: 'Líder B2B',
  };

  return {
    name: input.name,
    // Email pode vir vazio (LinkedIn não expõe direto) — recordLeadFromForm
    // exige email; quando vazio a extensão tem que gerar placeholder ou
    // a UI tem que pedir antes do submit. Task 5 trata.
    email: input.email ?? `linkedin-${Date.now()}@placeholder.boldfy.local`,
    jobTitle: input.jobTitle,
    linkedinUrl: input.linkedinUrl,
    headline: input.headline,
    photoUrl: input.photoUrl,
    location: input.location,
    companyName: input.companyName,
    segment: 'lider_b2b',
    newsletterOptIn: false,
    formSlug: FORM_SLUG,
    acTags,
    acFields,
    sourceChannel: 'linkedin',
    sourcePage: input.sourceUrl,
    sourceMethod: 'extension_linkedin',
    firstTouchSource: 'linkedin',
    activityData: {
      form_type: 'linkedin_extension',
      source_url: input.sourceUrl,
      captured_at: input.capturedAt,
    },
    source: 'system',
    personMetadataPatch: {
      linkedin_profile: {
        about: input.about,
        experience: input.experience,
        education: input.education,
        connections_count: input.connectionsCount,
        recent_posts: input.recentPosts,
        captured_at: input.capturedAt,
        source_url: input.sourceUrl,
      },
    },
    // Extensão NÃO sincroniza pro AC automaticamente — captura é intencional,
    // mas decisão de mandar pro AC fica pra um botão "promover" no CRM.
    // Task 5 confirma se vai ligar sync automático.
    syncToAC: false,
  };
}
