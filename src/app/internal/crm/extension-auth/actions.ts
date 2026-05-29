'use server';

/**
 * Server actions da página de pareamento da extensão Chrome.
 *
 * Gera token via extension-auth lib. Página mostra ao usuário UMA VEZ
 * (a string crua não persiste — só o bcrypt hash no DB).
 */

import { isAuthenticated } from '@/lib/auth';
import { issueExtensionToken } from '@/lib/extension-auth';

export async function generateExtensionToken(
  label: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: 'Sessão expirada. Faça login de novo.' };
  }
  const cleanLabel = label.trim();
  if (cleanLabel.length === 0) {
    return { ok: false, error: 'Coloca uma label pra identificar o dispositivo.' };
  }
  if (cleanLabel.length > 100) {
    return { ok: false, error: 'Label muito longa (max 100 caracteres).' };
  }

  const { token } = await issueExtensionToken(cleanLabel);
  return { ok: true, token };
}
