/**
 * Server actions do UTM Generator.
 *
 * createUtmLink: valida + salva no DB. Idempotência por fullUrl exato
 * (mesmo link gerado 2x retorna o existente em vez de duplicar).
 * deleteUtmLink: remove por id.
 * clearAllUtmLinks: zera tudo (com confirmação no client).
 */

'use server';

import { db, utmLinks } from '@/db';
import { buildUtmUrl, slug } from '@/lib/utm';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UtmInputSchema = z.object({
  label: z.string().trim().max(120).optional().or(z.literal('')),
  baseUrl: z.string().trim().url('URL inválida').max(1000),
  utmSource: z.string().trim().min(1, 'Source obrigatório').max(120),
  utmMedium: z.string().trim().min(1, 'Medium obrigatório').max(120),
  utmCampaign: z.string().trim().min(1, 'Campaign obrigatório').max(200),
  utmContent: z.string().trim().max(200).optional().or(z.literal('')),
  utmTerm: z.string().trim().max(200).optional().or(z.literal('')),
});

export type CreateUtmLinkState =
  | { ok: true; id: string; fullUrl: string }
  | { ok: false; error: string }
  | null;

export async function createUtmLink(_prev: CreateUtmLinkState, formData: FormData): Promise<CreateUtmLinkState> {
  const parsed = UtmInputSchema.safeParse({
    label: formData.get('label') ?? '',
    baseUrl: formData.get('baseUrl'),
    utmSource: formData.get('utmSource'),
    utmMedium: formData.get('utmMedium'),
    utmCampaign: formData.get('utmCampaign'),
    utmContent: formData.get('utmContent') ?? '',
    utmTerm: formData.get('utmTerm') ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  try {
    const fullUrl = buildUtmUrl({
      baseUrl: parsed.data.baseUrl,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      utmContent: parsed.data.utmContent || undefined,
      utmTerm: parsed.data.utmTerm || undefined,
    });

    // Idempotência: se já existe link com fullUrl exato, retorna o existente
    const [existing] = await db
      .select({ id: utmLinks.id })
      .from(utmLinks)
      .where(eq(utmLinks.fullUrl, fullUrl))
      .limit(1);
    if (existing) {
      revalidatePath('/internal/dashboard/utm');
      return { ok: true, id: existing.id, fullUrl };
    }

    const [created] = await db
      .insert(utmLinks)
      .values({
        label: parsed.data.label || null,
        baseUrl: parsed.data.baseUrl,
        utmSource: slug(parsed.data.utmSource),
        utmMedium: slug(parsed.data.utmMedium),
        utmCampaign: slug(parsed.data.utmCampaign),
        utmContent: parsed.data.utmContent ? slug(parsed.data.utmContent) : null,
        utmTerm: parsed.data.utmTerm ? slug(parsed.data.utmTerm) : null,
        fullUrl,
      })
      .returning({ id: utmLinks.id });

    revalidatePath('/internal/dashboard/utm');
    return { ok: true, id: created.id, fullUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[createUtmLink] failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function deleteUtmLink(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  try {
    await db.delete(utmLinks).where(eq(utmLinks.id, id));
    revalidatePath('/internal/dashboard/utm');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function clearAllUtmLinks(): Promise<{ ok: boolean; deleted: number }> {
  try {
    const result = await db.delete(utmLinks).returning({ id: utmLinks.id });
    revalidatePath('/internal/dashboard/utm');
    return { ok: true, deleted: result.length };
  } catch (err) {
    console.error('[clearAllUtmLinks] failed:', err);
    return { ok: false, deleted: 0 };
  }
}
