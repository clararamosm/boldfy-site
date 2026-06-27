/**
 * Utility de rate limit por chave (IP, user-agent hash, etc), usando Vercel KV.
 *
 * Introduzido com o form do Playbook TLG (mai/2026, spec §11.4). Padrão
 * reusável pra outros forms — chamar `checkRateLimit(key, max, windowSec)`
 * antes de qualquer operação cara, descartar submit silenciosamente se
 * limite estourar.
 *
 * Comportamento gracioso quando KV falha:
 *   Se Vercel KV não respondeu (timeout, instabilidade), retorna `{ ok: true,
 *   remaining: -1 }` pra não bloquear leads legítimos. Falha de KV é logada
 *   no console pra alerta.
 *
 * Por que IP-based:
 *   Forms públicos não têm user autenticado. Browser fingerprint via JS é
 *   contornável trivialmente. IP é a primeira barreira — bots básicos caem
 *   nela. Honeypot complementa cobrindo bots com IPs rotativos.
 *
 * Quando NÃO basta:
 *   Spam coordenado de IPs residenciais (botnets, proxies) passa. Se
 *   telemetria mostrar > 5% de leads suspeitos (taxa de bounce alta no AC
 *   + emails malformados + dados nonsense), promover pra Cloudflare
 *   Turnstile em PR isolado (spec §11.4).
 */

import { kv } from '@vercel/kv';

export type RateLimitResult = {
  /** True se a operação pode prosseguir (limite não estourado, ou KV falhou). */
  ok: boolean;
  /** Submits restantes na janela. -1 se KV indisponível (modo gracioso). */
  remaining: number;
};

/**
 * Incrementa o contador de uma chave e checa contra o limite.
 *
 * @param key - Chave única (ex: `playbook:1.2.3.4`). Use prefixo por feature
 *              pra não colidir entre forms diferentes.
 * @param max - Número máximo de operações permitidas na janela.
 * @param windowSec - Janela de tempo em segundos. TTL é setado no primeiro
 *                    incremento — janela rolling NÃO sliding, simples.
 *
 * @example
 *   const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
 *   const limit = await checkRateLimit(`playbook:${ip}`, 3, 3600);
 *   if (!limit.ok) return { success: false, error: 'Muitas tentativas. Tente em alguns minutos.' };
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  try {
    const count = await kv.incr(fullKey);
    // Primeira chamada → seta TTL. Subsequentes mantêm o TTL existente
    // (não reseta — janela é fixa a partir do 1º hit, não rolling).
    if (count === 1) {
      await kv.expire(fullKey, windowSec);
    }
    return {
      ok: count <= max,
      remaining: Math.max(0, max - count),
    };
  } catch (err) {
    console.error(`[rate-limit] KV failure for key=${key} — allowing through:`, err);
    // Modo gracioso: KV down não pode bloquear leads legítimos. Bot
    // protection vira responsabilidade do honeypot + Zod validação.
    return { ok: true, remaining: -1 };
  }
}
