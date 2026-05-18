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
import { syncCompanyFromPeople, propagateTerminalToCompanyPeople } from '@/lib/crm-sync';
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

    // Resolve fromLabel pra activity ter ambos os labels
    let fromLabel: string | null = null;
    if (prev.statusId) {
      const [fromRow] = await db.select({ label: statuses.label }).from(statuses).where(eq(statuses.id, prev.statusId)).limit(1);
      fromLabel = fromRow?.label ?? null;
    }

    await db
      .update(people)
      .set({ statusId: newStatusId, updatedAt: new Date() })
      .where(eq(people.id, personId));

    await logActivity({
      personId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { fromId: prev.statusId, toId: newStatusId, fromLabel, toLabel: statusRow.label, reason: 'manual' },
    });

    // Sync AC (non-blocking — falha não bloqueia o user)
    syncPersonStatusToAC(personId, statusRow).catch((err) =>
      console.error('[movePerson] AC sync error:', err),
    );

    // Sync da empresa linkada (se houver) — pessoa mudou, empresa pode promover
    const [personRow] = await db.select({ companyId: people.companyId }).from(people).where(eq(people.id, personId)).limit(1);
    if (personRow?.companyId) {
      await syncCompanyFromPeople(personRow.companyId);
      revalidatePath(`/internal/crm/companies/${personRow.companyId}`);
    }

    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
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

    // Resolve fromLabel pra activity ter ambos os labels
    let fromCompanyLabel: string | null = null;
    if (prev.statusId) {
      const [fromRow] = await db.select({ label: statuses.label }).from(statuses).where(eq(statuses.id, prev.statusId)).limit(1);
      fromCompanyLabel = fromRow?.label ?? null;
    }

    await logActivity({
      companyId,
      type: 'status_change',
      weight: 0,
      source: 'manual',
      data: { fromId: prev.statusId, toId: newStatusId, fromLabel: fromCompanyLabel, toLabel: statusRow.label, entity: 'company', reason: 'manual' },
    });

    // Sync AC (non-blocking)
    syncCompanyStatusToAC(companyId, statusRow).catch((err) =>
      console.error('[moveCompany] AC sync error:', err),
    );

    // Empresa terminal → propaga pra pessoas linkadas (Fechado/Perdido).
    // Empresa não-terminal NÃO toca pessoas (são agregação, mantêm autonomia).
    if (statusRow.isTerminal) {
      await propagateTerminalToCompanyPeople(companyId, newStatusId);
      revalidatePath('/internal/crm');
    }

    revalidatePath('/internal/crm/empresas');
    revalidatePath(`/internal/crm/companies/${companyId}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[moveCompany] failed:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Schema do log manual.
 *
 * Suporta 3 escopos:
 * 1. Pessoa específica (personId só) — uso original, no detalhe da pessoa
 * 2. Empresa toda (companyId só) — interação company-level sem vincular pessoa
 *    (ex: "enviei proposta", "reunião com comitê", "research de mercado")
 * 3. Pessoa numa empresa (personId + companyId) — usado na page da empresa
 *    quando a estrategista escolhe qual pessoa do comitê
 *
 * Validação: pelo menos um dos dois IDs deve estar presente.
 */
const LogInteractionSchema = z
  .object({
    personId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    subtype: ManualSubtypeSchema,
    observation: z.string().trim().min(1, 'Observação obrigatória').max(2000),
  })
  .refine((d) => !!d.personId || !!d.companyId, {
    message: 'Informe pessoa ou empresa.',
    path: ['personId'],
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
  // Treat empty strings as undefined pra zod entender o opcional
  const rawPersonId = formData.get('personId');
  const rawCompanyId = formData.get('companyId');
  const input = {
    personId: typeof rawPersonId === 'string' && rawPersonId.length > 0 ? rawPersonId : undefined,
    companyId: typeof rawCompanyId === 'string' && rawCompanyId.length > 0 ? rawCompanyId : undefined,
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
      companyId: parsed.data.companyId,
      type: 'manual_interaction',
      subtype: parsed.data.subtype,
      // Quando é company-level (sem person), score não aplica — peso 0 evita
      // distorcer o lead score de nenhuma pessoa específica
      weight: parsed.data.personId ? SUBTYPE_WEIGHTS[parsed.data.subtype] : 0,
      source: 'manual',
      data: {
        subtype: parsed.data.subtype,
        observation: parsed.data.observation,
        scope: parsed.data.personId ? 'person' : 'company',
      },
    });

    if (parsed.data.personId) {
      revalidatePath(`/internal/crm/people/${parsed.data.personId}`);
    }
    if (parsed.data.companyId) {
      revalidatePath(`/internal/crm/companies/${parsed.data.companyId}`);
    }
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
      personId: p.data.person.id,
      companyId,
      type: 'manual_note',
      source: 'manual',
      data: { note: 'Lead criado manualmente pelo dashboard.' },
    });

    revalidatePath('/internal/crm');
    return { ok: true, personId: p.data.person.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/* -------------------------------------------------------------------------- */
/*  Edit Company — atualiza campos básicos via page de detalhe                */
/* -------------------------------------------------------------------------- */

/**
 * Separa uma URL em website vs LinkedIn corporativo automaticamente.
 *
 * Hoje é comum o usuário colar o link do LinkedIn da empresa no campo
 * "website" (ou vice-versa) — esse helper detecta `linkedin.com/company/`
 * e roteia pro campo certo. Aceita URLs sem protocolo (auto-prefix https://).
 */
function classifyUrl(input: string | undefined | null): { website?: string; linkedinUrl?: string } {
  if (!input) return {};
  const trimmed = input.trim();
  if (trimmed.length === 0) return {};
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    const host = u.hostname.toLowerCase();
    if (host.includes('linkedin.com')) {
      return { linkedinUrl: withProto };
    }
    return { website: withProto };
  } catch {
    return {}; // URL malformada — ignora silenciosamente
  }
}

const UpdateCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200).optional(),
  industry: z.string().trim().max(120).optional().or(z.literal('')),
  size: z.string().trim().max(60).optional().or(z.literal('')),
  // URL "principal": pode ser website ou LinkedIn — classifyUrl roteia
  primaryUrl: z.string().trim().max(500).optional().or(z.literal('')),
  // URL explícita LinkedIn (quando user quer setar os 2 separadamente)
  linkedinExplicit: z.string().trim().max(500).optional().or(z.literal('')),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  internalNotes: z.string().trim().max(5000).optional().or(z.literal('')),
  nextAction: z.string().trim().max(500).optional().or(z.literal('')),
  estimatedValue: z.string().trim().max(20).optional().or(z.literal('')),
});

export type UpdateCompanyState = ActionResult | null;

export async function updateCompany(_prev: UpdateCompanyState, formData: FormData): Promise<UpdateCompanyState> {
  const parsed = UpdateCompanySchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name') || undefined,
    industry: formData.get('industry') ?? '',
    size: formData.get('size') ?? '',
    primaryUrl: formData.get('primaryUrl') ?? '',
    linkedinExplicit: formData.get('linkedinExplicit') ?? '',
    description: formData.get('description') ?? '',
    internalNotes: formData.get('internalNotes') ?? '',
    nextAction: formData.get('nextAction') ?? '',
    estimatedValue: formData.get('estimatedValue') ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  try {
    // Resolve URL primária: classifica em website OU linkedinUrl.
    const classified = classifyUrl(parsed.data.primaryUrl);
    // Se user também forneceu linkedinExplicit, sobrescreve (intenção explícita ganha).
    let linkedinUrl = classified.linkedinUrl ?? null;
    let website = classified.website ?? null;
    if (parsed.data.linkedinExplicit && parsed.data.linkedinExplicit.length > 0) {
      const overrideClassified = classifyUrl(parsed.data.linkedinExplicit);
      linkedinUrl = overrideClassified.linkedinUrl ?? overrideClassified.website ?? linkedinUrl;
    }

    // estimatedValue: string vazia → null, senão parse decimal
    let estimatedValueParsed: string | null = null;
    if (parsed.data.estimatedValue && parsed.data.estimatedValue.length > 0) {
      const num = Number(parsed.data.estimatedValue.replace(/\./g, '').replace(',', '.'));
      if (!Number.isNaN(num) && num >= 0) {
        estimatedValueParsed = num.toFixed(2);
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.industry !== undefined) updates.industry = parsed.data.industry || null;
    if (parsed.data.size !== undefined) updates.size = parsed.data.size || null;
    if (website !== null) updates.website = website;
    else if (parsed.data.primaryUrl === '' && parsed.data.linkedinExplicit === '') {
      // Limpar quando os dois forem explicitamente vazios
      updates.website = null;
      updates.linkedinUrl = null;
    }
    if (linkedinUrl !== null) updates.linkedinUrl = linkedinUrl;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description || null;
    if (parsed.data.internalNotes !== undefined) updates.internalNotes = parsed.data.internalNotes || null;
    if (parsed.data.nextAction !== undefined) updates.nextAction = parsed.data.nextAction || null;
    updates.estimatedValue = estimatedValueParsed;

    await db.update(companies).set(updates).where(eq(companies.id, parsed.data.id));

    revalidatePath(`/internal/crm/companies/${parsed.data.id}`);
    revalidatePath('/internal/crm/empresas');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[updateCompany] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  Criar Empresa manual                                                       */
/* -------------------------------------------------------------------------- */

const CreateCompanySchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  industry: z.string().trim().max(120).optional(),
  size: z.string().trim().max(60).optional(),
  website: z.string().trim().url('Website inválido').optional().or(z.literal('')),
  linkedinUrl: z.string().trim().url('LinkedIn inválido').optional().or(z.literal('')),
});

export async function createCompanyManual(_prev: unknown, formData: FormData): Promise<ActionResult & { companyId?: string }> {
  const parsed = CreateCompanySchema.safeParse({
    name: formData.get('name'),
    industry: formData.get('industry') || undefined,
    size: formData.get('size') || undefined,
    website: formData.get('website') || undefined,
    linkedinUrl: formData.get('linkedinUrl') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const { upsertCompany } = await import('@/lib/crm');
    const c = await upsertCompany({
      name: parsed.data.name,
      industry: parsed.data.industry,
      size: parsed.data.size,
      website: parsed.data.website || undefined,
      linkedinUrl: parsed.data.linkedinUrl || undefined,
    });
    if (!c.ok) return { ok: false, error: c.error };

    revalidatePath('/internal/crm/empresas');
    return { ok: true, companyId: c.data.id };
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

    // people.internal_notes removida na Task 1 do CRM source-of-truth.
    // Notas livres viram activity 'interaction_manual' (timeline). Merge não
    // precisa concatenar nada — as activities das outras pessoas já são
    // movidas pra keep via UPDATE em activities/meetings abaixo.

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
