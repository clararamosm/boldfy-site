/**
 * POST /api/extension/capture-person
 *
 * Captura intencional de uma pessoa do LinkedIn (/in/<slug>).
 *
 * Auth: Authorization: Bearer <token>
 * Body: LinkedInExtensionInput (ver lib/form-adapters/linkedin-extension.ts)
 * Response 200: { ok: true, personId: string, companyId?: string,
 *                 was_existing: bool, url_to_view: string }
 *
 * Spec: SPEC-extension-linkedin.md §5.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateExtensionRequest } from '@/lib/extension-auth';
import { captureLinkedinPerson } from '@/lib/crm-extension';
import { db, people } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Schema enxuto — campos extras vão pra metadata sem validação rígida.
const PayloadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  linkedinUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => /linkedin\.com\/in\//i.test(u), 'must be linkedin.com/in/<slug>'),
  headline: z.string().trim().max(500).optional(),
  jobTitle: z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  photoUrl: z.string().trim().url().optional(),
  location: z.string().trim().max(200).optional(),
  about: z.string().trim().max(5000).optional(),
  experience: z
    .array(
      z.object({
        title: z.string().trim().max(200),
        company: z.string().trim().max(200),
        period: z.string().trim().max(100).optional(),
      }),
    )
    .max(3)
    .optional(),
  education: z
    .object({
      school: z.string().trim().max(200),
      degree: z.string().trim().max(200).optional(),
      year: z.string().trim().max(20).optional(),
    })
    .optional(),
  connectionsCount: z.string().trim().max(20).optional(),
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

  // Checa pré-existência pra reportar 'was_existing' no toast da extensão.
  const [existed] = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.linkedinUrl, parsed.data.linkedinUrl))
    .limit(1);

  const result = await captureLinkedinPerson(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: 'capture_failed', message: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    personId: result.data.personId,
    companyId: result.data.companyId,
    was_existing: Boolean(existed),
    url_to_view: `/internal/crm/people/${result.data.personId}`,
  });
}
