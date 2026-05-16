/**
 * Google Search Console API client.
 *
 * Reusa OAuth do GA4 (mesma service account, scope diferente). Service account
 * precisa ser adicionada como Owner ou Full user no Search Console property.
 *
 * Env vars (compartilhadas com GA4):
 *   GOOGLE_SERVICE_ACCOUNT_JSON
 *   SEARCH_CONSOLE_SITE_URL  — ex: https://www.boldfy.com.br/
 */

import crypto from 'crypto';

const SC_API = 'https://searchconsole.googleapis.com/webmasters/v3';

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri: string;
};

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

function getSiteUrl(): string | null {
  return process.env.SEARCH_CONSOLE_SITE_URL || null;
}

export function isSearchConsoleConfigured(): boolean {
  if (!getSiteUrl()) return false;
  if (getServiceAccount()) return true;
  return !!process.env.GOOGLE_OAUTH_CLIENT_ID;
}

export async function isSearchConsoleAuthenticated(): Promise<boolean> {
  if (!getSiteUrl()) return false;
  try {
    const token = await getAccessToken();
    return !!token;
  } catch {
    return false;
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  // 1) Preferir OAuth de usuário (SC UI bloqueia SA, ver lib/google-oauth.ts)
  try {
    const { getValidAccessToken } = await import('./google-oauth');
    const oauthToken = await getValidAccessToken();
    if (oauthToken) return oauthToken;
  } catch (err) {
    console.warn('[search-console] OAuth token lookup failed, fallback to SA:', err);
  }

  // 2) Fallback Service Account
  const sa = getServiceAccount();
  if (!sa) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(sa.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  try {
    const res = await fetch(sa.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token: string; expires_in: number };
    cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  } catch {
    return null;
  }
}

function dateNDaysAgo(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

async function querySearchAnalytics(body: object): Promise<Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }>> {
  const token = await getAccessToken();
  const site = getSiteUrl();
  if (!token || !site) return [];

  try {
    const url = `${SC_API}/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[search-console] query failed:', res.status, await res.text());
      return [];
    }
    const data = await res.json() as { rows?: Array<{ keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
    return data.rows ?? [];
  } catch (err) {
    console.error('[search-console] error:', err);
    return [];
  }
}

export type SeoSummary = {
  clicks: number;
  impressions: number;
  ctr: number; // 0-1
  position: number;
};

export async function getSeoSummary(days = 28): Promise<SeoSummary | null> {
  const rows = await querySearchAnalytics({
    startDate: dateNDaysAgo(days),
    endDate: dateNDaysAgo(2), // SC tem delay de 2-3 dias
    dimensions: [],
  });
  if (rows.length === 0) return null;
  const r = rows[0];
  return { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position };
}

export type SeoQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export async function getTopQueries(days = 28, limit = 20): Promise<SeoQueryRow[]> {
  const rows = await querySearchAnalytics({
    startDate: dateNDaysAgo(days),
    endDate: dateNDaysAgo(2),
    dimensions: ['query'],
    rowLimit: limit,
  });
  return rows.map((r) => ({
    query: r.keys?.[0] ?? '',
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

export async function getTopPagesSeo(days = 28, limit = 20): Promise<Array<{ page: string; clicks: number; impressions: number; position: number }>> {
  const rows = await querySearchAnalytics({
    startDate: dateNDaysAgo(days),
    endDate: dateNDaysAgo(2),
    dimensions: ['page'],
    rowLimit: limit,
  });
  return rows.map((r) => ({
    page: r.keys?.[0] ?? '',
    clicks: r.clicks,
    impressions: r.impressions,
    position: r.position,
  }));
}

/**
 * Queries onde aparecemos em pos. 11-30 (página 2-3) — oportunidades de subir
 * pra primeira página. Filtramos client-side porque SC não tem filtro de
 * position min/max.
 */
export async function getRankingOpportunities(days = 28, limit = 20): Promise<SeoQueryRow[]> {
  const all = await getTopQueries(days, 100);
  return all
    .filter((q) => q.position >= 11 && q.position <= 30 && q.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

/**
 * Queries de marca (contendo "boldfy") — pra correlacionar com PR e direct.
 */
export async function getBrandedQueries(days = 28): Promise<SeoQueryRow[]> {
  const all = await getTopQueries(days, 100);
  return all.filter((q) => q.query.toLowerCase().includes('boldfy'));
}
