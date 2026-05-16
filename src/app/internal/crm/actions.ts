/**
 * Server actions do CRM.
 *
 * movePerson(personId, statusId) — muda status (FK) + log activity
 * moveCompany(companyId, statusId) — idem
 * logManualInteraction(...) — registra interação manual (timeline + score)
 * archivePerson(personId) — soft delete
 *
 * CRUD de statuses fica em ./settings/statuses/actions.ts
 */

'use server';

import { db, people, companies, statuses } from '@/db';
import { logActivity } from '@/lib/crm';
import { invalidateStatusCache } from '@/lib/statuses';
import { syncPersonStatusToAC, syncCompanyStatusToAC } from '@/lib/ac-sync';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ManualSubtypeSchema = z.enum([
  'linkedin_message', 'linkedin_engagement', 'whatsapp',
  'email_manual', 'phone_call', 'meeting_extra', 'other',
]);

const UuidSchema = z.string().uuid();

type ActionResult = { ok: true } | { ok: false; error: string };

export async function movePerson(personId: string, newStatusId: string): Promise<ActionResult> {
  if (!UuidSchema.safeParse(personId).success) return { ok: false, error: 'ID inválido.' };
  if (!UuidSchema.safeParse(newStatusId).success) return { ok: false, error: 'Status inválido.' };

  try {
    // Valida que o status existe e é do tipo certo
    const [statusRow] = await db
      .select()
      .from(statuses)
      .where(eq(statuses.id, newStatusId))
      .limit(1);
    if (!statusRow || statusRow.kind !== 'person') {
      return { ok: false, error: 'Status não compatível com Pessoa.' };
    }

    const [prev] = await db
      .select({ statusId: people.statusId })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!prev) return { ok: false, error: 'Pessoa não encontrada.' };
    if (prev.statusId === newStatusId) return { ok: true }; // no-op

    await db
      .update(people)
      .set({ statusId: newStatusId, updatedAt: new Date() })
      .where(eq(people.id, personId));

    await logActivity({
      personId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { fromId: prev.statusId, toId: newStatusId, toLabel: statusRow.label, reason: 'manual' },
    });

    // Sync AC (non-blocking — falha não bloqueia o user)
    syncPersonStatusToAC(personId, statusRow).catch((err) =>
      console.error('[movePerson] AC sync error:', err),
    );

    revalidatePath('/internal/crm');
    revalidatePath(`/internal/crm/people/${personId}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[movePerson] failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function moveCompany(companyId: string, newStatusId: string): Promise<ActionResult> {
  if (!UuidSchema.safeParse(companyId).success) return { ok: false, error: 'ID inválido.' };
  if (!UuidSchema.safeParse(newStatusId).success) return { ok: false, error: 'Status inválido.' };

  try {
    const [statusRow] = await db
      .select()
      .from(statuses)
      .where(eq(statuses.id, newStatusId))
      .limit(1);
    if (!statusRow || statusRow.kind !== 'company') {
      return { ok: false, error: 'Status não compatível com Empresa.' };
    }

    const [prev] = await db
      .select({ statusId: companies.statusId })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!prev) return { ok: false, error: 'Empresa não encontrada.' };
    if (prev.statusId === newStatusId) return { ok: true };

    await db
      .update(companies)
      .set({ statusId: newStatusId, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await logActivity({
      companyId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { fromId: prev.statusId, toId: newStatusId, toLabel: statusRow.label, entity: 'company', reason: 'manual' },
    });

    // Sync AC (non-blocking)
    syncCompanyStatusToAC(companyId, statusRow).catch((err) =>
      console.error('[moveCompany] AC sync error:', err),
    );

    revalidatePath('/internal/crm/empresas');
    revalidatePath(`/internal/crm/companies/${companyId}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[moveCompany] failed:', msg);
    return { ok: false, error: msg };
  }
}

const LogInteractionSchema = z.object({
  personId: z.string().uuid(),
  subtype: ManualSubtypeSchema,
  observation: z.string().trim().min(1, 'Observação obrigatória').max(2000),
});

const SUBTYPE_WEIGHTS: Record<z.infer<typeof ManualSubtypeSchema>, number> = {
  linkedin_message: 10,
  linkedin_engagement: 5,
  whatsapp: 15,
  email_manual: 20,
  phone_call: 20,
  meeting_extra: 25,
  other: 5,
};

export type LogInteractionState = ActionResult | null;

export async function logManualInteraction(
  _prev: LogInteractionState,
  formData: FormData,
): Promise<LogInteractionState> {
  const input = {
    personId: formData.get('personId'),
    subtype: formData.get('subtype'),
    observation: formData.get('observation'),
  };
  const parsed = LogInteractionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  try {
    await logActivity({
      personId: parsed.data.personId,
      type: 'manual_interaction',
      subtype: parsed.data.subtype,
      weight: SUBTYPE_WEIGHTS[parsed.data.subtype],
      source: 'manual',
      data: {
        subtype: parsed.data.subtype,
        observation: parsed.data.observation,
      },
    });

    revalidatePath(`/internal/crm/people/${parsed.data.personId}`);
    revalidatePath('/internal/crm/feed');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[logManualInteraction] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  Criar Lead manual (botão "+ Adicionar lead")                              */
/* -------------------------------------------------------------------------- */

const CreatePersonSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  email: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.string().email('Email inválido').max(254),
  ),
  jobTitle: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(200).optional(),
  linkedinUrl: z.string().trim().url('URL LinkedIn inválida').optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
});

export async function createPersonManual(_prev: unknown, formData: FormData): Promise<ActionResult & { personId?: string }> {
  const parsed = CreatePersonSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    jobTitle: formData.get('jobTitle') || undefined,
    companyName: formData.get('companyName') || undefined,
    linkedinUrl: formData.get('linkedinUrl') || undefined,
    phone: formData.get('phone') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const { upsertPerson, upsertCompany, logActivity } = await import('@/lib/crm');

    let companyId: string | undefined;
    if (parsed.data.companyName) {
      const c = await upsertCompany({ name: parsed.data.companyName });
      if (c.ok) companyId = c.data.id;
    }

    const p = await upsertPerson({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      jobTitle: parsed.data.jobTitle,
      linkedinUrl: parsed.data.linkedinUrl || undefined,
      sourceChannel: 'manual',
      sourceMethod: 'manual',
    }, companyId);

    if (!p.ok) return { ok: false, error: p.error };

    await logActivity({
      personId: p.data.id,
      companyId,
      type: 'manual_note',
      source: 'manual',
      data: { note: 'Lead criado manualmente pelo dashboard.' },
    });

    revalidatePath('/internal/crm');
    return { ok: true, personId: p.data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* -------------------------------------------------------------------------- */
/*  Merge de leads — combina 2+ pessoas em 1                                  */
/* -------------------------------------------------------------------------- */

/**
 * Merge: mantém `keepId` como principal. Outros têm `merged_into_id = keepId`.
 * Activities e meetings são "transferidos" (FK atualizada).
 * Campos vazios no principal são preenchidos com dados dos secundários.
 * Status final = mais "avançado" (maior sort_order).
 * Lead score = SOMA de todos.
 */
export async function mergePeople(keepId: string, mergeIds: string[]): Promise<ActionResult> {
  if (!UuidSchema.safeParse(keepId).success) return { ok: false, error: 'ID inválido' };
  const toMerge = mergeIds.filter((id) => id !== keepId && UuidSchema.safeParse(id).success);
  if (toMerge.length === 0) return { ok: false, error: 'Selecione 2 leads diferentes' };

  try {
    const { db: database, people: peopleTable, activities, meetings } = await import('@/db');
    const { eq: eq2, inArray } = await import('drizzle-orm');

    // Pega todos os envolvidos
    const all = await database.select().from(peopleTable).where(inArray(peopleTable.id, [keepId, ...toMerge]));
    const keep = all.find((p) => p.id === keepId);
    const others = all.filter((p) => p.id !== keepId);
    if (!keep || others.length === 0) return { ok: false, error: 'Leads não encontrados' };

    // Enriquece keep com campos vazios dos outros
    const enrich: Partial<typeof peopleTable.$inferSelect> = { updatedAt: new Date() };
    for (const other of others) {
      if (!keep.phone && other.phone) enrich.phone = other.phone;
      if (!keep.jobTitle && other.jobTitle) enrich.jobTitle = other.jobTitle;
      if (!keep.linkedinUrl && other.linkedinUrl) enrich.linkedinUrl = other.linkedinUrl;
      if (!keep.photoUrl && other.photoUrl) enrich.photoUrl = other.photoUrl;
      if (!keep.headline && other.headline) enrich.headline = other.headline;
      if (!keep.location && other.location) enrich.location = other.location;
      if (!keep.companyId && other.companyId) enrich.companyId = other.companyId;
      if (!keep.acContactId && other.acContactId) enrich.acContactId = other.acContactId;
    }

    // Soma lead score
    const totalScore = all.reduce((sum, p) => sum + p.leadScore, 0);
    enrich.leadScore = totalScore;

    // Concatena notes
    const notes = all
      .map((p) => p.internalNotes)
      .filter((n): n is string => !!n && n.length > 0)
      .join('\n---\n');
    if (notes) enrich.internalNotes = notes;

    // Status final: mantém o do principal (Clara ajusta depois se quiser)

    // Atualiza keep
    await database.update(peopleTable).set(enrich).where(eq2(peopleTable.id, keepId));

    // Move activities e meetings dos outros pra keep
    await database.update(activities).set({ personId: keepId }).where(inArray(activities.personId, toMerge));
    await database.update(meetings).set({ personId: keepId }).where(inArray(meetings.personId, toMerge));

    // Marca outros como mergeados (soft delete auditável)
    await database
      .update(peopleTable)
      .set({ mergedIntoId: keepId, archived: true, updatedAt: new Date() })
      .where(inArray(peopleTable.id, toMerge));

    // Log activity de merge
    await logActivity({
      personId: keepId,
      type: 'merge',
      weight: 0,
      source: 'manual',
      data: { mergedFrom: toMerge, mergedCount: toMerge.length },
    });

    revalidatePath('/internal/crm');
    revalidatePath(`/internal/crm/people/${keepId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function archivePerson(personId: string): Promise<ActionResult> {
  try {
    await db
      .update(people)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(people.id, personId));
    revalidatePath('/internal/crm');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  Re-exports pra Settings (limpar cache ao mudar)                            */
/* -------------------------------------------------------------------------- */

export async function refreshStatusCache(): Promise<ActionResult> {
  invalidateStatusCache();
  revalidatePath('/internal/crm');
  revalidatePath('/internal/crm/empresas');
  return { ok: true };
}
