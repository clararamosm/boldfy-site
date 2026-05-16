/**
 * Drizzle schema do CRM Boldfy.
 *
 * Fonte de verdade: docs/SPEC-crm-boldfy.md (seção 8 — Data model).
 *
 * Convenções:
 *  - IDs sempre UUID (gen_random_uuid no Postgres)
 *  - Timestamps com timezone (TIMESTAMPTZ)
 *  - Strings com tamanho ilimitado por padrão (text), só limita se faz sentido
 *  - FKs com onDelete: cascade quando dependência é forte (activities, meetings)
 *  - merged_into_id em people permite soft-merge auditável (ver seção 9.8 da SPEC)
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

export const personStatusEnum = pgEnum('person_status', ['Ativo', 'Lead', 'Quente']);

export const companyStatusEnum = pgEnum('company_status', [
  'No status',
  'Quero prospectar',
  'Reunião marcada',
  'Em andamento',
  'Fechado',
  'Perdido',
]);

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
/*  companies                                                                  */
/* -------------------------------------------------------------------------- */

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    industry: text('industry'), // "Saúde", "Fintech", etc
    size: text('size'), // "11-50", "51-200", etc
    website: text('website'),
    linkedinUrl: text('linkedin_url'),
    status: companyStatusEnum('status').notNull().default('No status'),
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
    // Match case-insensitive por nome (dedupe)
    uniqueIndex('idx_companies_name_lower').on(sql`LOWER(${t.name})`),
    index('idx_companies_status').on(t.status),
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
    photoUrl: text('photo_url'), // do LinkedIn quando extensão; fallback = iniciais
    jobTitle: text('job_title'), // cargo separado de headline (vem de form OR parsed)
    headline: text('headline'), // raw do LinkedIn ("CMO at Nuvini") — backup
    location: text('location'),
    companyId: uuid('company_id').references(() => companies.id),
    status: personStatusEnum('status').notNull().default('Ativo'),
    leadScore: integer('lead_score').notNull().default(0),

    // Origem em 3 dimensões (ver seção 8.1 da SPEC)
    sourceChannel: sourceChannelEnum('source_channel').default('unknown'),
    sourcePage: text('source_page'), // '/agendar-demo' | '/materiais' | etc
    sourceMethod: sourceMethodEnum('source_method').default('manual'),

    // First touch (immutable depois do primeiro write)
    firstTouchAt: timestamp('first_touch_at', { withTimezone: true }),
    firstTouchSource: text('first_touch_source'),
    firstTouchCampaign: text('first_touch_campaign'),

    lastTouchAt: timestamp('last_touch_at', { withTimezone: true }),
    acContactId: text('ac_contact_id'),
    acTags: text('ac_tags').array(), // denormalizado pra busca rápida
    internalNotes: text('internal_notes'),
    archived: boolean('archived').notNull().default(false),
    mergedIntoId: uuid('merged_into_id'), // self-ref (não usa references() pra evitar circular)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_people_email').on(t.email),
    uniqueIndex('idx_people_linkedin').on(t.linkedinUrl),
    index('idx_people_status').on(t.status),
    index('idx_people_company').on(t.companyId),
    index('idx_people_score').on(t.leadScore),
    index('idx_people_source').on(t.sourceChannel, t.sourcePage),
  ],
);

/* -------------------------------------------------------------------------- */
/*  activities (event log)                                                     */
/* -------------------------------------------------------------------------- */

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'page_view' | 'form_submit' | 'manual_interaction' | etc
    weight: integer('weight').notNull().default(0), // pontos somados ao lead_score
    source: text('source'), // 'web' | 'email' | 'cal' | 'linkedin' | 'manual' | 'system'
    data: jsonb('data'), // payload livre (subtype, observation, page url, etc)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_activities_person').on(t.personId, t.createdAt),
    index('idx_activities_company').on(t.companyId, t.createdAt),
    index('idx_activities_type').on(t.type, t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  meetings (Cal.com)                                                         */
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
/*  extension_tokens (auth da Chrome extension)                                */
/* -------------------------------------------------------------------------- */

export const extensionTokens = pgTable('extension_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(), // bcrypt do token; nunca armazena plain text
  label: text('label'), // "Chrome Clara MacBook"
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

/* -------------------------------------------------------------------------- */
/*  Relations (Drizzle relational queries)                                     */
/* -------------------------------------------------------------------------- */

export const peopleRelations = relations(people, ({ one, many }) => ({
  company: one(companies, {
    fields: [people.companyId],
    references: [companies.id],
  }),
  activities: many(activities),
  meetings: many(meetings),
  mergedInto: one(people, {
    fields: [people.mergedIntoId],
    references: [people.id],
    relationName: 'merge',
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
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
