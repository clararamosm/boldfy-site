/**
 * Server actions do CRM.
 *
 * movePerson(personId, status) — muda status de uma Pessoa + log activity
 * moveCompany(companyId, status) — idem pra Empresa
 * logManualInteraction(...) — registra interação manual (timeline + score)
 * updatePersonNotes(personId, notes) — edita notas internas
 * archivePerson(personId) — soft delete (archived = true)
 *
 * AC sync bidirecional fica pra Sprint 4 (TODO marcado in-line).
 */

'use server';

import { db, people, companies } from '@/db';
import { logActivity } from '@/lib/crm';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PersonStatusSchema = z.enum(['Ativo', 'Lead', 'Quente']);
const CompanyStatusSchema = z.enum([
  'No status', 'Quero prospectar', 'Reunião marcada',
  'Em andamento', 'Fechado', 'Perdido',
]);
const ManualSubtypeSchema = z.enum([
  'linkedin_message', 'linkedin_engagement', 'whatsapp',
  'email_manual', 'phone_call', 'meeting_extra', 'other',
]);

type ActionResult = { ok: true } | { ok: false; error: string };

export async function movePerson(
  personId: string,
  newStatus: string,
): Promise<ActionResult> {
  const parsed = PersonStatusSchema.safeParse(newStatus);
  if (!parsed.success) return { ok: false, error: 'Status inválido.' };

  try {
    const [prev] = await db
      .select({ status: people.status })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!prev) return { ok: false, error: 'Pessoa não encontrada.' };
    if (prev.status === parsed.data) return { ok: true }; // no-op

    await db
      .update(people)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(people.id, personId));

    await logActivity({
      personId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { from: prev.status, to: parsed.data, reason: 'manual' },
    });

    // TODO Sprint 4: trigger AC tag sync ("Status: Lead", "Status: Quente")

    revalidatePath('/internal/crm');
    revalidatePath(`/internal/crm/people/${personId}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[movePerson] failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function moveCompany(
  companyId: string,
  newStatus: string,
): Promise<ActionResult> {
  const parsed = CompanyStatusSchema.safeParse(newStatus);
  if (!parsed.success) return { ok: false, error: 'Status inválido.' };

  try {
    const [prev] = await db
      .select({ status: companies.status })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!prev) return { ok: false, error: 'Empresa não encontrada.' };
    if (prev.status === parsed.data) return { ok: true };

    await db
      .update(companies)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await logActivity({
      companyId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { from: prev.status, to: parsed.data, entity: 'company', reason: 'manual' },
    });

    // TODO Sprint 4: trigger AC tag sync (ex: "Cliente: True" pra Fechado)

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
