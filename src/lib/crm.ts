/**
 * Lib core do CRM Boldfy — upserts de Person/Company + log de activities.
 *
 * Sprint 3a: Status virou tabela editável (`statuses`). Promoção automática
 * lê thresholds dinamicamente via lib/statuses.ts.
 *
 * Falhas: NUNCA throw — sempre retorna { ok, ... } pra caller decidir.
 */

import { db, people, companies, activities } from '@/db';
import type { Person, Company, NewActivity } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { getDefaultStatus, statusForScore, shouldAutoPromote } from './statuses';

/* -------------------------------------------------------------------------- */
/*  Pesos pré-definidos por tipo de activity                                  */
/* -------------------------------------------------------------------------- */

const ACTIVITY_WEIGHTS: Record<string, number> = {
  page_view: 1,
  page_view_precos: 5,
  page_view_solucoes: 3,
  page_view_agendar_demo: 5,
  blog_read: 2,
  form_submit_report: 10,
  form_submit_beta: 25,
  form_submit_demo: 50,
  form_submit_proposta: 50,
  material_download: 5,
  email_open: 1,
  email_click: 3,
  cal_scheduled: 30,
  cal_attended: 30,
  cal_noshow: -10,
  cal_cancelled: 0,
  extension_save: 0,
  linkedin_engagement: 5,
  status_change: 0,
};

export function weightForActivity(type: string, subtype?: string): number {
  const key = subtype ? `${type}_${subtype}` : type;
  if (ACTIVITY_WEIGHTS[key] !== undefined) return ACTIVITY_WEIGHTS[key];
  if (ACTIVITY_WEIGHTS[type] !== undefined) return ACTIVITY_WEIGHTS[type];
  return 0;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SourceChannel = 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown';
export type SourceMethod = 'form_demo' | 'form_beta' | 'form_report' | 'form_proposta' | 'extension_linkedin' | 'manual' | 'imported_folk';

export type UpsertPersonInput = {
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  headline?: string;
  location?: string;
  acContactId?: string;
  sourceChannel?: SourceChannel;
  sourcePage?: string;
  sourceMethod?: SourceMethod;
  firstTouchSource?: string;
  firstTouchCampaign?: string;
};

export type UpsertCompanyInput = {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  linkedinUrl?: string;
};

export type LogActivityInput = {
  personId?: string;
  companyId?: string;
  type: string;
  subtype?: string;
  weight?: number;
  source?: 'web' | 'email' | 'cal' | 'linkedin' | 'manual' | 'system';
  data?: Record<string, unknown>;
};

export type CrmResult<T> = { ok: true; data: T } | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  upsertCompany                                                              */
/* -------------------------------------------------------------------------- */

export async function upsertCompany(input: UpsertCompanyInput): Promise<CrmResult<Company>> {
  try {
    const name = input.name.trim();
    if (name.length === 0) return { ok: false, error: 'Nome de empresa vazio' };

    const existing = await db
      .select()
      .from(companies)
      .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
      .limit(1);

    if (existing[0]) {
      const updates: Partial<Company> = {};
      if (input.industry && !existing[0].industry) updates.industry = input.industry;
      if (input.size && !existing[0].size) updates.size = input.size;
      if (input.website && !existing[0].website) updates.website = input.website;
      if (input.linkedinUrl && !existing[0].linkedinUrl) updates.linkedinUrl = input.linkedinUrl;
      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(companies)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(companies.id, existing[0].id))
          .returning();
        return { ok: true, data: updated };
      }
      return { ok: true, data: existing[0] };
    }

    const defaultStatus = await getDefaultStatus('company');
    const [created] = await db
      .insert(companies)
      .values({
        name,
        industry: input.industry,
        size: input.size,
        website: input.website,
        linkedinUrl: input.linkedinUrl,
        statusId: defaultStatus?.id ?? null,
        firstTouchAt: new Date(),
      })
      .returning();
    return { ok: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.upsertCompany] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  upsertPerson                                                               */
/* -------------------------------------------------------------------------- */

export async function upsertPerson(
  input: UpsertPersonInput,
  companyId?: string,
): Promise<CrmResult<Person>> {
  try {
    const email = input.email.trim().toLowerCase();
    if (email.length === 0) return { ok: false, error: 'Email vazio' };

    const existing = await db
      .select()
      .from(people)
      .where(eq(people.email, email))
      .limit(1);

    if (existing[0]) {
      const updates: Partial<Person> = { lastTouchAt: new Date() };
      if (input.phone && !existing[0].phone) updates.phone = input.phone;
      if (input.jobTitle && !existing[0].jobTitle) updates.jobTitle = input.jobTitle;
      if (input.linkedinUrl && !existing[0].linkedinUrl) updates.linkedinUrl = input.linkedinUrl;
      if (input.photoUrl && !existing[0].photoUrl) updates.photoUrl = input.photoUrl;
      if (input.headline && !existing[0].headline) updates.headline = input.headline;
      if (input.location && !existing[0].location) updates.location = input.location;
      if (input.acContactId && !existing[0].acContactId) updates.acContactId = input.acContactId;
      if (companyId && !existing[0].companyId) updates.companyId = companyId;

      const [updated] = await db
        .update(people)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(people.id, existing[0].id))
        .returning();
      return { ok: true, data: updated };
    }

    const defaultStatus = await getDefaultStatus('person');
    const [created] = await db
      .insert(people)
      .values({
        name: input.name.trim(),
        email,
        phone: input.phone,
        jobTitle: input.jobTitle,
        linkedinUrl: input.linkedinUrl,
        photoUrl: input.photoUrl,
        headline: input.headline,
        location: input.location,
        companyId,
        statusId: defaultStatus?.id ?? null,
        leadScore: 0,
        sourceChannel: input.sourceChannel ?? 'unknown',
        sourcePage: input.sourcePage,
        sourceMethod: input.sourceMethod ?? 'manual',
        firstTouchAt: new Date(),
        firstTouchSource: input.firstTouchSource ?? input.sourceChannel,
        firstTouchCampaign: input.firstTouchCampaign,
        lastTouchAt: new Date(),
        acContactId: input.acContactId,
      })
      .returning();
    return { ok: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.upsertPerson] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  logActivity — atualiza score + auto-promote status                        */
/* -------------------------------------------------------------------------- */

export async function logActivity(
  input: LogActivityInput,
): Promise<CrmResult<{ activityId: string; newScore?: number; newStatusId?: string }>> {
  try {
    const weight = input.weight ?? weightForActivity(input.type, input.subtype);

    const activityValues: NewActivity = {
      personId: input.personId,
      companyId: input.companyId,
      type: input.type,
      weight,
      source: input.source,
      data: input.subtype
        ? { subtype: input.subtype, ...input.data }
        : input.data,
    };

    const [activity] = await db
      .insert(activities)
      .values(activityValues)
      .returning({ id: activities.id });

    let newScore: number | undefined;
    let newStatusId: string | undefined;

    if (weight !== 0 && input.personId) {
      const [updated] = await db
        .update(people)
        .set({
          leadScore: sql`GREATEST(0, ${people.leadScore} + ${weight})`,
          lastTouchAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(people.id, input.personId))
        .returning({ leadScore: people.leadScore, statusId: people.statusId });

      if (updated) {
        newScore = updated.leadScore;
        const desiredStatus = await statusForScore(newScore);
        if (desiredStatus) {
          const shouldPromote = await shouldAutoPromote(updated.statusId, desiredStatus.id);
          if (shouldPromote) {
            await db
              .update(people)
              .set({ statusId: desiredStatus.id, updatedAt: new Date() })
              .where(eq(people.id, input.personId));
            newStatusId = desiredStatus.id;

            await db.insert(activities).values({
              personId: input.personId,
              type: 'status_change',
              weight: 0,
              source: 'system',
              data: { fromId: updated.statusId, toId: desiredStatus.id, reason: 'auto_score_threshold' },
            });
          }
        }
      }
    }

    return { ok: true, data: { activityId: activity.id, newScore, newStatusId } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.logActivity] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  recordLeadFromForm — wrapper alto-nível pros server actions de form        */
/* -------------------------------------------------------------------------- */

export type RecordLeadInput = {
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  companyIndustry?: string;
  companySize?: string;
  acContactId?: string;
  sourceChannel?: SourceChannel;
  sourcePage?: string;
  sourceMethod: SourceMethod;
  utmCampaign?: string;
  activityType: string;
  activityData?: Record<string, unknown>;
};

export async function recordLeadFromForm(
  input: RecordLeadInput,
): Promise<CrmResult<{ personId: string; companyId?: string }>> {
  let companyId: string | undefined;

  if (input.companyName) {
    const c = await upsertCompany({
      name: input.companyName,
      industry: input.companyIndustry,
      size: input.companySize,
    });
    if (c.ok) companyId = c.data.id;
  }

  const p = await upsertPerson(
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      jobTitle: input.jobTitle,
      acContactId: input.acContactId,
      sourceChannel: input.sourceChannel,
      sourcePage: input.sourcePage,
      sourceMethod: input.sourceMethod,
      firstTouchSource: input.sourceChannel,
      firstTouchCampaign: input.utmCampaign,
    },
    companyId,
  );

  if (!p.ok) return { ok: false, error: p.error };

  await logActivity({
    personId: p.data.id,
    companyId,
    type: input.activityType,
    source: 'web',
    data: input.activityData,
  });

  return { ok: true, data: { personId: p.data.id, companyId } };
}
