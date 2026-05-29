/**
 * Adapter pra captura de EMPRESA via extensão Chrome no LinkedIn.
 *
 * Spec: /source-of-truth/specs/SPEC-extension-linkedin.md §6.
 *
 * Diferente da captura de pessoa, captura de empresa NÃO cria/atualiza
 * registro em `people` — só mexe em `companies`. Por isso não retorna
 * ClassifiedLead (esse tipo assume pessoa); tem o próprio shape de input
 * e o endpoint chama uma função dedicada que reusa `upsertCompany`.
 *
 * Lista enxuta de 7 campos (decisão Clara 2026-05-28):
 *   nome, linkedin_url, indústria, headcount, descrição, site, especialidades
 *
 * Tudo qualitativo (posts recentes, vagas, employees_listed, fundação,
 * recent_activity_at) foi cortado — contexto fica no LinkedIn que está a
 * 1 clique de distância. CRM é índice, não enciclopédia.
 */

export type LinkedInCompanyExtensionInput = {
  /** Nome da empresa. Required. */
  name: string;
  /** URL canonical (linkedin.com/company/<slug>). Required — chave de dedup. */
  linkedinUrl: string;

  /* Campos enriquecedores — opcionais */
  /** Indústria do LinkedIn (ex: "Software Development"). */
  industry?: string;
  /** Range de headcount do LinkedIn (ex: "11-50", "51-200"). */
  size?: string;
  /** Descrição / "sobre" da empresa. */
  description?: string;
  /** Site institucional (link clicável no card do CRM). */
  website?: string;
  /** Tags de "especialidades" do LinkedIn. */
  specialties?: string[];

  /** Timestamp ISO da captura. */
  capturedAt: string;
  /** URL exata da página capturada. */
  sourceUrl: string;
};

/**
 * Shape de output que o endpoint passa pra função `recordCompanyFromExtension`
 * (a ser definida em lib/crm.ts ou crm-extension.ts).
 *
 * Mapeia direto pros campos esperados por `upsertCompany`:
 *   - name, industry, size, website, linkedinUrl → colunas dedicadas
 *   - description + specialties + captured_at + source_url → metadata.company_intelligence
 *
 * `metadata.company_intelligence` é o slot estável reservado em ADR-009 (site-
 * crm-dashboard-tecnico.md) — sidebar "🧠 Inteligência da empresa" lê daqui.
 */
export type AdaptedLinkedInCompany = {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  linkedinUrl: string;
  metadataPatch: {
    company_intelligence: {
      description?: string;
      specialties?: string[];
      captured_at: string;
      source_url: string;
      captured_via: 'extension_linkedin';
    };
  };
};

export function adaptLinkedInCompanyExtension(
  input: LinkedInCompanyExtensionInput,
): AdaptedLinkedInCompany {
  return {
    name: input.name,
    industry: input.industry,
    size: input.size,
    website: input.website,
    linkedinUrl: input.linkedinUrl,
    metadataPatch: {
      company_intelligence: {
        description: input.description,
        specialties: input.specialties,
        captured_at: input.capturedAt,
        source_url: input.sourceUrl,
        captured_via: 'extension_linkedin',
      },
    },
  };
}
