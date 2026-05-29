/**
 * POST /api/extension/telemetry/field-missing
 *
 * Reporta um campo que falhou todos os seletores fallback. Clara consulta
 * em /internal/crm/settings/extension-telemetry pra saber quando atualizar
 * seletores antes de quebrar muita captura.
 *
 * Auth: Authorization: Bearer <token>
 * Body: {
 *   field: string,             // ex: 'headline', 'photo_url'
 *   page_type: 'person' | 'company',
 *   selectors_tried: string[], // seletores testados em ordem
 *   url_pattern: string,       // '/in/<slug>' ou '/company/<slug>'
 *   extension_version: string, // ex: '0.3.1'
 *   captured_at: string        // ISO
 * }
 *
 * Spec: SPEC-extension-linkedin.md §11.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateExtensionRequest } from '@/lib/extension-auth';
import { db, activities } from '@/db';

export const dynamic = 'force-dynamic';

const PayloadSchema = z.object({
  field: z.string().trim().min(1).max(100),
  page_type: z.enum(['person', 'company']),
  selectors_tried: z.array(z.string().trim().max(500)).max(20),
  url_pattern: z.string().trim().max(200),
  extension_version: z.string().trim().max(20),
  captured_at: z.string().datetime(),
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

  // Logo direto em activities sem person/company associada — fica orphan
  // mas as queries de telemetria filtram por type='extension_field_missing'.
  await db.insert(activities).values({
    type: 'extension_field_missing',
    weight: 0,
    source: 'linkedin',
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
