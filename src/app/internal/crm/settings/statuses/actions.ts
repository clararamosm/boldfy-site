/**
 * Server actions de CRUD de Statuses.
 *
 * createStatus(kind, label, color, scoreThresholdMin?, isTerminal?) — adiciona
 * renameStatus(id, label) — renomeia
 * setStatusColor(id, color) — muda cor
 * setStatusThreshold(id, min) — muda score threshold (só pra person)
 * setStatusTerminal(id, terminal) — marca/desmarca terminal
 * setStatusDefault(id) — marca como default (desmarca outros do mesmo kind)
 * reorderStatuses(kind, ids[]) — atualiza sort_order em batch
 * deleteStatus(id) — só permite se não tiver leads ativos
 */

'use server';

import { db, statuses, people, companies } from '@/db';
import { invalidateStatusCache } from '@/lib/statuses';
import { eq, and, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const KindSchema = z.enum(['person', 'company']);
const ColorSchema = z.enum(['neutral', 'gray', 'blue', 'purple', 'amber', 'orange', 'green', 'pink']);
const LabelSchema = z.string().trim().min(1, 'Label obrigatória').max(60);

export async function createStatus(formData: FormData): Promise<ActionResult> {
  const kindRaw = formData.get('kind');
  const labelRaw = formData.get('label');
  const colorRaw = formData.get('color') || 'neutral';
  const thresholdRaw = formData.get('scoreThresholdMin');
  const terminalRaw = formData.get('isTerminal') === 'on';

  const kind = KindSchema.safeParse(kindRaw);
  const label = LabelSchema.safeParse(labelRaw);
  const color = ColorSchema.safeParse(colorRaw);

  if (!kind.success) return { ok: false, error: 'Tipo inválido' };
  if (!label.success) return { ok: false, error: label.error.issues[0].message };
  if (!color.success) return { ok: false, error: 'Cor inválida' };

  try {
    // Pega o próximo sort_order
    const [maxRow] = await db
      .select({ max: sql<number>`COALESCE(MAX(${statuses.sortOrder}), -1)::int` })
      .from(statuses)
      .where(eq(statuses.kind, kind.data));

    const nextOrder = (maxRow?.max ?? -1) + 1;

    const threshold = thresholdRaw && typeof thresholdRaw === 'string' && thresholdRaw.length > 0
      ? parseInt(thresholdRaw, 10)
      : null;

    await db.insert(statuses).values({
      kind: kind.data,
      label: label.data,
      color: color.data,
      sortOrder: nextOrder,
      scoreThresholdMin: kind.data === 'person' && threshold !== null && !Number.isNaN(threshold) ? threshold : null,
      isTerminal: terminalRaw,
      isDefault: false,
    });

    invalidateStatusCache();
    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    revalidatePath('/internal/crm/settings/statuses');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('idx_statuses_kind_label')) {
      return { ok: false, error: 'Já existe um status com essa label.' };
    }
    return { ok: false, error: msg };
  }
}

export async function updateStatus(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id');
  if (typeof id !== 'string' || !z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'ID inválido' };
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  const label = formData.get('label');
  if (typeof label === 'string') {
    const parsed = LabelSchema.safeParse(label);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    updates.label = parsed.data;
  }

  const color = formData.get('color');
  if (typeof color === 'string') {
    const parsed = ColorSchema.safeParse(color);
    if (!parsed.success) return { ok: false, error: 'Cor inválida' };
    updates.color = parsed.data;
  }

  const threshold = formData.get('scoreThresholdMin');
  if (threshold !== null) {
    if (threshold === '') {
      updates.scoreThresholdMin = null;
    } else if (typeof threshold === 'string') {
      const n = parseInt(threshold, 10);
      if (Number.isNaN(n)) return { ok: false, error: 'Threshold inválido' };
      updates.scoreThresholdMin = n;
    }
  }

  const isTerminal = formData.get('isTerminal');
  if (isTerminal !== null) {
    updates.isTerminal = isTerminal === 'on' || isTerminal === 'true';
  }

  try {
    await db.update(statuses).set(updates).where(eq(statuses.id, id));
    invalidateStatusCache();
    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    revalidatePath('/internal/crm/settings/statuses');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('idx_statuses_kind_label')) {
      return { ok: false, error: 'Já existe um status com essa label.' };
    }
    return { ok: false, error: msg };
  }
}

export async function setStatusAsDefault(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };

  try {
    const [s] = await db.select({ kind: statuses.kind }).from(statuses).where(eq(statuses.id, id)).limit(1);
    if (!s) return { ok: false, error: 'Status não encontrado' };

    // Desmarca todos os outros do mesmo kind
    await db.update(statuses).set({ isDefault: false, updatedAt: new Date() }).where(eq(statuses.kind, s.kind));
    // Marca esse
    await db.update(statuses).set({ isDefault: true, updatedAt: new Date() }).where(eq(statuses.id, id));

    invalidateStatusCache();
    revalidatePath('/internal/crm/settings/statuses');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteStatus(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };

  try {
    const [s] = await db.select().from(statuses).where(eq(statuses.id, id)).limit(1);
    if (!s) return { ok: false, error: 'Status não encontrado' };

    // Bloqueia delete se tiver leads ativos referenciando
    const table = s.kind === 'person' ? people : companies;
    const [refRow] = await db.select({ n: count() }).from(table).where(eq(table.statusId, id));
    if ((refRow?.n ?? 0) > 0) {
      return { ok: false, error: `Não dá pra apagar: ${refRow.n} ${s.kind === 'person' ? 'pessoas' : 'empresas'} estão nesse status. Move pra outro primeiro.` };
    }
    if (s.isDefault) {
      return { ok: false, error: 'Não dá pra apagar o status default. Define outro como default antes.' };
    }

    await db.delete(statuses).where(eq(statuses.id, id));

    invalidateStatusCache();
    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    revalidatePath('/internal/crm/settings/statuses');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function reorderStatuses(kind: 'person' | 'company', orderedIds: string[]): Promise<ActionResult> {
  const k = KindSchema.safeParse(kind);
  if (!k.success) return { ok: false, error: 'Tipo inválido' };
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => z.string().uuid().safeParse(id).success)) {
    return { ok: false, error: 'Ordem inválida' };
  }

  try {
    // Update em batch
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(statuses)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(statuses.id, orderedIds[i]), eq(statuses.kind, k.data)));
    }
    invalidateStatusCache();
    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/empresas');
    revalidatePath('/internal/crm/settings/statuses');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
