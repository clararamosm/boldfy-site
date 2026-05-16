/**
 * Start do fluxo OAuth Google. Gera state CSRF, salva em cookie, redireciona.
 * Endpoint interno — só usado pela página /internal/dashboard/connect-google.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { buildAuthUrl, isGoogleOauthConfigured } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isGoogleOauthConfigured()) {
    return NextResponse.json(
      { error: 'OAuth não configurado. Falta GOOGLE_OAUTH_CLIENT_ID / SECRET / REDIRECT_URI no Vercel.' },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(24).toString('hex');
  const url = buildAuthUrl(state);
  if (!url) {
    return NextResponse.json({ error: 'failed to build auth url' }, { status: 500 });
  }

  // Guarda state em cookie httpOnly pra validar no callback
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 min
    path: '/',
  });

  return NextResponse.redirect(url);
}
