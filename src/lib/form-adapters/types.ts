/**
 * Tipo canônico que TODOS os adapters de form retornam.
 *
 * Cada adapter transforma o payload Zod-validado do seu form em uma
 * ClassifiedLead — shape único que recordLeadFromForm consome.
 *
 * O adapter centraliza:
 *  - derivação do segment (lider_b2b / parceiro / profissional_individual)
 *  - mapping de campos do form pra colunas dedicadas vs metadata.form_data
 *  - construção das tags AC legíveis (buildLegibleACTags)
 *  - empacotamento do payload da activity_data (timeline)
 *  - empacotamento dos custom fields do AC
 *
 * Spec: §5 do crm-source-of-truth-fluxo-form.md.
 */

import type { SourceChannel, SourceMethod } from '../crm';
import type { FormSlug, LeadSegment } from '../form-definitions';

export type ClassifiedLead = {
  /* ---------------- Person canônicos ---------------- */
  name: string;
  /**
   * Email opcional desde a extensão Chrome (mai/2026 — SPEC-extension-linkedin.md).
   * Forms do site SEMPRE passam email (Zod schema deles exige), então `email` na
   * prática só fica undefined em capturas da extensão LinkedIn. Quando ausente,
   * `upsertPerson` deduplica por `linkedinUrl` em vez de email.
   */
  email?: string;
  phone?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  headline?: string;
  location?: string;

  /* ---------------- Company ---------------- */
  companyName?: string;
  companyIndustry?: string;
  companySize?: string;
  /** Patch jsonb pra company.metadata (ex: { beta_data: { seats_requested } }). */
  companyMetadataPatch?: Record<string, unknown>;

  /* ---------------- Classificação / segmentação ---------------- */
  segment: LeadSegment | null;
  newsletterOptIn: boolean;
  formSlug: FormSlug;

  /* ---------------- Cargo (forms que coletam — mai/2026) ---------------- */
  /** Senioridade — enum job_seniority. Undefined em forms que não pedem cargo. */
  jobSeniority?: 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level' | null;
  /** Área funcional — enum job_area. Undefined em forms que não pedem. */
  jobArea?:
    | 'marketing'
    | 'growth'
    | 'vendas'
    | 'rh'
    | 'employer_branding'
    | 'comunicacao'
    | 'outro'
    | null;

  /* ---------------- Tags AC (4 famílias) ---------------- */
  /** Set explícito — substitui completamente people.acTags. */
  acTags: string[];

  /* ---------------- Custom fields AC ---------------- */
  /** Vão pro AC via syncContact.fields (registrados em CUSTOM_FIELDS). */
  acFields: Record<string, string | number | undefined | null>;
  /** Nome separado (firstName/lastName) — se omitido, split por espaço. */
  acFirstName?: string;
  acLastName?: string;
  /** Já existe no CRM? Se sim, repassa pra evitar nova chamada findContactByEmail. */
  acContactId?: string;

  /* ---------------- Tracking ---------------- */
  sourceChannel: SourceChannel;
  sourcePage?: string;
  sourceMethod: SourceMethod;
  firstTouchSource?: string;
  firstTouchCampaign?: string;
  lastTouchSource?: string;
  lastTouchCampaign?: string;

  /* ---------------- Activity payload ---------------- */
  /** Vai pra activities.data junto com form_slug. Inclui UTMs, campos custom, etc. */
  activityData: Record<string, unknown>;
  /** Default 'web'. Extensão LinkedIn passa 'system' (capture intencional). */
  source?: 'web' | 'system' | 'email' | 'cal' | 'linkedin' | 'manual';

  /* ---------------- Metadata patch ---------------- */
  /** Patch jsonb pra people.metadata (ex: { form_data: {...}, proposal_data: {...} }). */
  personMetadataPatch?: Record<string, unknown>;

  /* ---------------- Proposta (só form Proposta) ---------------- */
  /** URL HTML da proposta gerada. Vira coluna dedicada + botão no header. */
  proposalUrl?: string;

  /* ---------------- Controle de sync ---------------- */
  /** Default true. False = pula syncContact (uso em backfill, import). */
  syncToAC?: boolean;
};
