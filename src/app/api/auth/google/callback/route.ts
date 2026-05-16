/**
 * Callback do Google OAuth.
 * Valida state CSRF, troca code por tokens, salva no DB, redireciona pra UI.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, saveTokens } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const redirectBase = '/internal/dashboard/connect-google';

  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=missing_params`, request.url),
    );
  }

  // Valida state CSRF
  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.delete('google_oauth_state');

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=invalid_state`, request.url),
    );
  }

  // Troca code por tokens
  const result = await exchangeCodeForTokens(code);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=${encodeURIComponent(result.error)}`, request.url),
    );
  }

  // Salva no DB
  try {
    await saveTokens({
      email: result.email,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      scopes: result.scopes,
    });
  } catch (err) {
    console.error('[google-oauth-callback] saveTokens error:', err);
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=db_save_failed`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`${redirectBase}?connected=${encodeURIComponent(result.email)}`, request.url),
  );
}
