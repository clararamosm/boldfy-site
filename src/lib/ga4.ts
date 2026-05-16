/**
 * Google Analytics 4 Data API client.
 *
 * Usa a REST API direta (sem dep do google client lib) com OAuth2 via Service
 * Account JWT — assim evita instalar pacote pesado (googleapis ~50MB).
 *
 * Env vars necessárias (Sprint 1 do Dashboard requer Clara fazer setup):
 *   GA4_PROPERTY_ID                — ex: 123456789 (string numérica)
 *   GOOGLE_SERVICE_ACCOUNT_JSON    — JSON inteiro da service account
 *
 * Setup (Clara faz 1 vez):
 *   1. console.cloud.google.com → seu project da Plataforma Boldfy
 *   2. APIs & Services → Library → ativa "Google Analytics Data API"
 *   3. IAM → Service Accounts → cria boldfy-site-dashboard (ou reusa)
 *   4. Baixa JSON da chave
 *   5. GA4 → Admin → Property access → adiciona email da service account com role Viewer
 *   6. No Vercel: env vars GA4_PROPERTY_ID + GOOGLE_SERVICE_ACCOUNT_JSON (paste JSON inteiro)
 */

import crypto from 'crypto';

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta/properties';

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
  } catch (err) {
    console.error('[ga4] GOOGLE_SERVICE_ACCOUNT_JSON inválido:', err);
    return null;
  }
}

function getPropertyId(): string | null {
  return process.env.GA4_PROPERTY_ID || null;
}

export function isGa4Configured(): boolean {
  return !!getServiceAccount() && !!getPropertyId();
}

/* -------------------------------------------------------------------------- */
/*  OAuth2: JWT pra service account → access token                            */
/* -------------------------------------------------------------------------- */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const sa = getServiceAccount();
  if (!sa) return null;

  // Reusa token se ainda válido (com 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
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
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    if (!res.ok) {
      console.error('[ga4] OAuth failed:', await res.text());
      return null;
    }
    const data = await res.json() as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  } catch (err) {
    console.error('[ga4] OAuth error:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  runReport — wrapper do endpoint principal                                  */
/* -------------------------------------------------------------------------- */

type Ga4Report = {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  totals?: Array<{ metricValues: Array<{ value: string }> }>;
};

async function runReport(body: object): Promise<Ga4Report | null> {
  const token = await getAccessToken();
  const propertyId = getPropertyId();
  if (!token || !propertyId) return null;

  try {
    const res = await fetch(`${GA4_API}/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[ga4] runReport failed:', res.status, await res.text());
      return null;
    }
    return await res.json() as Ga4Report;
  } catch (err) {
    console.error('[ga4] runReport error:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  High-level queries                                                         */
/* -------------------------------------------------------------------------- */

export type TrafficSummary = {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  screenPageViews: number;
  averageSessionDuration: number; // seconds
  bounceRate: number; // 0-1
};

export async function getTrafficSummary(days = 30): Promise<TrafficSummary | null> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
  });
  if (!report) return null;

  const totals = report.totals?.[0]?.metricValues;
  if (!totals) return null;

  return {
    sessions: parseInt(totals[0]?.value ?? '0', 10),
    totalUsers: parseInt(totals[1]?.value ?? '0', 10),
    newUsers: parseInt(totals[2]?.value ?? '0', 10),
    screenPageViews: parseInt(totals[3]?.value ?? '0', 10),
    averageSessionDuration: parseFloat(totals[4]?.value ?? '0'),
    bounceRate: parseFloat(totals[5]?.value ?? '0'),
  };
}

export type ChannelRow = { channel: string; sessions: number; users: number };

export async function getTrafficByChannel(days = 30): Promise<ChannelRow[]> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });
  if (!report?.rows) return [];

  return report.rows.map((row) => ({
    channel: row.dimensionValues[0]?.value ?? 'unknown',
    sessions: parseInt(row.metricValues[0]?.value ?? '0', 10),
    users: parseInt(row.metricValues[1]?.value ?? '0', 10),
  }));
}

export type PageRow = { page: string; pageViews: number; sessions: number };

export async function getTopPages(days = 30, limit = 10): Promise<PageRow[]> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: String(limit),
  });
  if (!report?.rows) return [];

  return report.rows.map((row) => ({
    page: row.dimensionValues[0]?.value ?? '/',
    pageViews: parseInt(row.metricValues[0]?.value ?? '0', 10),
    sessions: parseInt(row.metricValues[1]?.value ?? '0', 10),
  }));
}

export type UtmRow = { source: string; medium: string; campaign: string; sessions: number };

export async function getTopUtms(days = 30, limit = 15): Promise<UtmRow[]> {
  const report = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
      { name: 'sessionCampaignName' },
    ],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: String(limit),
  });
  if (!report?.rows) return [];

  return report.rows.map((row) => ({
    source: row.dimensionValues[0]?.value ?? '(direct)',
    medium: row.dimensionValues[1]?.value ?? '(none)',
    campaign: row.dimensionValues[2]?.value ?? '(not set)',
    sessions: parseInt(row.metricValues[0]?.value ?? '0', 10),
  }));
}
