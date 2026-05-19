/**
 * Next.js middleware — só copia pathname pra header `x-pathname`.
 *
 * Por quê: root layout (Server Component) precisa saber em qual page está
 * pra condicionalmente NÃO renderizar scripts de analytics em /internal/*.
 * Sem o middleware, `headers()` da next/headers não tem essa info.
 *
 * Custom header viaja com a request original — read-only pra páginas via
 * `headers().get('x-pathname')`. Edge runtime, ~zero overhead.
 *
 * Não bloqueia, não redireciona, não muda response. Apenas anota o pathname.
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Roda em TUDO menos assets estáticos pra evitar overhead em /_next/*.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/|api/).*)',
  ],
};
