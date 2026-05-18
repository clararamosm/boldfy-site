/**
 * CRUD de artigos Mídia & PR (tabela pr_articles).
 *
 * - createPrArticle / updatePrArticle / deletePrArticle
 * - Validação via Zod (URL articleUrl opcional, datas válidas, etc)
 * - revalidatePath em /internal/dashboard/campanhas após cada mutação
 */

'use server';

import { db, prArticles } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ArticleInputSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(500),
  publishedAt: z.string().trim().min(1, 'Data obrigatória'), // YYYY-MM-DD
  articleUrl: z.string().trim().url('URL inválida').max(2000).optional().or(z.literal('')),
  outlet: z.string().trim().max(200).optional().or(z.literal('')),
  utmCampaign: z.string().trim().max(200).optional().or(z.literal('')),
  shortlinkCode: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type ArticleInput = z.input<typeof ArticleInputSchema>;
export type ArticleResult = { ok: true; id: string } | { ok: false; error: string };

export async function createPrArticle(input: ArticleInput): Promise<ArticleResult> {
  const parsed = ArticleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  try {
    const [created] = await db
      .insert(prArticles)
      .values({
        title: parsed.data.title,
        publishedAt: new Date(`${parsed.data.publishedAt}T12:00:00`),
        articleUrl: parsed.data.articleUrl || null,
        outlet: parsed.data.outlet || null,
        utmCampaign: parsed.data.utmCampaign || null,
        shortlinkCode: parsed.data.shortlinkCode || null,
        notes: parsed.data.notes || null,
      })
      .returning({ id: prArticles.id });
    revalidatePath('/internal/dashboard/campanhas');
    return { ok: true, id: created.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updatePrArticle(id: string, input: ArticleInput): Promise<ArticleResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const parsed = ArticleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  try {
    await db
      .update(prArticles)
      .set({
        title: parsed.data.title,
        publishedAt: new Date(`${parsed.data.publishedAt}T12:00:00`),
        articleUrl: parsed.data.articleUrl || null,
        outlet: parsed.data.outlet || null,
        utmCampaign: parsed.data.utmCampaign || null,
        shortlinkCode: parsed.data.shortlinkCode || null,
        notes: parsed.data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(prArticles.id, id));
    revalidatePath('/internal/dashboard/campanhas');
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deletePrArticle(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  try {
    await db.delete(prArticles).where(eq(prArticles.id, id));
    revalidatePath('/internal/dashboard/campanhas');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
