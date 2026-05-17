/**
 * Página de debug pra diagnosticar por que GA4 / Search Console retornam vazio.
 *
 * Mostra:
 *   - Env vars presentes (sem expor valores sensíveis)
 *   - Status do OAuth token no DB
 *   - Raw response do GA4 (status code + body completo se erro)
 *   - Raw response do Search Console
 *
 * /internal/dashboard/debug
 */

import type { Metadata } from 'next';
import { db, googleOauthTokens } from '@/db';
import { desc } from 'drizzle-orm';
import { getValidAccessToken } from '@/lib/google-oauth';

export const metadata: Metadata = {
  title: 'Debug · Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function debugGa4(): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return { ok: false, error: 'GA4_PROPERTY_ID env var ausente' };

  const token = await getValidAccessToken();
  if (!token) return { ok: false, error: 'getValidAccessToken() retornou null — sem OAuth token no DB' };

  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }],
      }),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function debugSearchConsole(): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) return { ok: false, error: 'SEARCH_CONSOLE_SITE_URL env var ausente' };

  const token = await getValidAccessToken();
  if (!token) return { ok: false, error: 'getValidAccessToken() retornou null — sem OAuth token no DB' };

  try {
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: '2026-04-01',
        endDate: '2026-05-10',
        dimensions: ['query'],
        rowLimit: 1,
      }),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function DebugDashboardPage() {
  const envChecks = {
    GA4_PROPERTY_ID: !!process.env.GA4_PROPERTY_ID,
    GA4_PROPERTY_ID_value: process.env.GA4_PROPERTY_ID ?? '(missing)',
    SEARCH_CONSOLE_SITE_URL: !!process.env.SEARCH_CONSOLE_SITE_URL,
    SEARCH_CONSOLE_SITE_URL_value: process.env.SEARCH_CONSOLE_SITE_URL ?? '(missing)',
    GOOGLE_OAUTH_CLIENT_ID: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '(missing)',
    GOOGLE_SERVICE_ACCOUNT_JSON: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  };

  // eslint-disable-next-line react-hooks/purity -- Server Component force-dynamic, sempre re-rendered
  const nowMs = Date.now();
  let oauthToken: {
    email: string;
    expiresAt: Date;
    scopes: string[];
    accessTokenLen: number;
    refreshTokenLen: number;
    minutesUntilExpiry: number;
  } | null = null;

  try {
    const rows = await db
      .select()
      .from(googleOauthTokens)
      .orderBy(desc(googleOauthTokens.createdAt))
      .limit(1);
    if (rows[0]) {
      const expiresAt = rows[0].expiresAt;
      oauthToken = {
        email: rows[0].email,
        expiresAt,
        scopes: rows[0].scopes,
        accessTokenLen: rows[0].accessToken.length,
        refreshTokenLen: rows[0].refreshToken.length,
        minutesUntilExpiry: Math.round((expiresAt.getTime() - nowMs) / 60000),
      };
    }
  } catch (err) {
    console.error('[debug] db error:', err);
  }

  const [ga4Result, scResult] = await Promise.all([debugGa4(), debugSearchConsole()]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Debug</h1>
          <p className="dash-subtitle">Diagnóstico GA4 + Search Console — request real, response cru</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🔧 Env vars</div>
        <pre style={{ background: '#0F0820', color: '#E8DFFA', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
{JSON.stringify(envChecks, null, 2)}
        </pre>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🔐 OAuth token no DB</div>
        {oauthToken ? (
          <pre style={{ background: '#0F0820', color: '#E8DFFA', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
{JSON.stringify({
  email: oauthToken.email,
  expiresAt: oauthToken.expiresAt.toISOString(),
  minutesUntilExpiry: oauthToken.minutesUntilExpiry,
  scopes: oauthToken.scopes,
  accessTokenLen: oauthToken.accessTokenLen,
  refreshTokenLen: oauthToken.refreshTokenLen,
}, null, 2)}
          </pre>
        ) : (
          <div style={{ padding: 16, color: '#EE5A52' }}>
            ❌ Nenhum token no DB. Conecta em /internal/dashboard/connect-google
          </div>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📊 GA4 raw response</div>
        <div style={{ marginBottom: 8, fontSize: 13, color: ga4Result.ok ? '#10B981' : '#EE5A52' }}>
          {ga4Result.ok ? `✓ HTTP ${ga4Result.status} OK` : `❌ ${ga4Result.error ?? `HTTP ${ga4Result.status}`}`}
        </div>
        <pre style={{ background: '#0F0820', color: '#E8DFFA', padding: 16, borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 400 }}>
{ga4Result.body ?? '(sem body — erro antes do fetch)'}
        </pre>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🔍 Search Console raw response</div>
        <div style={{ marginBottom: 8, fontSize: 13, color: scResult.ok ? '#10B981' : '#EE5A52' }}>
          {scResult.ok ? `✓ HTTP ${scResult.status} OK` : `❌ ${scResult.error ?? `HTTP ${scResult.status}`}`}
        </div>
        <pre style={{ background: '#0F0820', color: '#E8DFFA', padding: 16, borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 400 }}>
{scResult.body ?? '(sem body — erro antes do fetch)'}
        </pre>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📖 Como interpretar</div>
        <ul style={{ paddingLeft: 20, fontSize: 13, color: '#45336B', lineHeight: 1.8 }}>
          <li><strong>HTTP 403 PERMISSION_DENIED</strong> + &quot;API not enabled&quot; → Ativa Google Analytics Data API ou Search Console API no project do OAuth Client</li>
          <li><strong>HTTP 403</strong> + &quot;User does not have sufficient permissions for this property&quot; → Email do OAuth não tem acesso ao GA4 Property ID configurado. Confere em GA4 → Admin → Property Access Management</li>
          <li><strong>HTTP 400 INVALID_ARGUMENT</strong> + &quot;Invalid property ID&quot; → GA4_PROPERTY_ID errado. Pega o ID numérico em GA4 → Admin → Property Details</li>
          <li><strong>HTTP 401 UNAUTHENTICATED</strong> → Access token inválido/expirado. Reconecta em /connect-google</li>
          <li><strong>HTTP 200 mas response vazia</strong> (no rows) → Auth OK mas property não tem dado no período</li>
        </ul>
      </div>
    </div>
  );
}
