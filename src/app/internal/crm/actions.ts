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
