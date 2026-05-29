/**
 * Webhook receiver pro ActiveCampaign.
 *
 * Recebe eventos de email/contato em tempo real e cria activities
 * correspondentes na timeline do CRM.
 *
 * Eventos suportados (mai/2026):
 *   - sent                  → activity 'email_sent' (peso 0)
 *   - open                  → activity 'email_open' (peso +1)
 *   - click                 → activity 'email_click' (peso +3)
 *   - bounce                → activity 'email_bounce' (peso 0) + flag em metadata
 *   - unsubscribe           → activity 'email_unsubscribed' (peso 0)
 *   - update (contato)      → ignorado (vem rico demais e não acrescenta sinal)
 *   - tag_add/tag_remove    → ignorado (já espelhamos via ac-sync ao mover status)
 *
 * Configuração no painel AC: Settings → Developer → Manage Webhooks →
 *   - URL: https://www.boldfy.com.br/api/webhooks/ac
 *   - Sources: Public + Admin + Automations
 *   - Events: Sends, Opens, Clicks, Bounces, Unsubscribes
 *   - (HMAC signature: AC NÃO assina webhooks por padrão — validação via
 *      secret query param ?key=AC_WEBHOOK_SECRET é o que funciona na maioria
 *      das contas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, people, activities } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { automationForTag, cadenceFromCompletedTag } from '@/lib/ac-tag-mapping';

const AC_WEBHOOK_SECRET = process.env.AC_WEBHOOK_SECRET;

type ACWebhookPayload = {
  type: string;
  date_time?: string;
  initiated_from?: string;
  initiated_by?: string;
  list?: string;
  contact?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  campaign?: {
    campaignid?: string;
    messageid?: string;
    name?: string;
    subject?: string;
    sdate?: string;
  };
  // Pra eventos de open/click vêm em estruturas próprias
  link?: {
    url?: string;
  };
  // Bounce
  bounce_type?: string;
  // Tag add/remove — AC manda objeto contact_tag
  contact_tag?: {
    tag?: string;
    id?: string;
  };
  tag?: {
    tag?: string;
    id?: string;
    name?: string;
  };
  // Genérico — AC tem vários formatos
  [k: string]: unknown;
};

/**
 * Lookup person por acContactId (rápido, indexado) ou email (fallback).
 * Retorna null se não acha — webhook acaba virando no-op (ignorado).
 */
async function findPersonByContact(contactId?: string, email?: string): Promise<{ id: string } | null> {
  if (contactId) {
    const [byId] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.acContactId, contactId))
      .limit(1);
    if (byId) return byId;
  }
  if (email) {
    const [byEmail] = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.email, email.toLowerCase()))
      .limit(1);
    if (byEmail) {
      // Cache contactId pra próxima vez ser direto
      if (contactId) {
        await db.update(people)
          .set({ acContactId: contactId, updatedAt: new Date() })
          .where(sql`${people.id} = ${byEmail.id} AND ${people.acContactId} IS NULL`);
      }
      return byEmail;
    }
  }
  return null;
}

/**
 * Mapeia tipo do webhook AC → tipo de activity no CRM + peso + data.
 * Retorna null se evento não deve gerar activity (ignorado).
 */
function mapEvent(payload: ACWebhookPayload): { type: string; weight: number; data: Record<string, unknown> } | null {
  const t = payload.type?.toLowerCase();
  const baseData = {
    campaign_id: payload.campaign?.campaignid,
    campaign_name: payload.campaign?.name,
    message_id: payload.campaign?.messageid,
    message_subject: payload.campaign?.subject,
    initiated_from: payload.initiated_from,
    initiated_by: payload.initiated_by,
    ac_event_date: payload.date_time,
    via: 'ac_webhook',
  };

  switch (t) {
    // Sent — pode vir como 'sent', 'send', ou 'campaign_starts_sending' dependendo
    // do tipo (broadcast vs automation step). Se broadcast, payload não tem
    // contact e findPersonByContact retorna null → endpoint ignora gracefully.
    case 'sent':
    case 'send':
    case 'campaign_starts_sending':
      return { type: 'email_sent', weight: 0, data: baseData };
    case 'open':
    case 'campaign_opened':
      return { type: 'email_open', weight: 1, data: baseData };
    case 'click':
    case 'link_clicked':
      return {
        type: 'email_click',
        weight: 3,
        data: { ...baseData, url: payload.link?.url },
      };
    case 'forward':
    case 'campaign_forwarded':
      return { type: 'email_forwarded', weight: 8, data: baseData };
    case 'reply':
    case 'email_replies':
    case 'email_reply':
      return { type: 'email_reply', weight: 15, data: baseData };
    case 'bounce':
    case 'email_bounces':
      return {
        type: 'email_bounce',
        weight: 0,
        data: { ...baseData, bounce_type: payload.bounce_type ?? 'soft' },
      };
    case 'unsubscribe':
    case 'contact_unsubscription':
      // Task 1 (mai/2026): unsubscribe agora vira 'lead_unsubscribed' (semântica
      // de pessoa, não de email) — pois também flipa people.unsubscribed=true.
      // O type antigo 'email_unsubscribed' continua existindo pra activities
      // históricas. Render bonito vem na Task 2.
      return { type: 'lead_unsubscribed', weight: 0, data: baseData };
    case 'subscribe':
    case 'contact_subscribed':
      // Resubscribe via UI do AC (raro — usuário normalmente volta via form
      // novo no site, que cai em recordLeadFromForm). Flipa flag se a pessoa
      // estava unsubscribed.
      return { type: 'lead_resubscribed', weight: 0, data: baseData };
    case 'contact_tag_added':
    case 'contact_tag':
    case 'tag': {
      // Tag adicionada — consulta mapas em ac-tag-mapping.ts.
      //
      // Duas famílias de tags são interpretadas:
      //
      //   1. Tag de form (entrada) — mapeada em AC_TAG_TO_AUTOMATION
      //      → activity 'automation_started' ("🔄 Entrou na cadência X")
      //
      //   2. Tag com prefixo "Concluiu: " (saída) — detecção via prefixo
      //      → activity 'cadence_completed' ("✓ Concluiu cadência: X")
      //      Aplicada no penúltimo passo da automation, antes do unsubscribe.
      //
      // Tag não mapeada em nenhum dos dois é ignorada (não polui timeline).
      const tagName = payload.contact_tag?.tag
        ?? payload.tag?.tag
        ?? payload.tag?.name
        ?? '';
      if (!tagName) return null;

      // Tenta detectar cadência concluída primeiro (mais específico).
      const completedCadence = cadenceFromCompletedTag(tagName);
      if (completedCadence) {
        return {
          type: 'cadence_completed',
          weight: 0,
          data: {
            ...baseData,
            cadence_name: completedCadence,
            tag_that_triggered: tagName,
          },
        };
      }

      // Tenta entrada na cadência (mapa de Form: X).
      const automationName = automationForTag(tagName);
      if (automationName) {
        return {
          type: 'automation_started',
          weight: 0,
          data: { ...baseData, automation_name: automationName, tag_that_triggered: tagName },
        };
      }

      // Tag não reconhecida em nenhuma das famílias — ignora.
      return null;
    }
    default:
      return null; // ignored event
  }
}

/**
 * Idempotência básica: AC pode reenviar o mesmo webhook. Se já existe
 * activity com mesma assinatura no último 1min, skip.
 */
async function alreadyLogged(personId: string, type: string, campaignId?: string, eventDate?: string): Promise<boolean> {
  if (!eventDate) return false;
  try {
    const cutoff = new Date(Date.now() - 60_000);
    const rows = await db
      .select({ id: activities.id })
      .from(activities)
      .where(sql`
        ${activities.personId} = ${personId}
        AND ${activities.type} = ${type}
        AND ${activities.createdAt} > ${cutoff}
        AND ${activities.data}->>'ac_event_date' = ${eventDate}
        AND ${activities.data}->>'campaign_id' = ${campaignId ?? null}
      `)
      .limit(1);
    return rows.length > 0;
  } catch {
    return false; // se a query quebra, deixa loggar (preferível duplicar do que perder)
  }
}

export async function POST(req: NextRequest) {
  console.log('[ac-webhook] POST received', { url: req.url, contentType: req.headers.get('content-type') });

  // Validação por secret query param (?key=AC_WEBHOOK_SECRET).
  if (AC_WEBHOOK_SECRET) {
    const key = req.nextUrl.searchParams.get('key');
    if (key !== AC_WEBHOOK_SECRET) {
      console.warn('[ac-webhook] UNAUTHORIZED — key mismatch', { gotKey: key?.slice(0, 8) + '...', expectedPrefix: AC_WEBHOOK_SECRET.slice(0, 8) + '...' });
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  let payload: ACWebhookPayload;
  let rawDump: Record<string, unknown> | null = null;
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      payload = await req.json();
      rawDump = { format: 'json', body: payload };
    } else {
      const formData = await req.formData();
      const flatEntries = Object.fromEntries(formData.entries());
      payload = flatEntries as unknown as ACWebhookPayload;
      // Reconstrói nested objects (contact[email] → contact.email)
      const contact: Record<string, string> = {};
      const campaign: Record<string, string> = {};
      const link: Record<string, string> = {};
      for (const [k, v] of Array.from(formData.entries())) {
        if (typeof v !== 'string') continue;
        const m = k.match(/^(contact|campaign|link)\[(\w+)\]$/);
        if (m) {
          if (m[1] === 'contact') contact[m[2]] = v;
          else if (m[1] === 'campaign') campaign[m[2]] = v;
          else if (m[1] === 'link') link[m[2]] = v;
        }
      }
      if (Object.keys(contact).length > 0) payload.contact = contact;
      if (Object.keys(campaign).length > 0) payload.campaign = campaign;
      if (Object.keys(link).length > 0) payload.link = link;
      rawDump = { format: 'form', flatKeys: Object.keys(flatEntries), reconstructed: { contact, campaign, link } };
    }
  } catch (err) {
    console.error('[ac-webhook] PARSE FAILED:', err);
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }

  console.log('[ac-webhook] PAYLOAD parsed', {
    type: payload.type,
    contactId: payload.contact?.id,
    contactEmail: payload.contact?.email,
    campaignName: payload.campaign?.name,
    campaignId: payload.campaign?.campaignid,
    rawDump,
  });

  const event = mapEvent(payload);
  if (!event) {
    console.log('[ac-webhook] IGNORED — event type not mapped', { type: payload.type });
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const person = await findPersonByContact(payload.contact?.id, payload.contact?.email);
  if (!person) {
    console.log('[ac-webhook] IGNORED — person not in CRM', {
      contactId: payload.contact?.id,
      email: payload.contact?.email,
      mappedType: event.type,
    });
    return NextResponse.json({ ok: true, ignored: 'person_not_in_crm', email: payload.contact?.email });
  }

  // Dedup por (personId + type + campaign_id + ac_event_date)
  const dup = await alreadyLogged(person.id, event.type, payload.campaign?.campaignid, payload.date_time);
  if (dup) {
    console.log('[ac-webhook] IGNORED — duplicate', { personId: person.id, type: event.type });
    return NextResponse.json({ ok: true, ignored: 'duplicate' });
  }

  try {
    await db.insert(activities).values({
      personId: person.id,
      type: event.type,
      weight: event.weight,
      source: 'email',
      data: event.data,
    });
    console.log('[ac-webhook] OK — activity created', { personId: person.id, type: event.type, weight: event.weight });

    // Pra bounce/unsubscribe, também atualiza flag em metadata.ac_extra
    // pro display (pill vermelho no header).
    if (event.type === 'email_bounce') {
      await db.update(people).set({
        metadata: sql`
          jsonb_set(
            COALESCE(${people.metadata}, '{}'::jsonb),
            '{ac_extra,bounced_${sql.raw(payload.bounce_type === 'hard' ? 'hard' : 'soft')}}',
            'true'::jsonb
          )
        `,
        updatedAt: new Date(),
      }).where(eq(people.id, person.id));
    }

    // Task 1: unsubscribe/resubscribe flipam flag dedicada em people.
    if (event.type === 'lead_unsubscribed') {
      await db.update(people).set({
        unsubscribed: true,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(people.id, person.id));
    }
    if (event.type === 'lead_resubscribed') {
      await db.update(people).set({
        unsubscribed: false,
        resubscribedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(people.id, person.id));
    }
  } catch (err) {
    console.error('[ac-webhook] DB INSERT FAILED:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type: event.type, personId: person.id });
}

// GET handler pra teste de saúde do endpoint. Manda 200 se está vivo.
// Útil pra confirmar que a URL responde antes de configurar webhook no AC.
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'ac-webhook',
    method_expected: 'POST',
    requires_secret: !!AC_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}
