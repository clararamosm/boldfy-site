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
