import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  findContactByEmail,
  addTagsToExistingContact,
  removeTagFromContact,
  addNoteToContact,
} from '@/lib/activecampaign';
import { db, meetings, people, statuses } from '@/db';
import { logActivity } from '@/lib/crm';
import { syncCompanyFromPeople } from '@/lib/crm-sync';
import { eq, and, sql } from 'drizzle-orm';

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

  // 2. Verifica assinatura HMAC.
  //    Modo de operacao por env:
  //
  //    CAL_WEBHOOK_SECRET ausente + CAL_REQUIRE_SECRET != "true":
  //      -> modo PERMISSIVO (default). Aceita sem assinatura, com warning
  //         ruidoso. Comportamento igual ao que existia antes da auditoria.
  //
  //    CAL_WEBHOOK_SECRET ausente + CAL_REQUIRE_SECRET = "true":
  //      -> modo STRICT. Recusa com 501 Not Implemented. Habilitar APOS
  //         confirmar que o secret esta configurado no Vercel + Cal.com.
  //
  //    CAL_WEBHOOK_SECRET presente:
  //      -> verifica HMAC sempre. Recusa requisicoes sem assinatura valida.
  const secret = process.env.CAL_WEBHOOK_SECRET;
  const requireSecret = process.env.CAL_REQUIRE_SECRET === 'true';

  if (!secret) {
    if (requireSecret) {
      console.error(
        '[cal-webhook] CAL_REQUIRE_SECRET=true mas CAL_WEBHOOK_SECRET ausente — recusando',
      );
      return NextResponse.json(
        { error: 'webhook_not_configured' },
        { status: 501 },
      );
    }
    console.warn(
      '[cal-webhook] CAL_WEBHOOK_SECRET nao configurada — modo permissivo. Configure no Vercel + ative CAL_REQUIRE_SECRET=true pra strict.',
    );
  } else {
    const signature = request.headers.get('x-cal-signature-256');
    if (!verifySignature(rawBody, signature, secret)) {
      console.error('[cal-webhook] Invalid signature');
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
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

      // CRM Boldfy (dual-write) — popula tabela meetings + activity cal_scheduled.
      // Failure não é crítica — Folk e AC já receberam.
      try {
        // Match em 2 níveis pro Cal: email primário OU já em alternate_emails
        // (caso anterior já tenha enriquecido). Quando achar, garante que o
        // email do attendee fica em alternate_emails pra futuros matches Folk.
        const emailLower = email.toLowerCase();
        let personRow = await db.select({ id: people.id, email: people.email, metadata: people.metadata, companyId: people.companyId })
          .from(people)
          .where(eq(people.email, emailLower))
          .limit(1);

        if (!personRow[0]) {
          personRow = await db.select({ id: people.id, email: people.email, metadata: people.metadata, companyId: people.companyId })
            .from(people)
            .where(sql`${people.metadata}->'alternate_emails' @> ${JSON.stringify([emailLower])}::jsonb`)
            .limit(1);
        }

        // Se o attendee email é diferente do email primário, registra como alternativo
        if (personRow[0] && personRow[0].email !== emailLower) {
          const meta = (personRow[0].metadata as Record<string, unknown> | null) ?? {};
          const existing = Array.isArray(meta.alternate_emails) ? (meta.alternate_emails as string[]) : [];
          if (!existing.includes(emailLower)) {
            await db.update(people)
              .set({
                metadata: { ...meta, alternate_emails: [...existing, emailLower], cal_attendee_email: emailLower },
                updatedAt: new Date(),
              })
              .where(eq(people.id, personRow[0].id));
          }
        }

        if (personRow[0] && payload.startTime) {
          // Upsert meeting por cal_event_id (uid)
          const calEventId = payload.uid;
          if (calEventId) {
            const existingMeeting = await db.select({ id: meetings.id })
              .from(meetings)
              .where(eq(meetings.calEventId, calEventId))
              .limit(1);

            if (existingMeeting[0]) {
              await db.update(meetings).set({
                title: payload.title ?? 'Demo',
                scheduledAt: new Date(payload.startTime),
                status: 'scheduled',
                updatedAt: new Date(),
              }).where(eq(meetings.id, existingMeeting[0].id));
            } else {
              await db.insert(meetings).values({
                personId: personRow[0].id,
                calEventId,
                title: payload.title ?? 'Demo Boldfy',
                scheduledAt: new Date(payload.startTime),
                durationMin: payload.endTime
                  ? Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000)
                  : 30,
                status: 'scheduled',
              });
            }
          }

          // Activity (lead score +30)
          await logActivity({
            personId: personRow[0].id,
            type: 'cal_scheduled',
            source: 'cal',
            data: {
              cal_uid: payload.uid,
              start: payload.startTime,
              title: payload.title,
            },
          });

          // Auto-promove pessoa pra "Reunião marcada" se essa coluna existir.
          // Se Clara renomeou ou apagou, vira no-op silencioso.
          const reuniaoStatus = await db
            .select({ id: statuses.id })
            .from(statuses)
            .where(and(eq(statuses.kind, 'person'), eq(statuses.label, 'Reunião marcada')))
            .limit(1);

          if (reuniaoStatus[0]) {
            await db
              .update(people)
              .set({ statusId: reuniaoStatus[0].id, updatedAt: new Date() })
              .where(eq(people.id, personRow[0].id));

            await logActivity({
              personId: personRow[0].id,
              type: 'status_change',
              weight: 0,
              source: 'system',
              data: { toLabel: 'Reunião marcada', reason: 'cal_scheduled_auto' },
            });

            // Propaga pra empresa (mai/2026 — antes esse caminho esquecia de
            // chamar a sync, então empresa ficava parada quando Cal marcava
            // a demo. Caso reportado pela Clara: Lorena/Abecom).
            if (personRow[0].companyId) {
              await syncCompanyFromPeople(personRow[0].companyId);
            }
          }
        }
      } catch (crmErr) {
        console.error('[cal-webhook] CRM dual-write error (non-blocking):', crmErr);
      }
    } else if (triggerEvent === 'BOOKING_CANCELLED') {
      // Demo cancelada → volta pra aguardando, marca tag de cancelamento
      await Promise.allSettled([
        removeTagFromContact(contactId, 'Demo: Agendada'),
        addTagsToExistingContact(contactId, [
          'Demo: Cancelada',
          'Demo: Aguardando agendamento',
        ]),
      ]);

      // CRM Boldfy: marca meeting como cancelled + activity
      try {
        if (payload.uid) {
          await db.update(meetings)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(meetings.calEventId, payload.uid));
        }
        const personRow = await db.select({ id: people.id })
          .from(people)
          .where(eq(people.email, email.toLowerCase()))
          .limit(1);
        if (personRow[0]) {
          await logActivity({
            personId: personRow[0].id,
            type: 'cal_cancelled',
            source: 'cal',
            data: { cal_uid: payload.uid },
          });
        }
      } catch (crmErr) {
        console.error('[cal-webhook] CRM cancel error (non-blocking):', crmErr);
      }
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

      // CRM Boldfy: atualiza scheduled_at do meeting
      try {
        if (payload.uid && payload.startTime) {
          await db.update(meetings)
            .set({
              scheduledAt: new Date(payload.startTime),
              status: 'scheduled',
              updatedAt: new Date(),
            })
            .where(eq(meetings.calEventId, payload.uid));
        }
      } catch (crmErr) {
        console.error('[cal-webhook] CRM reschedule error (non-blocking):', crmErr);
      }
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
