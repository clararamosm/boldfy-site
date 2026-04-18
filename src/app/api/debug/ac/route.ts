/**
 * Endpoint de debug pro ActiveCampaign.
 *
 * GET /api/debug/ac?secret=<DEBUG_SECRET>
 *   → ping em /api/3/users/me (auth + URL ok?)
 *
 * GET /api/debug/ac?secret=<DEBUG_SECRET>&action=sync&email=test@x.com
 *   → testa POST /api/3/contact/sync com email informado
 *   → é o MESMO endpoint usado pelo syncContact do fluxo de proposta
 *
 * Protegido por query param ?secret= (env DEBUG_SECRET).
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

  const base = AC_API_URL.replace(/\/+$/, '');
  const action = url.searchParams.get('action') || 'ping';

  // ==============================
  // Action: sync (POST /api/3/contact/sync)
  // ==============================
  if (action === 'sync') {
    const testEmail =
      url.searchParams.get('email') || `debug-${Date.now()}@boldfy.test`;
    const syncUrl = `${base}/api/3/contact/sync`;

    try {
      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Api-Token': AC_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          contact: {
            email: testEmail,
            firstName: 'Debug',
            lastName: 'Test',
            phone: '',
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      const bodyText = await res.text();
      let parsedBody: unknown = null;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText.slice(0, 1000);
      }

      return NextResponse.json({
        ok: res.ok,
        stage: 'sync',
        testEmail,
        request: { url: syncUrl, method: 'POST' },
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
        stage: 'sync',
        error: err instanceof Error ? err.message : String(err),
        request: { url: syncUrl, method: 'POST' },
        checks,
      });
    }
  }

  // ==============================
  // Action: ping (default) — GET /api/3/users/me
  // ==============================
  const pingUrl = `${base}/api/3/users/me`;

  try {
    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Api-Token': AC_API_KEY,
        Accept: 'application/json',
      },
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
      request: { url: pingUrl, method: 'GET' },
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
      request: { url: pingUrl, method: 'GET' },
      checks,
    });
  }
}
