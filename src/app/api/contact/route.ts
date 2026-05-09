import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  EmailSchema,
  NameSchema,
  CompanyNameSchema,
  PhoneOptionalSchema,
} from '@/app/actions/_schemas';

/**
 * POST /api/contact
 *
 * Receives form submissions from the contact page.
 * For now, stores in console. Later, send to email / Notion / CRM.
 *
 * Atenção: route handlers NAO sao protegidos por origin-check do Next
 * (diferente das server actions). Quando integrar com email/CRM,
 * adicionar origin check ou trocar essa rota por server action.
 */

// Schema próprio porque o form aqui usa nomes em inglês (legado);
// outras rotas/actions usam pt-BR.
const ContactRouteSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  company: CompanyNameSchema,
  phone: PhoneOptionalSchema,
  collaborators: z.string().trim().max(60).optional(),
  message: z.string().trim().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = ContactRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique o formulário.' },
        { status: 400 },
      );
    }

    const { name, email, company, phone, collaborators, message } = parsed.data;

    // ⚠️  TEMPORÁRIO: enquanto não há integração real (Resend / Notion / CRM),
    // logamos a submissão em warn pra ela aparecer nos logs do Vercel e não ser
    // perdida. Substituir por integração definitiva (SOP-S2 do AUDIT).
    console.warn('[Contact Form] integration pending — submission logged:', {
      name,
      email,
      company,
      phone,
      collaborators,
      message,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integration options:
    // 1. Send email via Resend/Sendgrid
    // 2. Create Notion page in a "Leads" database
    // 3. Send to CRM (HubSpot, Pipedrive)
    // 4. Send WhatsApp notification

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 },
    );
  }
}
