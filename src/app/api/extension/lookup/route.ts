/**
 * GET /api/extension/lookup?linkedin_url=...
 *
 * Lookup leve pra content script saber se uma URL do LinkedIn já foi
 * capturada — define o estado visual do botão ("Salvar" vs "✓ Já salvo").
 *
 * Auth: Authorization: Bearer <token>
 *
 * Query: `linkedin_url` (obrigatório) — URL canonical
 * Response 200: { exists: bool, kind?: 'person' | 'company', id?: string,
 *                 last_captured_at?: string (ISO) }
 *
 * Spec: SPEC-extension-linkedin.md §10.1 (detecção pre-fetch pro estado do botão).
 */

import { NextResponse } from 'next/server';
import { db, people, companies, activities } from '@/db';
import { authenticateExtensionRequest } from '@/lib/extension-auth';
import { and, desc, eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = await authenticateExtensionRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const linkedinUrl = url.searchParams.get('linkedin_url')?.trim();
  if (!linkedinUrl) {
    return NextResponse.json({ error: 'linkedin_url_required' }, { status: 400 });
  }

  // Distingue person vs company pela URL.
  const isCompany = /linkedin\.com\/company\//i.test(linkedinUrl);

  if (isCompany) {
    const [row] = await db
      .select({ id: companies.id, updatedAt: companies.updatedAt })
      .from(companies)
      .where(eq(companies.linkedinUrl, linkedinUrl))
      .limit(1);
    if (!row) return NextResponse.json({ exists: false });

    // Última captura via activity extension_company_capture
    const [lastCapture] = await db
      .select({ createdAt: activities.createdAt })
      .from(activities)
      .where(and(eq(activities.companyId, row.id), eq(activities.type, 'extension_company_capture')))
      .orderBy(desc(activities.createdAt))
      .limit(1);

    return NextResponse.json({
      exists: true,
      kind: 'company',
      id: row.id,
      last_captured_at: (lastCapture?.createdAt ?? row.updatedAt).toISOString(),
    });
  }

  // Person
  const [row] = await db
    .select({ id: people.id, updatedAt: people.updatedAt })
    .from(people)
    .where(eq(people.linkedinUrl, linkedinUrl))
    .limit(1);
  if (!row) return NextResponse.json({ exists: false });

  // Última captura via activity form_submit_extension_linkedin
  const [lastCapture] = await db
    .select({ createdAt: activities.createdAt })
    .from(activities)
    .where(
      and(
        eq(activities.personId, row.id),
        or(
          eq(activities.type, 'form_submit_extension_linkedin'),
          eq(activities.type, 'extension_save'),
        ),
      ),
    )
    .orderBy(desc(activities.createdAt))
    .limit(1);

  return NextResponse.json({
    exists: true,
    kind: 'person',
    id: row.id,
    last_captured_at: (lastCapture?.createdAt ?? row.updatedAt).toISOString(),
  });
}
