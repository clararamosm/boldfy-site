/**
 * Server actions do UTM Generator.
 *
 *   createUtmLink     — valida + salva no DB (idempotente por fullUrl exato).
 *                       Se shorten=true no FormData, encurta via KV no mesmo go.
 *   shortenUtmLink    — gera shortlink pra um utm_link existente (caso o user
 *                       não tenha pedido na criação e mudou de ideia depois).
 *   deleteUtmLink     — remove por id.
 *   clearAllUtmLinks  — zera tudo (com confirmação no client).
 */

'use server';

import { db, utmLinks } from '@/db';
import { buildUtmUrl, slug } from '@/lib/utm';
import { kv } from '@vercel/kv';
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
  | { ok: true; id: string; fullUrl: string; shortCode: string | null }
  | { ok: false; error: string }
  | null;

/* -------------------------------------------------------------------------- */
/*  Shortlink helper (KV)                                                      */
/* -------------------------------------------------------------------------- */
// Mesmo alfabeto da /api/shorten (sem 0/O/o/1/I/l)
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function genCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

async function createShortlink(longUrl: string): Promise<string | null> {
  // Retry em caso de colisão
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = genCode();
    const exists = await kv.get(`link:${candidate}`);
    if (!exists) {
      await kv.set(`link:${candidate}`, longUrl);
      await kv.set(`meta:${candidate}`, { createdAt: Date.now(), originalUrl: longUrl });
      return candidate;
    }
  }
  console.error('[createShortlink] falha ao gerar code único após 5 tentativas');
  return null;
}

/* -------------------------------------------------------------------------- */
/*  createUtmLink                                                              */
/* -------------------------------------------------------------------------- */

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
  const wantShorten = formData.get('shorten') === 'on';

  try {
    const fullUrl = buildUtmUrl({
      baseUrl: parsed.data.baseUrl,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      utmContent: parsed.data.utmContent || undefined,
      utmTerm: parsed.data.utmTerm || undefined,
    });

    // Idempotência: se já existe link com fullUrl exato, retorna o existente.
    // Se user marcou shorten e o existente não tem shortCode, adiciona um agora.
    const [existing] = await db
      .select({ id: utmLinks.id, shortCode: utmLinks.shortCode })
      .from(utmLinks)
      .where(eq(utmLinks.fullUrl, fullUrl))
      .limit(1);
    if (existing) {
      let shortCode = existing.shortCode;
      if (wantShorten && !shortCode) {
        shortCode = await createShortlink(fullUrl);
        if (shortCode) await db.update(utmLinks).set({ shortCode }).where(eq(utmLinks.id, existing.id));
      }
      revalidateAllUtmPaths();
      return { ok: true, id: existing.id, fullUrl, shortCode };
    }

    const shortCode = wantShorten ? await createShortlink(fullUrl) : null;

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
        shortCode,
      })
      .returning({ id: utmLinks.id });

    revalidateAllUtmPaths();
    return { ok: true, id: created.id, fullUrl, shortCode };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[createUtmLink] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  shortenUtmLink — gera short pra um link já criado                          */
/* -------------------------------------------------------------------------- */

export async function shortenUtmLink(id: string): Promise<{ ok: boolean; shortCode?: string; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  try {
    const [row] = await db.select({ fullUrl: utmLinks.fullUrl, shortCode: utmLinks.shortCode }).from(utmLinks).where(eq(utmLinks.id, id)).limit(1);
    if (!row) return { ok: false, error: 'Link não encontrado' };
    if (row.shortCode) return { ok: true, shortCode: row.shortCode }; // já tinha

    const shortCode = await createShortlink(row.fullUrl);
    if (!shortCode) return { ok: false, error: 'Falha ao gerar shortcode' };

    await db.update(utmLinks).set({ shortCode }).where(eq(utmLinks.id, id));
    revalidateAllUtmPaths();
    return { ok: true, shortCode };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Deleta as 4 chaves do KV associadas a um shortCode. Fire-and-forget:
 * se uma chave não existir (raro), kv.del retorna 0 sem erro. Promise.all
 * roda em paralelo. Se TODAS falharem, loga mas não bloqueia o delete do DB.
 */
async function deleteShortlinkFromKv(shortCode: string): Promise<void> {
  try {
    await Promise.all([
      kv.del(`link:${shortCode}`),
      kv.del(`meta:${shortCode}`),
      kv.del(`link-clicks:${shortCode}`),
      kv.del(`link-last:${shortCode}`),
    ]);
  } catch (err) {
    console.warn(`[deleteShortlinkFromKv] falha ao limpar KV pra ${shortCode}:`, err);
  }
}

/**
 * Revalida TODOS os paths que mostram dados de UTM/shortlinks. Sem isso,
 * /internal/dashboard/campanhas e os drill-downs ficam com cache até o
 * usuário forçar refresh.
 */
function revalidateAllUtmPaths(): void {
  revalidatePath('/internal/utm');
  // 'layout' inclui as sub-rotas [slug] dinâmicas — sem isso, o drill-down
  // de cada campanha não invalida.
  revalidatePath('/internal/dashboard/campanhas', 'layout');
}

export async function deleteUtmLink(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  try {
    // 1. Lê shortCode ANTES de deletar (precisa pra limpar KV)
    const [row] = await db
      .select({ shortCode: utmLinks.shortCode })
      .from(utmLinks)
      .where(eq(utmLinks.id, id))
      .limit(1);

    // 2. Deleta do Postgres
    await db.delete(utmLinks).where(eq(utmLinks.id, id));

    // 3. Limpa KV se tinha shortlink (link:, meta:, link-clicks:, link-last:)
    if (row?.shortCode) {
      await deleteShortlinkFromKv(row.shortCode);
    }

    // 4. Revalida TODOS os paths que mostram esse link
    revalidateAllUtmPaths();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function clearAllUtmLinks(): Promise<{ ok: boolean; deleted: number }> {
  try {
    // 1. Lê TODOS os shortCodes antes (pra cascatear no KV)
    const allWithShort = await db
      .select({ shortCode: utmLinks.shortCode })
      .from(utmLinks);

    // 2. Deleta tudo do Postgres
    const result = await db.delete(utmLinks).returning({ id: utmLinks.id });

    // 3. Limpa KV em paralelo pra cada shortCode existente
    await Promise.all(
      allWithShort
        .filter((r): r is { shortCode: string } => r.shortCode !== null)
        .map((r) => deleteShortlinkFromKv(r.shortCode)),
    );

    // 4. Revalida
    revalidateAllUtmPaths();
    return { ok: true, deleted: result.length };
  } catch (err) {
    console.error('[clearAllUtmLinks] failed:', err);
    return { ok: false, deleted: 0 };
  }
}
