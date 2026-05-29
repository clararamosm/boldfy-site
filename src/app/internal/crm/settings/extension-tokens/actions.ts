'use server';

import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { revokeToken as revokeExtensionToken } from '@/lib/extension-auth';

export async function revokeTokenAction(
  tokenId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isAuthenticated())) {
    return { ok: false, error: 'Sessão expirada.' };
  }
  const result = await revokeExtensionToken(tokenId);
  if (!result.ok) {
    return { ok: false, error: 'Token já estava revogado ou não existe.' };
  }
  revalidatePath('/internal/crm/settings/extension-tokens');
  return { ok: true };
}
