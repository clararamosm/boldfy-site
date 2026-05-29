/**
 * POST /api/extension/auth/pair
 *
 * Gera um token novo pra extensão Chrome. Auth via cookie de sessão do CRM
 * interno (mesmo cookie do dashboard, validado por verifyToken).
 *
 * Body: { label: string }   // label do dispositivo (ex: "Macbook Clara")
 * Response: { token: string, tokenId: string }   // token CRU retornado UMA vez
 *
 * Spec: SPEC-extension-linkedin.md §4.2.
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { issueExtensionToken } from '@/lib/extension-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Auth: sessão do dashboard (cookie httpOnly). Sem login, sem token.
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { label?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (label.length === 0) {
    return NextResponse.json({ error: 'label_required' }, { status: 400 });
  }
  if (label.length > 100) {
    return NextResponse.json({ error: 'label_too_long' }, { status: 400 });
  }

  const { token, tokenId } = await issueExtensionToken(label);
  return NextResponse.json({ token, tokenId });
}
