/**
 * Drizzle schema do CRM Boldfy.
 *
 * Fonte de verdade: docs/SPEC-crm-boldfy.md.
 *
 * Convenções:
 *  - IDs sempre UUID (gen_random_uuid no Postgres)
 *  - Timestamps com timezone (TIMESTAMPTZ)
 *  - FKs com onDelete: cascade quando dependência é forte (activities, meetings)
 *  - merged_into_id em people permite soft-merge auditável
 *
 * Sprint 3a: Status virou tabela editável (`statuses`). people.status_id e
 * companies.status_id viram FK pra ela. Lead score auto-promotion lê
 * `score_threshold_min` dinamicamente.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  index,
  uniqueIndex,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const statusKindEnum = pgEnum('status_kind', ['person', 'company']);

export const sourceChannelEnum = pgEnum('source_channel', [
  'linkedin',
  'organic',
  'direct',
  'email',
  'indicacao',
  'pr',
  'manual',
  'unknown',
]);

export const sourceMethodEnum = pgEnum('source_method', [
  'form_demo',
  'form_beta',
  'form_algoritmo_linkedin',
  'form_case_semrush',
  'form_proposta',
  'form_playbook_employee_led_growth',
  'extension_linkedin',
  'manual',
  'imported_folk',
]);

/**
 * Senioridade do cargo do respondente (padrão recorrente — começa no Playbook
 * de Employee-Led Growth, mai/2026, e deve ser retrofit em forms futuros que
 * coletam cargo: beta, demo, proposta).
 *
 * Razão: alimenta lead score (C-Level + budget + sponsorship = lead quente),
 * filtros no kanban do CRM, segmentação no AC.
 */
export const jobSeniorityEnum = pgEnum('job_seniority', [
  'analista',
  'coordenador',
  'gerente',
  'diretor',
  'c_level',
]);

/**
 * Área funcional do respondente dentro da empresa. Define qual template do
 * Playbook é renderizado (marketing/vendas/rh têm angulações diferentes).
 *
 * 'outro' é fallback consciente — NÃO usar pra forçar respondentes a se
 * encaixarem; documenta o cenário real e cai num template genérico de
 * marketing como default no render.
 */
export const jobAreaEnum = pgEnum('job_area', [
  'marketing',
  'growth',
  'vendas',
  'rh',
  'employer_branding',
  'comunicacao',
  'outro',
]);

export const meetingStatusEnum = pgEnum('meeting_status', [
  'scheduled',
  'attended',
  'noshow',
  'cancelled',
]);

/* -------------------------------------------------------------------------- */
/*  statuses (editáveis pelo usuário — kanban columns customizáveis)          */
/* -------------------------------------------------------------------------- */

export const statuses = pgTable(
  'statuses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: statusKindEnum('kind').notNull(), // 'person' | 'company'
    label: text('label').notNull(),
    color: text('color'), // hex (#3B82F6) ou semantic ('blue', 'amber', 'green', etc)
    sortOrder: integer('sort_order').notNull(),

    // Pra person: threshold de score que promove auto pra cá. Company: null.
    // Lead com score >= threshold sobe pro maior threshold abaixo dele.
    scoreThresholdMin: integer('score_threshold_min'),

    isDefault: boolean('is_default').notNull().default(false), // novo lead começa aqui
    isTerminal: boolean('is_terminal').notNull().default(false), // ex: Fechado/Perdido — sem auto-promotion + drag pede confirmação

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_statuses_kind_label').on(t.kind, sql`LOWER(${t.label})`),
    index('idx_statuses_kind_order').on(t.kind, t.sortOrder),
  ],
);

/* -------------------------------------------------------------------------- */
/*  companies                                                                  */
/* -------------------------------------------------------------------------- */

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    industry: text('industry'),
    size: text('size'),
    website: text('website'),
    linkedinUrl: text('linkedin_url'),
    statusId: uuid('status_id').references(() => statuses.id, { onDelete: 'set null' }),
    estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),
    nextAction: text('next_action'),
    firstTouchAt: timestamp('first_touch_at', { withTimezone: true }),
    firstTouchSource: text('first_touch_source'),
    firstTouchCampaign: text('first_touch_campaign'),
    description: text('description'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    internalNotes: text('internal_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_companies_name_lower').on(sql`LOWER(${t.name})`),
    index('idx_companies_status').on(t.statusId),
    index('idx_companies_next_action').on(t.nextActionAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  people                                                                     */
/* -------------------------------------------------------------------------- */

export const people = pgTable(
  'people',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    linkedinUrl: text('linkedin_url'),
    photoUrl: text('photo_url'),
    jobTitle: text('job_title'),
    headline: text('headline'),
    location: text('location'),
    companyId: uuid('company_id').references(() => companies.id),
    statusId: uuid('status_id').references(() => statuses.id, { onDelete: 'set null' }),
    leadScore: integer('lead_score').notNull().default(0),
    sourceChannel: sourceChannelEnum('source_channel').default('unknown'),
    sourcePage: text('source_page'),
    sourceMethod: sourceMethodEnum('source_method').default('manual'),
    firstTouchAt: timestamp('first_touch_at', { withTimezone: true }),
    firstTouchSource: text('first_touch_source'),
    firstTouchCampaign: text('first_touch_campaign'),
    lastTouchAt: timestamp('last_touch_at', { withTimezone: true }),
    acContactId: text('ac_contact_id'),
    acTags: text('ac_tags').array(),
    /**
     * Metadata flexível — dados ricos vindos de forms, AC custom fields,
     * extensão LinkedIn etc. Estrutura sugerida:
     *   form_data: { objetivo_principal, como_conheceu, intencao_uso, observacoes }
     *   ac_custom_fields: { tipo_de_lead, porte, setor, ... }
     *   linkedin: { connections_count, mutual, current_company } (extensão)
     *   imported_from: { folk_id, ac_imported_at }
     */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    description: text('description'),
    /* ------------------------------------------------------------------ */
    /*  CRM Source of Truth (mai/2026 — Task 1 da spec crm-source-of-truth) */
    /* ------------------------------------------------------------------ */
    /**
     * Tipo de lead derivado da intenção declarada no último form topo de funil:
     *  - 'lider_b2b'              → preencheu form B2B (Beta/Demo/Proposta) ou
     *                                 declarou intencao_uso='marca-empresa' no Report
     *  - 'parceiro'               → intencao_uso='marca-clientes' (agência/consultor)
     *  - 'profissional_individual'→ intencao_uso='marca-pessoal' (criador/autônomo)
     *
     * Ortogonal a status (que é estágio do funil). Pessoa pode ser
     * Profissional Individual em status Ativo, ou Líder B2B em Quente.
     * Última-resposta vence — mudança vira activity 'field_changed'.
     */
    segment: text('segment'),
    /** Opt-in explícito de newsletter — checkbox em forms topo de funil. */
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(false),
    /**
     * Lead deu unsubscribe no AC (espelhado via webhook /api/webhooks/ac).
     * Kanban e Forms tab filtram unsubscribed=false por default. Quando true,
     * lead vai pra aba "Leads inativos". Form novo zera essa flag (resubscribe).
     */
    unsubscribed: boolean('unsubscribed').notNull().default(false),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    resubscribedAt: timestamp('resubscribed_at', { withTimezone: true }),
    /**
     * Slugs dos forms que essa pessoa já preencheu (dedup acumulativo).
     * Ex: ['algoritmo-linkedin', 'beta']. Append via SQL atômico em upsertPerson.
     * Substitui derivação por activities form_submit_* na UI da aba Forms.
     */
    formsSubmitted: text('forms_submitted').array().notNull().default(sql`'{}'::text[]`),
    /** URL da proposta HTML gerada (form Proposta). Botão destacado no perfil. */
    proposalUrl: text('proposal_url'),
    /**
     * Senioridade do cargo (introduzida no form Playbook ELG, mai/2026).
     * Nullable — pessoas vindas de forms antigos não têm. Forms novos
     * devem popular. Padrão recorrente: usar nos próximos forms que
     * coletarem cargo.
     */
    jobSeniority: jobSeniorityEnum('job_seniority'),
    /**
     * Área funcional (introduzida no form Playbook ELG, mai/2026).
     * Define template do Playbook + segmentação de leads no kanban.
     */
    jobArea: jobAreaEnum('job_area'),
    /** UTM source do ÚLTIMO toque — atualiza a cada form/captura nova. */
    lastTouchSource: text('last_touch_source'),
    /** UTM campaign do último toque. firstTouch* permanecem imutáveis. */
    lastTouchCampaign: text('last_touch_campaign'),
    archived: boolean('archived').notNull().default(false),
    mergedIntoId: uuid('merged_into_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_people_email').on(t.email),
    uniqueIndex('idx_people_linkedin').on(t.linkedinUrl),
    index('idx_people_status').on(t.statusId),
    index('idx_people_company').on(t.companyId),
    index('idx_people_score').on(t.leadScore),
    index('idx_people_source').on(t.sourceChannel, t.sourcePage),
    // Índices da Task 1 — criados via Neon SQL editor; declarados aqui
    // pra drizzle-kit não tentar dropar caso a Clara rode push no futuro.
    index('idx_people_segment').on(t.segment),
    index('idx_people_forms_gin').using('gin', t.formsSubmitted),
    // Índices do Playbook ELG (mai/2026) — segmentação no kanban e State of ELG.
    index('idx_people_seniority').on(t.jobSeniority),
    index('idx_people_area').on(t.jobArea),
  ],
);

/* -------------------------------------------------------------------------- */
/*  activities                                                                 */
/* -------------------------------------------------------------------------- */

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    weight: integer('weight').notNull().default(0),
    source: text('source'),
    data: jsonb('data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_activities_person').on(t.personId, t.createdAt),
    index('idx_activities_company').on(t.companyId, t.createdAt),
    index('idx_activities_type').on(t.type, t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  meetings                                                                   */
/* -------------------------------------------------------------------------- */

export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    calEventId: text('cal_event_id'),
    title: text('title').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMin: integer('duration_min').notNull().default(30),
    meetingUrl: text('meeting_url'),
    status: meetingStatusEnum('status').notNull().default('scheduled'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_meetings_cal_event').on(t.calEventId),
    index('idx_meetings_person').on(t.personId, t.scheduledAt),
    index('idx_meetings_scheduled').on(t.scheduledAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  proposals (storage do JSON de propostas geradas pelo Simulador)            */
/*                                                                              */
/*  Substitui o storage no Notion (mai/2026). A URL /proposta/[uuid] resolve   */
/*  pra row aqui, e o route handler renderiza o HTML compartilhável a partir   */
/*  do proposal_data + total_current/full/beta_active.                         */
/*                                                                              */
/*  1 lead → N propostas (cliente pode reabrir simulador e regenerar; cada     */
/*  geração vira row nova, preserva histórico).                                */
/* -------------------------------------------------------------------------- */

export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
    /** Snapshot completo do payload do simulador (platform, design, fullService, totals, team). */
    proposalData: jsonb('proposal_data').notNull(),
    /** Cache do total mensal corrente (com beta aplicado se houver). Pra ORDER BY sem parse de JSONB. */
    totalCurrent: integer('total_current').notNull(),
    /** Total full (sem desconto beta) — pra calcular "savings" no HTML sem reler JSON. */
    totalFull: integer('total_full').notNull(),
    /** Gate visual no HTML: exibe "30% off" só quando true. */
    betaActive: boolean('beta_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_proposals_person').on(t.personId),
    index('idx_proposals_created').on(t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  playbook_outputs (storage dos playbooks gerados pela ferramenta ELG)       */
/*                                                                              */
/*  Cada submit do quiz /ferramentas/playbook-employee-led-growth gera uma row */
/*  aqui + uma página acessível em /playbook/[slug] (noindex/nofollow).        */
/*  Pessoa pode revisitar a página dela / compartilhar com C-level, e a equipe */
/*  Boldfy vê quem voltou a abrir (view_count + last_viewed_at) como sinal     */
/*  comercial dentro do CRM interno.                                           */
/*                                                                              */
/*  rendered_data é snapshot — se a gente atualizar templates depois, páginas  */
/*  antigas continuam renderizando o que viram no momento original. Não força  */
/*  re-render retroativo (que pode quebrar links compartilhados).              */
/*                                                                              */
/*  1 pessoa → N outputs (pessoa pode refazer o quiz; cada execução vira row   */
/*  nova preservando histórico).                                               */
/* -------------------------------------------------------------------------- */

export const playbookOutputs = pgTable(
  'playbook_outputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Slug público URL-facing: `[empresa-kebab]-[6-char-hash]`. Único globalmente. */
    slug: text('slug').notNull().unique(),
    personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
    /** Nullable: empresa pode ser deletada sem perder o playbook (histórico). */
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),

    /** Snapshot completo das respostas do quiz (todas as 11 perguntas + livre). */
    quizData: jsonb('quiz_data').notNull(),

    /**
     * Chave do template renderizado, no formato `{area}-{dor-curta}-{tentativas-curta}`.
     * Ex: 'marketing-cac-morreu', 'vendas-coldoutreach-nunca', 'rh-talento-morreu'.
     * Permite regenerar/auditar com qual template a página foi montada.
     */
    templateKey: text('template_key').notNull(),

    /**
     * Variáveis injetadas no template (hero number, paragrafo conector,
     * checklist items condicionais, calculadora defaults, etc).
     * Estrutura definida em /source-of-truth/specs/playbook-employee-led-growth.md §6.2.
     */
    renderedData: jsonb('rendered_data').notNull(),

    /** Tracking de revisitas — sinal comercial pro CRM. Incrementado a cada view. */
    viewCount: integer('view_count').notNull().default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    /** IP do visualizador HASHED (sha256 com salt do COOKIE_SECRET) — LGPD. */
    lastViewedIp: text('last_viewed_ip'),

    // Coluna pdf_exported_at removida na migration 0006 (mai/2026) — PDF
    // export saiu de escopo. Decisão registrada em copy-final §4.9.

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_playbook_outputs_person').on(t.personId),
    index('idx_playbook_outputs_created').on(t.createdAt),
    index('idx_playbook_outputs_template').on(t.templateKey),
  ],
);

/* -------------------------------------------------------------------------- */
/*  pr_articles (Mídia & PR — tracking de artigos publicados via SaaS de PR)  */
/* -------------------------------------------------------------------------- */

export const prArticles = pgTable('pr_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  articleUrl: text('article_url'), // URL externo da notícia no veículo (https://infomoney.com.br/...)
  outlet: text('outlet'), // veículo (InfoMoney, Exame, etc) — opcional
  shortlinkCode: text('shortlink_code'), // ex: pr-elg-mai26 (corresponde a /l/[code])
  utmCampaign: text('utm_campaign'), // ex: 'artigo-employee-led-growth-mai26'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  campaigns — iniciativas de GTM (Web Summit, lançamento, etc)              */
/* -------------------------------------------------------------------------- */
/**
 * Cada linha vira uma "campanha" exibida em /internal/dashboard/campanhas.
 * O drill-down [slug] cruza com people.firstTouchCampaign pra puxar leads.
 *
 * `slug` é a chave humana usada na URL — e também o valor exato em utm_campaign.
 *
 * `channels` é jsonb estruturado: cada canal tem N touchpoints (URLs/shortlinks).
 * Schema:
 *   [{ name: 'LinkedIn', touchpoints: [{ url: '...', label: '...' }, ...] }, ...]
 *
 * `endDate` é nullable — `alwaysOn=true` deixa a campanha sem fim definido.
 */
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(), // ex: 'web-summit-rio-2026' (= utm_campaign)
  name: text('name').notNull(),           // ex: 'Web Summit Rio 2026'
  objective: text('objective').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  alwaysOn: boolean('always_on').notNull().default(false),
  channels: jsonb('channels').$type<Array<{
    name: string;
    touchpoints: Array<{ url: string; label?: string }>;
  }>>().notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  utm_links — histórico do UTM Generator (mai/2026)                          */
/* -------------------------------------------------------------------------- */
/**
 * Cada linha = 1 link UTM gerado via /internal/dashboard/utm.
 *
 * Substitui o localStorage do gerador HTML legado. Permite:
 *   - Cross-device (Clara vê os mesmos links do celular)
 *   - Cruzar com GA4 (sessions/conversions por utm_campaign)
 *   - Vincular com campanhas existentes (campaigns.slug = utmCampaign)
 *
 * `shortCode` é nullable — só preenchido se o user gerou shortlink
 * (campo opcional, requer Vercel KV). URL completo gerado fica em `fullUrl`
 * pra dispensar reconstrução. `label` é nome amigável opcional.
 */
export const utmLinks = pgTable('utm_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label'),
  baseUrl: text('base_url').notNull(),
  utmSource: text('utm_source').notNull(),
  utmMedium: text('utm_medium').notNull(),
  utmCampaign: text('utm_campaign').notNull(),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
  fullUrl: text('full_url').notNull(),
  shortCode: text('short_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_utm_links_campaign').on(t.utmCampaign),
  index('idx_utm_links_created_at').on(t.createdAt),
]);

/* -------------------------------------------------------------------------- */
/*  extension_tokens                                                           */
/* -------------------------------------------------------------------------- */

export const extensionTokens = pgTable('extension_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  label: text('label'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

/* -------------------------------------------------------------------------- */
/*  form_definitions — catálogo dos forms do site + extensão (Task 1 CRM)     */
/* -------------------------------------------------------------------------- */
/**
 * Cada linha = 1 form que captura leads pro CRM.
 *
 * - `slug` é a chave humana usada em código (FormSlug em lib/form-definitions).
 * - `kind` decide se o form gera segmentação dinâmica (topo_funil — Report
 *   pergunta intencao_uso) ou se é 100% Líder B2B por design (lider_b2b_only).
 * - `ac_tag` é o nome da tag aplicada no AC pra disparar cadências —
 *   ATENÇÃO: naming é específico por slug pra suportar múltiplos materiais
 *   futuros (Form: Algoritmo TikTok 2027 etc). A tag atual `Form: Algoritmo
 *   LinkedIn 2026` é MANTIDA (não renomeada pra Form: Report).
 * - `fields_schema` é DESCRITIVO (catálogo) — validação real continua via
 *   Zod hardcoded em app/actions/_schemas.ts. Pra UI/admin futura listar
 *   campos esperados de cada form.
 *
 * Seed inicial via Chrome MCP no Neon (Task 1 — May 2026). Adicionar form
 * novo: INSERT aqui + criar adapter em lib/form-adapters/ + server action.
 */
export const formDefinitions = pgTable('form_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  kind: text('kind').notNull(), // 'topo_funil' | 'lider_b2b_only' (CHECK no DB)
  acTag: text('ac_tag').notNull(),
  fieldsSchema: jsonb('fields_schema').$type<Record<string, unknown>>().notNull().default({}),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  google_oauth_tokens — auth de usuário pra GA4 + Search Console            */
/* -------------------------------------------------------------------------- */
/**
 * Substitui Service Account pra ler GA4/SC. O GA4 admin via UI bloqueia SAs
 * novas (bug conhecido do Google), então o dashboard usa OAuth de usuário:
 *   Clara faz login uma vez em /internal/dashboard/connect-google,
 *   Google retorna refresh_token, salvamos aqui,
 *   ga4.ts e search-console.ts puxam token daqui e refrescam quando expira.
 *
 * Como é single-user (só Clara acessa o /internal), basta UMA linha aqui.
 * Pra suportar multi-user no futuro, vincula a user id.
 */

export const googleOauthTokens = pgTable('google_oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scopes: text('scopes').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const statusesRelations = relations(statuses, ({ many }) => ({
  people: many(people),
  companies: many(companies),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  company: one(companies, {
    fields: [people.companyId],
    references: [companies.id],
  }),
  status: one(statuses, {
    fields: [people.statusId],
    references: [statuses.id],
  }),
  activities: many(activities),
  meetings: many(meetings),
  mergedInto: one(people, {
    fields: [people.mergedIntoId],
    references: [people.id],
    relationName: 'merge',
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  status: one(statuses, {
    fields: [companies.statusId],
    references: [statuses.id],
  }),
  people: many(people),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  person: one(people, {
    fields: [activities.personId],
    references: [people.id],
  }),
  company: one(companies, {
    fields: [activities.companyId],
    references: [companies.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  person: one(people, {
    fields: [meetings.personId],
    references: [people.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Status = typeof statuses.$inferSelect;
export type NewStatus = typeof statuses.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type ExtensionToken = typeof extensionTokens.$inferSelect;
export type NewExtensionToken = typeof extensionTokens.$inferInsert;
export type PrArticle = typeof prArticles.$inferSelect;
export type NewPrArticle = typeof prArticles.$inferInsert;
export type CampaignRow = typeof campaigns.$inferSelect;
export type NewCampaignRow = typeof campaigns.$inferInsert;
export type GoogleOauthToken = typeof googleOauthTokens.$inferSelect;
export type NewGoogleOauthToken = typeof googleOauthTokens.$inferInsert;
export type FormDefinition = typeof formDefinitions.$inferSelect;
export type NewFormDefinition = typeof formDefinitions.$inferInsert;
