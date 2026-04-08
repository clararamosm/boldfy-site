import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/contact
 *
 * Receives form submissions from the contact page.
 * For now, stores in console. Later, send to email / Notion / CRM.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, company, phone, collaborators, message } = body;

    // Validate required fields
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Nome, email e empresa são obrigatórios.' },
        { status: 400 },
      );
    }

    // Log the submission (replace with actual integration later)
    console.log('[Contact Form]', {
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
