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

/* -------------------------------------------------------------------------- */
/*  Import do gerador legado (cowork-artifacts/utm-generator-boldfy.html)     */
/* -------------------------------------------------------------------------- */

/**
 * Importa links do localStorage do gerador HTML legado.
 *
 * Formato esperado (chave 'boldfy_utm_history' no localStorage):
 *   [
 *     {
 *       ts: 1234567890,          // timestamp ms (createdAt)
 *       url: "https://...",      // fullUrl gerado
 *       data: {
 *         baseUrl: "https://...",
 *         utm_source: "linkedin",
 *         utm_medium: "organic",
 *         utm_campaign: "lead-magnet-1",
 *         utm_content?: "...",
 *         utm_term?: "..."
 *       },
 *       shortUrl?: "https://boldfy.com.br/l/abc"
 *     },
 *     ...
 *   ]
 *
 * Idempotente: skip entries cujo fullUrl já existe no DB. Preserva ts
 * original como createdAt (não usa NOW). Skipa entries inválidas em
 * silêncio (loga, mas não bloqueia o resto).
 */

type LegacyEntry = {
  ts?: number;
  url?: string;
  shortUrl?: string;
  data?: {
    baseUrl?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
};

export type ImportResult =
  | { ok: true; imported: number; skipped: number; invalid: number; total: number }
  | { ok: false; error: string };

export async function importUtmLinksFromJson(jsonString: string): Promise<ImportResult> {
  if (!jsonString || jsonString.trim().length === 0) {
    return { ok: false, error: 'JSON vazio' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: 'JSON inválido. Cola exatamente o valor do localStorage (começa com [ ).' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Esperado array de entradas. Cola o valor da chave boldfy_utm_history.' };
  }

  const entries = parsed as LegacyEntry[];
  let imported = 0;
  let skipped = 0;
  let invalid = 0;

  // Pega fullUrls já existentes pra dedup (1 query só)
  const existingRows = await db.select({ fullUrl: utmLinks.fullUrl }).from(utmLinks);
  const existingUrls = new Set(existingRows.map((r) => r.fullUrl));

  for (const entry of entries) {
    try {
      const d = entry.data ?? {};
      if (!d.baseUrl || !d.utm_source || !d.utm_medium || !d.utm_campaign) {
        invalid++;
        continue;
      }
      // Reconstrói fullUrl (pode ser que entry.url tenha diferenças de
      // encoding entre o gerador antigo e o nosso)
      const fullUrl = buildUtmUrl({
        baseUrl: d.baseUrl,
        utmSource: d.utm_source,
        utmMedium: d.utm_medium,
        utmCampaign: d.utm_campaign,
        utmContent: d.utm_content,
        utmTerm: d.utm_term,
      });
      if (existingUrls.has(fullUrl)) {
        skipped++;
        continue;
      }
      const createdAt = entry.ts && typeof entry.ts === 'number' ? new Date(entry.ts) : new Date();
      // shortCode do legado vem como URL completa "https://boldfy.com.br/l/abc"
      // Extrai só o código (parte depois de /l/) pra ficar consistente com o
      // schema (shortCode = "abc")
      let shortCode: string | null = null;
      if (entry.shortUrl) {
        const m = entry.shortUrl.match(/\/l\/([\w-]+)/);
        if (m) shortCode = m[1];
      }

      await db.insert(utmLinks).values({
        baseUrl: d.baseUrl,
        utmSource: slug(d.utm_source),
        utmMedium: slug(d.utm_medium),
        utmCampaign: slug(d.utm_campaign),
        utmContent: d.utm_content ? slug(d.utm_content) : null,
        utmTerm: d.utm_term ? slug(d.utm_term) : null,
        fullUrl,
        shortCode,
        createdAt,
      });
      existingUrls.add(fullUrl);
      imported++;
    } catch (err) {
      console.error('[importUtmLinksFromJson] entry failed:', err);
      invalid++;
    }
  }

  revalidatePath('/internal/dashboard/utm');
  return { ok: true, imported, skipped, invalid, total: entries.length };
}
