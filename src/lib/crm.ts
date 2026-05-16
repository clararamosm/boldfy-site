/**
 * Lib core do CRM Boldfy — upserts de Person/Company + log de activities.
 *
 * Usada pelas server actions de form (dual-write: AC + nosso DB) e pela API da
 * extensão Chrome. Mantém regras de negócio centralizadas:
 *
 *   - Dedupe por email (Person) e por nome lower (Company)
 *   - Upsert atomico (transaction)
 *   - Lead score promotion automático (Ativo→Lead→Quente nos thresholds)
 *   - Log de activity inline com cada mutação
 *   - First-touch attribution preservada (não sobrescreve depois do primeiro)
 *
 * Falhas: NUNCA throw — sempre retorna { ok, ... } pra caller decidir.
 * Erros de DB são logados mas não bloqueiam o fluxo do form.
 */

import { db, people, companies, activities } from '@/db';
import type { Person, Company, NewActivity } from '@/db';
import { and, eq, sql } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Lead score thresholds (sec 10.2 do SPEC)                                  */
/* -------------------------------------------------------------------------- */

/** Score >= esse valor promove pra Lead. */
export const THRESHOLD_LEAD = 21;
/** Score >= esse valor promove pra Quente. */
export const THRESHOLD_QUENTE = 51;

export function statusForScore(score: number): 'Ativo' | 'Lead' | 'Quente' {
  if (score >= THRESHOLD_QUENTE) return 'Quente';
  if (score >= THRESHOLD_LEAD) return 'Lead';
  return 'Ativo';
}

/* -------------------------------------------------------------------------- */
/*  Pesos pré-definidos por tipo de activity (sec 10.1)                       */
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
  extension_save: 0, // só registra, score começa no 0
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
/*  Types pros upserts                                                         */
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
  /** Override do peso (caso queira customizar). Se omitido, usa tabela. */
  weight?: number;
  source?: 'web' | 'email' | 'cal' | 'linkedin' | 'manual' | 'system';
  data?: Record<string, unknown>;
};

export type CrmResult<T> = { ok: true; data: T } | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  upsertCompany — match case-insensitive por nome                            */
/* -------------------------------------------------------------------------- */

export async function upsertCompany(
  input: UpsertCompanyInput,
): Promise<CrmResult<Company>> {
  try {
    const name = input.name.trim();
    if (name.length === 0) return { ok: false, error: 'Nome de empresa vazio' };

    const existing = await db
      .select()
      .from(companies)
      .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
      .limit(1);

    if (existing[0]) {
      // Enriquece campos vazios sem sobrescrever
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

    // Cria nova
    const [created] = await db
      .insert(companies)
      .values({
        name,
        industry: input.industry,
        size: input.size,
        website: input.website,
        linkedinUrl: input.linkedinUrl,
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
/*  upsertPerson — match por email; enriquece sem sobrescrever first_touch    */
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
      // Enriquece campos vazios (não sobrescreve first_touch ou status)
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

    // Cria nova
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
        status: 'Ativo',
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
/*  logActivity — adiciona event + recalcula lead score se aplicvel          */
/* -------------------------------------------------------------------------- */

export async function logActivity(
  input: LogActivityInput,
): Promise<CrmResult<{ activityId: string; newScore?: number; newStatus?: string }>> {
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
    let newStatus: string | undefined;

    // Se tem peso > 0 e tem person associada, atualiza score + status
    if (weight !== 0 && input.personId) {
      const [updated] = await db
        .update(people)
        .set({
          leadScore: sql`GREATEST(0, ${people.leadScore} + ${weight})`,
          lastTouchAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(people.id, input.personId))
        .returning({ leadScore: people.leadScore, status: people.status });

      if (updated) {
        newScore = updated.leadScore;
        const desiredStatus = statusForScore(newScore);
        // Só promove (nunca demove auto — Clara controla manualmente)
        if (
          (updated.status === 'Ativo' && (desiredStatus === 'Lead' || desiredStatus === 'Quente')) ||
          (updated.status === 'Lead' && desiredStatus === 'Quente')
        ) {
          await db
            .update(people)
            .set({ status: desiredStatus, updatedAt: new Date() })
            .where(eq(people.id, input.personId));
          newStatus = desiredStatus;

          // Log o status_change como activity também (auditoria)
          await db.insert(activities).values({
            personId: input.personId,
            type: 'status_change',
            weight: 0,
            source: 'system',
            data: { from: updated.status, to: desiredStatus, reason: 'auto_score_threshold' },
          });
        }
      }
    }

    return { ok: true, data: { activityId: activity.id, newScore, newStatus } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.logActivity] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  Wrapper alto-nível pros server actions de form                             */
/* -------------------------------------------------------------------------- */

export type RecordLeadInput = {
  // Person
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  // Company
  companyName?: string;
  companyIndustry?: string;
  companySize?: string;
  // Tracking
  acContactId?: string;
  sourceChannel?: SourceChannel;
  sourcePage?: string;
  sourceMethod: SourceMethod;
  utmCampaign?: string;
  // Activity
  activityType: string; // ex: 'form_submit_demo'
  activityData?: Record<string, unknown>;
};

/**
 * Atomicamente: cria/atualiza Company (se fornecida) → cria/atualiza Person →
 * registra activity. Usada pelas server actions de form.
 *
 * Sempre retorna { ok: true } mesmo que algumas partes falhem (graceful
 * degradation — não bloqueia o submit do form se o nosso DB falhar). Erros
 * vão pro log.
 */
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
