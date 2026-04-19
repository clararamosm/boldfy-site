import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  findContactByEmail,
  addTagsToExistingContact,
  removeTagFromContact,
  addNoteToContact,
} from '@/lib/activecampaign';

/**
 * Webhook receiver pro Cal.com.
 *
 * Recebe notificacoes de agendamentos criados/cancelados/reagendados e
 * atualiza as tags do contato correspondente no ActiveCampaign.
 *
 * Configurado no painel do Cal.com:
 *   Settings > Developer > Webhooks (ou por Event Type)
 *   URL: https://www.boldfy.com.br/api/webhooks/cal
 *   Secret: valor da env CAL_WEBHOOK_SECRET
 *   Triggers: Booking Created, Booking Cancelled, Booking Rescheduled
 *
 * Tags gerenciadas:
 *   - 'Demo: Aguardando agendamento' — adicionada no submit do form (antes)
 *   - 'Demo: Agendada' — adicionada por este webhook quando BOOKING_CREATED
 *   - 'Demo: Cancelada' — adicionada quando BOOKING_CANCELLED
 *
 * Esse webhook NAO cria contato novo — assume que o form de Demo foi
 * preenchido primeiro (que criou o contato no AC). Se o webhook chega
 * sem contato existente, ignora (caso raro: alguem acessou o link direto
 * sem passar pelo form).
 */

export const dynamic = 'force-dynamic';

// Tipos minimos do payload do Cal.com (mantidos flexivel com unknown
// pros campos que nao precisamos inspecionar).
type CalWebhookPayload = {
  triggerEvent: string;
  createdAt?: string;
  payload: {
    title?: string;
    startTime?: string;
    endTime?: string;
    uid?: string;
    attendees?: Array<{
      email: string;
      name?: string;
      timeZone?: string;
    }>;
    responses?: {
      name?: { value?: string };
      email?: { value?: string };
    };
  };
};

/**
 * Verifica HMAC-SHA256 da requisicao. Cal.com assina o body com a secret
 * configurada no webhook e manda no header x-cal-signature-256.
 *
 * Timing-safe: usa crypto.timingSafeEqual pra prevenir timing attacks.
 * Retorna true se assinatura valida, false caso contrario.
 */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Extrai o email do "attendee" (a pessoa que agendou — nao o host).
 * Usa responses.email primeiro (mais confiavel), fallback pra attendees[0].
 */
function extractAttendeeEmail(payload: CalWebhookPayload['payload']): string | null {
  const fromResponses = payload.responses?.email?.value;
  if (fromResponses && typeof fromResponses === 'string') return fromResponses;

  const fromAttendees = payload.attendees?.[0]?.email;
  if (fromAttendees && typeof fromAttendees === 'string') return fromAttendees;

  return null;
}

export async function POST(request: NextRequest) {
  // 1. Le o raw body (precisa pra verificar assinatura antes de parsear)
  const rawBody = await request.text();

  // 2. Verifica assinatura se CAL_WEBHOOK_SECRET estiver configurada.
  //    Se nao estiver, loga warning e deixa passar (modo desenvolvimento).
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get('x-cal-signature-256');
    if (!verifySignature(rawBody, signature, secret)) {
      console.error('[cal-webhook] Invalid signature');
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  } else {
    console.warn(
      '[cal-webhook] CAL_WEBHOOK_SECRET not set — webhook running without signature verification',
    );
  }

  // 3. Parse body
  let body: CalWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { triggerEvent, payload } = body;

  // 4. Extrai email do attendee (quem agendou)
  const email = extractAttendeeEmail(payload);
  if (!email) {
    console.warn('[cal-webhook] No attendee email found in payload', {
      triggerEvent,
    });
    return NextResponse.json({ ok: true, reason: 'no_attendee_email' });
  }

  // 5. Busca contato no AC
  const contactId = await findContactByEmail(email);
  if (!contactId) {
    // Nao encontrado — pode ser alguem que acessou o link do Cal direto
    // sem preencher o form. Ignoramos silenciosamente.
    console.warn('[cal-webhook] Contact not found in AC', { email, triggerEvent });
    return NextResponse.json({ ok: true, reason: 'contact_not_in_ac' });
  }

  // 6. Atualiza tags conforme o evento
  try {
    if (triggerEvent === 'BOOKING_CREATED') {
      // Demo agendada → remove "aguardando", adiciona "agendada"
      await Promise.allSettled([
        removeTagFromContact(contactId, 'Demo: Aguardando agendamento'),
        addTagsToExistingContact(contactId, ['Demo: Agendada']),
      ]);

      // Opcional: anexa nota com detalhes do agendamento
      const startTime = payload.startTime
        ? new Date(payload.startTime).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'full',
            timeStyle: 'short',
          })
        : 'horario nao informado';
      const note = `📅 Demo agendada via Cal.com\n\nData: ${startTime}\nTitulo: ${payload.title ?? '-'}\nBooking UID: ${payload.uid ?? '-'}`;
      await addNoteToContact(contactId, note);
    } else if (triggerEvent === 'BOOKING_CANCELLED') {
      // Demo cancelada → volta pra aguardando, marca tag de cancelamento
      await Promise.allSettled([
        removeTagFromContact(contactId, 'Demo: Agendada'),
        addTagsToExistingContact(contactId, [
          'Demo: Cancelada',
          'Demo: Aguardando agendamento',
        ]),
      ]);
    } else if (triggerEvent === 'BOOKING_RESCHEDULED') {
      // Demo remarcada → mantem agendada, so atualiza nota
      const startTime = payload.startTime
        ? new Date(payload.startTime).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'full',
            timeStyle: 'short',
          })
        : 'horario nao informado';
      const note = `🔄 Demo remarcada via Cal.com\n\nNova data: ${startTime}\nTitulo: ${payload.title ?? '-'}`;
      await addNoteToContact(contactId, note);
    }
    // Outros triggerEvents (BOOKING_REQUESTED, MEETING_ENDED, etc) ignorados
    // — so reagimos aos 3 acima por enquanto.
  } catch (err) {
    console.error('[cal-webhook] Error processing event:', err);
    // Retorna 200 mesmo com erro interno pra Cal.com nao tentar reenviar
    // infinitamente. O erro fica logado no Vercel pra investigarmos.
  }

  return NextResponse.json({ ok: true, triggerEvent, contactId });
}

// GET pra teste manual — verifica se o endpoint tá no ar.
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/cal',
    status: 'live',
    method: 'POST expected from Cal.com',
  });
}
