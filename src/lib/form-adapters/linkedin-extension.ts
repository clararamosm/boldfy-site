/**
 * Adapter pra captura de PESSOA via extensão Chrome no LinkedIn.
 *
 * Spec: /source-of-truth/specs/SPEC-extension-linkedin.md §5.
 *
 * Decisões chave (registradas em 2026-05-28):
 *  - Email é NULL — LinkedIn não expõe, e Clara não quer placeholder fake.
 *    Dedup acontece por `linkedinUrl` (unique constraint em people).
 *  - `syncToAC: false` — captura LinkedIn nunca dispara cadência no AC.
 *    Sem email + sem form do site = sem cadência (spec §8).
 *  - Segment SEMPRE 'lider_b2b' (extensão presume prospecção B2B intencional).
 *  - Sem fuzzy match por nome+empresa — duplicatas resolvidas por merge manual
 *    no CRM (decisão 2026-05-28).
 */

import { buildLegibleACTags } from '../ac-tags';
import { getFormDefinitionSync } from '../form-definitions';
import type { ClassifiedLead } from './types';

const FORM_SLUG = 'linkedin_extension' as const;
const def = getFormDefinitionSync(FORM_SLUG);

/**
 * Shape do payload vindo da extensão (content script extrai do DOM,
 * background envia em POST /api/extension/capture-person).
 *
 * Os campos opcionais refletem o que pode faltar dependendo do estado da
 * página (perfil privado, seção colapsada, mudança de DOM do LinkedIn).
 * Campos ausentes geram telemetry `extension_field_missing` mas não bloqueiam
 * captura.
 */
export type LinkedInExtensionInput = {
  /** Nome completo do perfil. Required — sem nome a captura falha. */
  name: string;
  /** URL canonical (linkedin.com/in/<slug>). Required — chave de dedup. */
  linkedinUrl: string;

  /* Campos enriquecedores — todos opcionais */
  headline?: string;
  jobTitle?: string;
  companyName?: string;
  photoUrl?: string;
  location?: string;
  about?: string;
  experience?: Array<{ title: string; company: string; period?: string }>;
  education?: { school: string; degree?: string; year?: string };
  connectionsCount?: string;

  /** Timestamp ISO da captura. */
  capturedAt: string;
  /** URL exata da página capturada (preserva query string se houver). */
  sourceUrl: string;
};

export function adaptLinkedInExtension(input: LinkedInExtensionInput): ClassifiedLead {
  // Tags AC ficam só registradas em people.acTags (espelho local) — não vão
  // pro AC porque syncToAC=false. Mantemos o rebuild pra consistência: se
  // futuramente um botão "Promover pro AC" for adicionado, as tags estão
  // prontas pra envio.
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

  const activityData: Record<string, unknown> = {
    form_type: 'linkedin_extension',
    source_url: input.sourceUrl,
    captured_at: input.capturedAt,
    ...(input.headline ? { headline: input.headline } : {}),
    ...(input.location ? { location: input.location } : {}),
    ...(input.connectionsCount ? { connections_count: input.connectionsCount } : {}),
  };

  return {
    name: input.name,
    // email omitido propositalmente — captura LinkedIn entra sem email
    // (decisão Clara 2026-05-28). Dedup por linkedinUrl.
    jobTitle: input.jobTitle,
    linkedinUrl: input.linkedinUrl,
    headline: input.headline,
    // photoUrl do LinkedIn (media.licdn.com) é hotlink-bloqueado e expira —
    // não guardamos mais (jul/2026). CRM cai pras iniciais coloridas. A URL
    // original fica em metadata.linkedin_profile.source_url se precisar.
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
    activityData,
    source: 'linkedin',
    personMetadataPatch: {
      linkedin_profile: {
        about: input.about,
        experience: input.experience,
        education: input.education,
        connections_count: input.connectionsCount,
        captured_at: input.capturedAt,
        source_url: input.sourceUrl,
      },
    },
    // Extensão NÃO sincroniza pro AC (spec §8).
    syncToAC: false,
    // Captura LinkedIn = enriquecimento: nunca sobrescreve cargo/segmento de
    // um lead que já veio de form. Só preenche o que estiver vazio.
    enrichOnly: true,
  };
}
