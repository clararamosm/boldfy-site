/**
 * Google OAuth — auth de usuário pra GA4 + Search Console.
 *
 * Por que OAuth (e não Service Account):
 *   GA4 admin UI bloqueia adicionar SA novas como Viewer (bug conhecido do
 *   Google). Search Console tem mesmo problema. OAuth resolve porque usa a
 *   permissão do usuário Clara (que já tem acesso total às propriedades).
 *
 * Fluxo:
 *   1. Clara clica "Conectar Google" em /internal/dashboard/connect-google
 *   2. Vai pra /api/auth/google/start → redireciona pra Google OAuth
 *   3. Clara consente, Google redireciona pra /api/auth/google/callback
 *   4. Callback troca code por tokens, salva em google_oauth_tokens
 *   5. ga4.ts e search-console.ts puxam access_token aqui
 *   6. Quando expira, refresh automático com refresh_token
 *
 * Env vars necessárias:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI (ex: https://www.boldfy.com.br/api/auth/google/callback)
 */

import { db, googleOauthTokens } from '@/db';
import { eq, desc } from 'drizzle-orm';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/** Scopes mínimos necessários pra ler GA4 + Search Console. */
export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getClientCreds(): { id: string; secret: string; redirectUri: string } | null {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!id || !secret || !redirectUri) return null;
  return { id, secret, redirectUri };
}

export function isGoogleOauthConfigured(): boolean {
  return getClientCreds() !== null;
}

/**
 * URL pra começar o fluxo OAuth. `state` pra CSRF (verificado no callback).
 */
export function buildAuthUrl(state: string): string | null {
  const creds = getClientCreds();
  if (!creds) return null;
  const params = new URLSearchParams({
    client_id: creds.id,
    redirect_uri: creds.redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES.join(' '),
    access_type: 'offline', // pra receber refresh_token
    prompt: 'consent', // força tela de consent (garante refresh_token mesmo se já autorizou antes)
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Troca o `code` recebido no callback por access_token + refresh_token.
 * Também busca email do usuário pra salvar.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  ok: true;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
} | { ok: false; error: string }> {
  const creds = getClientCreds();
  if (!creds) return { ok: false, error: 'OAuth não configurado (env vars ausentes)' };

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: creds.id,
        client_secret: creds.secret,
        redirect_uri: creds.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text().catch(() => '');
      return { ok: false, error: `token exchange failed: ${tokenRes.status} ${txt}` };
    }
    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    };

    if (!tokenData.refresh_token) {
      return {
        ok: false,
        error: 'Google não retornou refresh_token. Revoga acesso prévio em myaccount.google.com/permissions e tenta de novo.',
      };
    }

    // Pega o email
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return { ok: false, error: 'userinfo failed' };
    }
    const userData = (await userRes.json()) as { email: string };

    return {
      ok: true,
      email: userData.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scopes: tokenData.scope.split(' '),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Salva (upsert) os tokens no DB.
 */
export async function saveTokens(args: {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
}): Promise<void> {
  const expiresAt = new Date(Date.now() + args.expiresIn * 1000);
  const existing = await db
    .select({ id: googleOauthTokens.id })
    .from(googleOauthTokens)
    .where(eq(googleOauthTokens.email, args.email))
    .limit(1);

  if (existing[0]) {
    await db
      .update(googleOauthTokens)
      .set({
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt,
        scopes: args.scopes,
        updatedAt: new Date(),
      })
      .where(eq(googleOauthTokens.id, existing[0].id));
  } else {
    await db.insert(googleOauthTokens).values({
      email: args.email,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt,
      scopes: args.scopes,
    });
  }
}

/**
 * Refresca access_token usando refresh_token.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
} | null> {
  const creds = getClientCreds();
  if (!creds) return null;
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: creds.id,
        client_secret: creds.secret,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) {
      console.error('[google-oauth] refresh failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  } catch (err) {
    console.error('[google-oauth] refresh error:', err);
    return null;
  }
}

/**
 * Retorna um access_token válido (refrescando se necessário). Pega o primeiro
 * token salvo (single-user pra agora).
 *
 * Use isso em ga4.ts/search-console.ts no lugar do JWT da Service Account.
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(googleOauthTokens)
      .orderBy(desc(googleOauthTokens.createdAt))
      .limit(1);
    const token = rows[0];
    if (!token) return null;

    // Refresca se expira em menos de 5 min
    const expiresSoon = token.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!expiresSoon) return token.accessToken;

    const refreshed = await refreshAccessToken(token.refreshToken);
    if (!refreshed) return null;

    const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
    await db
      .update(googleOauthTokens)
      .set({
        accessToken: refreshed.accessToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(googleOauthTokens.id, token.id));

    return refreshed.accessToken;
  } catch (err) {
    console.error('[google-oauth] getValidAccessToken error:', err);
    return null;
  }
}

/**
 * Info do user conectado pra UI mostrar status.
 */
export async function getConnectedAccount(): Promise<{
  email: string;
  expiresAt: Date;
  scopes: string[];
} | null> {
  try {
    const rows = await db
      .select({
        email: googleOauthTokens.email,
        expiresAt: googleOauthTokens.expiresAt,
        scopes: googleOauthTokens.scopes,
      })
      .from(googleOauthTokens)
      .orderBy(desc(googleOauthTokens.createdAt))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Revoga o token e remove do DB.
 */
export async function disconnect(): Promise<void> {
  const rows = await db
    .select()
    .from(googleOauthTokens)
    .orderBy(desc(googleOauthTokens.createdAt))
    .limit(1);
  const token = rows[0];
  if (!token) return;

  // Revoga no Google
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.refreshToken)}`, {
      method: 'POST',
    });
  } catch {
    // ignora — vai apagar do DB mesmo assim
  }

  await db.delete(googleOauthTokens).where(eq(googleOauthTokens.id, token.id));
}
