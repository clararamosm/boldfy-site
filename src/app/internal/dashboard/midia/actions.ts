/**
 * Server actions de Mídia & PR.
 *
 * createArticle(formData): cadastra novo artigo publicado
 * deleteArticle(id): remove
 */

'use server';

import { db, prArticles } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(300),
  publishedAt: z.string().min(1, 'Data obrigatória'),
  shortlinkCode: z.string().trim().max(60).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type Result = { ok: true } | { ok: false; error: string };

export async function createArticle(formData: FormData): Promise<Result> {
  const parsed = CreateSchema.safeParse({
    title: formData.get('title'),
    publishedAt: formData.get('publishedAt'),
    shortlinkCode: formData.get('shortlinkCode') || undefined,
    utmCampaign: formData.get('utmCampaign') || undefined,
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await db.insert(prArticles).values({
      title: parsed.data.title,
      publishedAt: new Date(parsed.data.publishedAt),
      shortlinkCode: parsed.data.shortlinkCode,
      utmCampaign: parsed.data.utmCampaign,
      notes: parsed.data.notes,
    });
    revalidatePath('/internal/dashboard/midia');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteArticle(id: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  try {
    await db.delete(prArticles).where(eq(prArticles.id, id));
    revalidatePath('/internal/dashboard/midia');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
