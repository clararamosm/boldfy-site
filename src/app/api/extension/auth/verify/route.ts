/**
 * GET /api/extension/auth/verify
 *
 * Health check do token. Extensão usa pra confirmar se o token armazenado
 * ainda vale (após revogação ou re-instalação).
 *
 * Auth: Authorization: Bearer <token>
 * Response 200: { ok: true, label: string, tokenId: string }
 * Response 401: { error: 'unauthorized' }
 */

import { NextResponse } from 'next/server';
import { authenticateExtensionRequest } from '@/lib/extension-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = await authenticateExtensionRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    label: token.label,
    tokenId: token.id,
  });
}
