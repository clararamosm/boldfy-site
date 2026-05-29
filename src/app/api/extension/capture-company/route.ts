/**
 * POST /api/extension/capture-company
 *
 * Captura intencional de uma empresa do LinkedIn (/company/<slug>).
 *
 * Auth: Authorization: Bearer <token>
 * Body: LinkedInCompanyExtensionInput
 * Response 200: { ok: true, companyId: string, promoted: bool, created: bool,
 *                 url_to_view: string }
 *
 * Spec: SPEC-extension-linkedin.md §6.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateExtensionRequest } from '@/lib/extension-auth';
import { captureLinkedinCompany } from '@/lib/crm-extension';

export const dynamic = 'force-dynamic';

// 7 campos enxutos (decisão Clara 2026-05-28).
const PayloadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  linkedinUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => /linkedin\.com\/company\//i.test(u), 'must be linkedin.com/company/<slug>'),
  industry: z.string().trim().max(200).optional(),
  size: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  website: z.string().trim().url().optional(),
  specialties: z.array(z.string().trim().max(100)).max(50).optional(),
  capturedAt: z.string().datetime(),
  sourceUrl: z.string().trim().url(),
});

export async function POST(req: Request) {
  const token = await authenticateExtensionRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await captureLinkedinCompany(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: 'capture_failed', message: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    companyId: result.data.companyId,
    promoted: result.data.promoted,
    created: result.data.created,
    url_to_view: `/internal/crm/companies/${result.data.companyId}`,
  });
}
