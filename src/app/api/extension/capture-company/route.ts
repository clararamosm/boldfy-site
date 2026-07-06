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
  logoUrl: z.string().trim().url().optional(),
  capturedAt: z.string().datetime(),
  sourceUrl: z.string().trim().url(),
  /** Quando presente, backend linka esse personId à empresa após upsert. */
  link_person_id: z.string().uuid().optional(),
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

  // Linka pessoa pendente (fluxo pessoa → empresa em sequência).
  // Best-effort: erro aqui não bloqueia o sucesso da captura.
  //
  // Enriquecimento NÃO sobrescreve (jul/2026): só linka se a pessoa ainda não
  // tem empresa. Se já tinha (ex: empresa veio de um form), preserva — a Clara
  // troca manualmente no CRM se precisar. Retorna already_linked pra extensão
  // poder avisar que a empresa não foi trocada.
  let linkedPersonId: string | undefined;
  let alreadyLinked = false;
  if (parsed.data.link_person_id) {
    try {
      const { db, people } = await import('@/db');
      const { eq, and, isNull } = await import('drizzle-orm');
      const updated = await db
        .update(people)
        .set({ companyId: result.data.companyId, updatedAt: new Date() })
        .where(and(eq(people.id, parsed.data.link_person_id), isNull(people.companyId)))
        .returning({ id: people.id });
      if (updated.length > 0) {
        linkedPersonId = parsed.data.link_person_id;
      } else {
        // Nenhuma linha atualizada = pessoa já tinha empresa (ou não existe).
        alreadyLinked = true;
      }
    } catch (err) {
      console.error('[capture-company] failed to link pending person:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    companyId: result.data.companyId,
    promoted: result.data.promoted,
    created: result.data.created,
    linked_person_id: linkedPersonId,
    already_linked: alreadyLinked,
    url_to_view: `/internal/crm/companies/${result.data.companyId}`,
  });
}
