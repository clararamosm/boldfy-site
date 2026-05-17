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
import { getDefaultStatus, statusForScore, shouldAutoPromote, classifyByMethod, getStatuses, hasClassificationLadder } from './statuses';
import { syncCompanyFromPeople } from './crm-sync';

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
  /**
   * Quando informado, usa esse timestamp como firstTouchAt da pessoa nova.
   * Útil pra re-import do AC (passa cdate do contato) ou pra preservar a data
   * real do primeiro contato em qualquer import. Default = new Date() (hoje).
   * Só aplica em INSERT — pessoa existente não tem firstTouchAt sobrescrito.
   */
  firstTouchAt?: Date;
};

export type UpsertCompanyInput = {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  linkedinUrl?: string;
  /** Default = new Date(). Mesma semântica do upsertPerson — só aplica em INSERT. */
  firstTouchAt?: Date;
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
        firstTouchAt: input.firstTouchAt ?? new Date(),
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
    const firstTouch = input.firstTouchAt ?? new Date();
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
        firstTouchAt: firstTouch,
        firstTouchSource: input.firstTouchSource ?? input.sourceChannel,
        firstTouchCampaign: input.firstTouchCampaign,
        // lastTouchAt = firstTouch quando importando histórico, pra timeline
        // não desalinhar (lastTouch nunca anterior a firstTouch).
        lastTouchAt: firstTouch,
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

            // Auto-promote da pessoa → tenta promover empresa também (monotônico)
            const [personRow] = await db
              .select({ companyId: people.companyId })
              .from(people)
              .where(eq(people.id, input.personId))
              .limit(1);
            if (personRow?.companyId) {
              await syncCompanyFromPeople(personRow.companyId);
            }
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

  // Activity da submissão ANTES de classificar — pra timeline ficar coerente
  // (form submit primeiro, depois eventual status_change auto).
  await logActivity({
    personId: p.data.id,
    companyId,
    type: input.activityType,
    source: 'web',
    data: input.activityData,
  });

  // CLASSIFICAÇÃO POR sourceMethod (mai/2026 — substitui regra antiga por score):
  // forms report → Ativo, beta/demo/proposta → Quente, extension_linkedin → LinkedIn Lead.
  // NÃO-REGRESSÃO: se a pessoa já está em status MAIS avançado (sortOrder maior)
  // que o target, NÃO regride — só registra que o form foi preenchido (via activity
  // logada acima) e mantém o status atual. Vale pra TODOS os forms.
  await classifyPersonBySourceMethod(p.data.id, input.sourceMethod);

  return { ok: true, data: { personId: p.data.id, companyId } };
}

/**
 * Aplica regra de classificação de pessoa por sourceMethod, respeitando
 * não-regressão e auto-promotion.
 *
 * Exposto pra uso pela extensão futura também (que vai passar
 * sourceMethod='extension_linkedin').
 *
 * Comportamento:
 *  1. Resolve target status via classifyByMethod (lib/statuses.ts)
 *  2. Lê status atual da pessoa
 *  3. Se target tem sortOrder MAIOR que current OU pessoa não tem status → muda
 *  4. Caso contrário → não mexe (registra reason='no_regression' em activity de auditoria)
 *
 * Status atual é considerado "mais avançado" se: tem sortOrder maior, OU é
 * terminal (terminal sempre vence — não regride mesmo se sortOrder menor).
 */
export async function classifyPersonBySourceMethod(
  personId: string,
  sourceMethod: SourceMethod,
): Promise<void> {
  try {
    const [current] = await db
      .select({ statusId: people.statusId })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);
    if (!current) return;

    const all = await getStatuses('person');
    const currentStatus = current.statusId ? all.find((s) => s.id === current.statusId) : null;

    // Pessoa em terminal (Fechado/Perdido) — nunca mexe. Loga skip.
    if (currentStatus?.isTerminal) {
      await db.insert(activities).values({
        personId,
        type: 'classification_skipped',
        weight: 0,
        source: 'system',
        data: { reason: 'is_terminal', sourceMethod, currentStatus: currentStatus.label },
      });
      return;
    }

    // Método sem cadeia de classificação (ex: form_demo) — Cal webhook é
    // quem cuida do próximo passo. Loga skip com reason explícito.
    if (!hasClassificationLadder(sourceMethod as Parameters<typeof hasClassificationLadder>[0])) {
      await db.insert(activities).values({
        personId,
        type: 'classification_skipped',
        weight: 0,
        source: 'system',
        data: { reason: 'no_classification_by_design', sourceMethod, currentStatus: currentStatus?.label ?? null },
      });
      return;
    }

    // Resolve target via cadeia de promoção. Passa o sortOrder atual pra
    // classifyByMethod decidir qual elo da cadeia se aplica (Quente vs
    // Em andamento etc).
    const target = await classifyByMethod(sourceMethod, currentStatus?.sortOrder ?? null);

    if (!target) {
      // Cadeia toda menor que current — não promove (não regride).
      // Activity de auditoria pra timeline mostrar que o form foi processado.
      await db.insert(activities).values({
        personId,
        type: 'classification_skipped',
        weight: 0,
        source: 'system',
        data: {
          reason: 'no_regression',
          sourceMethod,
          currentStatus: currentStatus?.label ?? null,
        },
      });
      return;
    }

    // Aplica mudança + activity
    await db
      .update(people)
      .set({ statusId: target.id, updatedAt: new Date() })
      .where(eq(people.id, personId));

    await db.insert(activities).values({
      personId,
      type: 'status_change',
      weight: 0,
      source: 'system',
      data: {
        fromId: currentStatus?.id ?? null,
        toId: target.id,
        toLabel: target.label,
        reason: 'classify_by_method',
        sourceMethod,
      },
    });

    // Sync empresa linkada — classificação de pessoa pode mudar empresa também
    const [personRow] = await db
      .select({ companyId: people.companyId })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);
    if (personRow?.companyId) {
      await syncCompanyFromPeople(personRow.companyId);
    }
  } catch (err) {
    console.error('[crm.classifyPersonBySourceMethod] failed:', err);
    // Não-fatal — não bloqueia o fluxo de captação de lead
  }
}
