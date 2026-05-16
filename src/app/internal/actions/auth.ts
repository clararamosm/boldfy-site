/**
 * Server actions de auth do /internal.
 *
 * login(formData): valida senha contra DASHBOARD_PASSWORD, cria cookie de sessão.
 * logout(): destrói cookie, redireciona pra login.
 *
 * Senha vive em env var. Sessão = cookie HMAC-signed (ver lib/auth.ts).
 */

'use server';

import { redirect } from 'next/navigation';
import { checkPassword, createSession, destroySession } from '@/lib/auth';

export type LoginState = {
  error?: string;
};

export async function login(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password');
  const next = formData.get('next');

  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Digite a senha.' };
  }

  // Throttle simples: pequena espera pra dificultar brute force (~1s)
  await new Promise((r) => setTimeout(r, 800));

  if (!checkPassword(password)) {
    return { error: 'Senha incorreta.' };
  }

  await createSession();

  const redirectTo =
    typeof next === 'string' && next.startsWith('/internal') && !next.startsWith('/internal/login')
      ? next
      : '/internal/dashboard';

  redirect(redirectTo);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/internal/login');
}
