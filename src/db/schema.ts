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
  'form_report',
  'form_proposta',
  'extension_linkedin',
  'manual',
  'imported_folk',
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
    internalNotes: text('internal_notes'),
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
/*  pr_articles (Mídia & PR — tracking de artigos publicados via SaaS de PR)  */
/* -------------------------------------------------------------------------- */

export const prArticles = pgTable('pr_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
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
export type ExtensionToken = typeof extensionTokens.$inferSelect;
export type NewExtensionToken = typeof extensionTokens.$inferInsert;
export type PrArticle = typeof prArticles.$inferSelect;
export type NewPrArticle = typeof prArticles.$inferInsert;
export type CampaignRow = typeof campaigns.$inferSelect;
export type NewCampaignRow = typeof campaigns.$inferInsert;
export type GoogleOauthToken = typeof googleOauthTokens.$inferSelect;
export type NewGoogleOauthToken = typeof googleOauthTokens.$inferInsert;
