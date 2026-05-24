'use server';

/**
 * Tracking de views da página /playbook/[slug] (spec §11.3).
 *
 * Cada visualização incrementa `view_count`, atualiza `last_viewed_at` e
 * grava `last_viewed_ip` HASHED (sha256 com salt do COOKIE_SECRET) — pra
 * LGPD não armazenar IP cru.
 *
 * Sinal comercial: equipe da Boldfy vê no CRM quem voltou a abrir o playbook
 * (atividade contínua = lead ainda quente), gatilho pra prospecção 1:1.
 *
 * Best-effort: erros não bloqueiam o render da página.
 */

import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db, playbookOutputs } from '@/db';

export async function incrementPlaybookView(slug: string): Promise<void> {
  try {
    const hdrs = await headers();
    const forwardedFor = hdrs.get('x-forwarded-for') ?? '';
    const ipRaw = forwardedFor.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown';

    // Hash do IP com salt do COOKIE_SECRET — sha256 truncado pra 16 chars.
    // Suficiente pra detectar revisitas sem armazenar identidade.
    const salt = process.env.COOKIE_SECRET ?? 'fallback-salt-dev';
    const ipHashed = createHash('sha256').update(`${salt}:${ipRaw}`).digest('hex').slice(0, 16);

    await db
      .update(playbookOutputs)
      .set({
        viewCount: sql`${playbookOutputs.viewCount} + 1`,
        lastViewedAt: new Date(),
        lastViewedIp: ipHashed,
        updatedAt: new Date(),
      })
      .where(eq(playbookOutputs.slug, slug));
  } catch (err) {
    // Tracking falhou — render continua. Logar pra alerta sem impactar UX.
    console.error(`[playbook-view] tracking failed for slug=${slug}:`, err);
  }
}
