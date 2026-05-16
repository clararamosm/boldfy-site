/**
 * Auth helpers pro dashboard + CRM internos.
 *
 * Modelo (v1, single-user):
 *   - DASHBOARD_PASSWORD em env var (Clara define no Vercel)
 *   - Login dispara server action → bcrypt compare → set cookie httpOnly
 *   - Cookie persiste por 30 dias, signed com DASHBOARD_SESSION_SECRET (HMAC)
 *
 * Cookie payload (signed): { iat: timestamp, ver: 1 }
 *   - iat valida idade (rejeita > 30 dias)
 *   - ver permite invalidar todas as sessões mudando o número (logout global)
 *
 * Pra v2: substituir por magic link via Resend ou OAuth com Google.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'boldfy_internal_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SESSION_VERSION = 1;

function getSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'DASHBOARD_SESSION_SECRET ausente ou curto demais (min 32 chars). Adicione no Vercel.',
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function makeToken(): string {
  const payload = JSON.stringify({ iat: Date.now(), ver: SESSION_VERSION });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  // Verify HMAC signature in constant time (anti-timing-attack)
  const expectedSig = sign(payloadB64);
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  // Verify payload structure + age + version
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (typeof payload.iat !== 'number') return false;
    if (payload.ver !== SESSION_VERSION) return false; // global invalidation
    const ageMs = Date.now() - payload.iat;
    if (ageMs > COOKIE_MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Compara senha submetida com DASHBOARD_PASSWORD em constant time.
 * (Sem bcrypt porque é só 1 senha estática — overkill. HMAC compare basta.)
 */
export function checkPassword(submitted: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    console.error('[auth] DASHBOARD_PASSWORD não configurado');
    return false;
  }
  if (submitted.length === 0) return false;

  // Usa HMAC pra normalizar tamanho e comparar safe
  const submittedHash = sign(submitted);
  const expectedHash = sign(expected);
  const a = Buffer.from(submittedHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const token = makeToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/internal',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
