/**
 * Proxy (ex-middleware no Next.js 16) — protege rotas internas.
 *
 * IMPORTANTE: Next 16 renomeou middleware → proxy. Arquivo é src/proxy.ts (não
 * middleware.ts). Ver node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 *
 * Comportamento:
 *   - Verifica cookie de sessão em qualquer rota dentro de /internal
 *   - Se ausente/inválido, redireciona pra /internal/login (preservando ?next=URL)
 *   - Exceções: /internal/login e /internal/logout não exigem auth
 *
 * NOTA: o cookie é HMAC-signed (não JWT). Verificação aqui é stateless e rápida,
 * sem chamar DB ou external service. Ver lib/auth.ts.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'boldfy_internal_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SESSION_VERSION = 1;

// Verificação inline (não importa de lib/auth.ts pra evitar import de next/headers
// que não funciona no proxy runtime)
function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('hex');
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (typeof payload.iat !== 'number') return false;
    if (payload.ver !== SESSION_VERSION) return false;
    const ageMs = Date.now() - payload.iat;
    if (ageMs > COOKIE_MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Rotas internas exceto login/logout exigem auth
  if (pathname.startsWith('/internal') && !pathname.startsWith('/internal/login') && !pathname.startsWith('/internal/logout')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!verifyToken(token)) {
      const loginUrl = new URL('/internal/login', request.url);
      // Preserva URL pra redirect pós-login
      if (pathname !== '/internal') {
        loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Propaga pathname pra Server Components via header de REQUEST (não response).
  // Pattern oficial: forward headers via NextResponse.next({ request: { headers } }).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/internal/:path*'],
};
