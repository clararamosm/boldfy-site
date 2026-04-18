/**
 * Endpoint de debug pro ActiveCampaign.
 *
 * GET /api/debug/ac?secret=<DEBUG_SECRET>
 *
 * Retorna JSON com:
 * - se env vars estão setadas
 * - resposta da API do AC no endpoint /api/3/users/me (ping)
 * - erro exato se der falha
 *
 * Protegido por query param ?secret= (usa env DEBUG_SECRET)
 * — não exponha sem isso, o endpoint revela parte das env vars.
 *
 * Remover depois que o fluxo estiver confirmado funcionando.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || '';
  const expected = process.env.DEBUG_SECRET || '';

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL || '';
  const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY || '';

  // Mascara pro JSON response
  const maskedKey = AC_API_KEY
    ? `${AC_API_KEY.slice(0, 6)}...${AC_API_KEY.slice(-4)} (${AC_API_KEY.length} chars)`
    : '(vazio)';

  const checks: Record<string, unknown> = {
    env: {
      ACTIVECAMPAIGN_API_URL: AC_API_URL || '(vazio)',
      ACTIVECAMPAIGN_API_KEY: maskedKey,
      url_length: AC_API_URL.length,
      url_ends_with_slash: AC_API_URL.endsWith('/'),
      url_has_api_path: AC_API_URL.includes('/api/'),
    },
  };

  if (!AC_API_URL || !AC_API_KEY) {
    return NextResponse.json({
      ok: false,
      stage: 'env',
      error: 'ACTIVECAMPAIGN_API_URL ou ACTIVECAMPAIGN_API_KEY vazias',
      checks,
    });
  }

  // Ping — testa conexão + auth chamando /api/3/users/me
  const base = AC_API_URL.replace(/\/+$/, ''); // remove trailing slash
  const pingUrl = `${base}/api/3/users/me`;

  try {
    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Api-Token': AC_API_KEY,
        Accept: 'application/json',
      },
      // AC pode ser lento
      signal: AbortSignal.timeout(10000),
    });

    const bodyText = await res.text();
    let parsedBody: unknown = null;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      parsedBody = bodyText.slice(0, 500);
    }

    return NextResponse.json({
      ok: res.ok,
      stage: 'ping',
      request: {
        url: pingUrl,
        method: 'GET',
      },
      response: {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        body: parsedBody,
      },
      checks,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      stage: 'ping',
      error: err instanceof Error ? err.message : String(err),
      request: {
        url: pingUrl,
        method: 'GET',
      },
      checks,
    });
  }
}
