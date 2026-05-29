/**
 * Sync Nosso CRM → ActiveCampaign.
 *
 * Quando muda status no CRM, atualiza tag "Status: <label>" no contato AC
 * (e remove tags antigas do mesmo prefixo). Tags são gatilho de automações
 * no AC (cadências, listas, segmentação).
 *
 * Mai/2026 ciclo 3.2 — Refator de robustez:
 *  - Idempotência (no-op se tag certa já está lá)
 *  - Otimização: lê tags atuais do AC e calcula diff (em vez de tentar
 *    remover N tags brute force, remove só as que existem)
 *  - Retry com backoff exponencial (3 tentativas: 1s, 2s, 4s)
 *  - Fallback alternate_emails quando email primário não acha no AC
 *  - Activity de auditoria no CRM (ac_sync_ok ou ac_sync_failed)
 *
 * Convenção de tag:
 *   Person status → "Status: <label>"   (ex: "Status: Ativo", "Status: Quente")
 *   Company status → "Pipeline: <label>" (ex: "Pipeline: Quero prospectar")
 */

import {
  findContactByEmail,
  getContactTags,
  addTagsToExistingContact,
  removeTagFromContact,
} from './activecampaign';
import { db, people, activities, statuses } from '@/db';
import { eq, sql } from 'drizzle-orm';
import type { Status } from '@/db';

const PERSON_TAG_PREFIX = 'Status: ';
const COMPANY_TAG_PREFIX = 'Pipeline: ';

/* -------------------------------------------------------------------------- */
/*  Retry helper                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Retry com backoff exponencial pra calls do AC. Total max ~7s (1+2+4).
 * Retorna result da última tentativa (ok=true) ou null se todas falharam.
 */
async function retry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) {
        console.error(`[ac-sync] ${label} failed after ${attempts} attempts:`, err);
        return null;
      }
      const wait = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Contact resolver com fallback alternate_emails                            */
/* -------------------------------------------------------------------------- */

async function resolveContactId(personId: string): Promise<{ contactId: string; email: string } | null> {
  const [p] = await db
    .select({
      acContactId: people.acContactId,
      email: people.email,
      metadata: people.metadata,
    })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);

  if (!p) return null;

  // Preferência: contactId cacheado em people.acContactId
  if (p.acContactId) return { contactId: p.acContactId, email: p.email ?? '' };

  // Sem email primário não dá pra resolver contato no AC (LinkedIn Lead).
  // Tenta os alternates abaixo; se nenhum existir, retorna null.
  let cid: string | null = null;
  if (p.email) {
    cid = await retry(() => findContactByEmail(p.email!), 'findContactByEmail(primary)');
    if (cid) return { contactId: cid, email: p.email };
  }

  // Fallback: alternate_emails em metadata (populado por Cal webhook e Folk import)
  const m = p.metadata as { alternate_emails?: string[] } | null;
  const alternates = m?.alternate_emails ?? [];
  for (const altEmail of alternates) {
    cid = await retry(() => findContactByEmail(altEmail), `findContactByEmail(alt:${altEmail})`);
    if (cid) return { contactId: cid, email: altEmail };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Log activity de auditoria do sync                                         */
/* -------------------------------------------------------------------------- */

async function logSyncActivity(
  personId: string | null,
  companyId: string | null,
  ok: boolean,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(activities).values({
      personId,
      companyId,
      type: ok ? 'ac_sync_ok' : 'ac_sync_failed',
      weight: 0,
      source: 'system',
      data,
    });
  } catch (err) {
    console.error('[ac-sync] failed to log audit activity:', err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Diff de tags + apply                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Calcula e aplica diff de tags pra um contato:
 *  - Lê tags atuais do AC
 *  - Identifica tags com prefixo que NÃO são a nova → remove
 *  - Se a nova ainda não está → adiciona
 *
 * Retorna { added, removed } pra auditoria. Idempotente: se tag certa já
 * existe e nenhuma antiga existe, retorna { added: 0, removed: 0 } sem call.
 */
async function applyTagDiff(
  contactId: string,
  prefix: string,
  newTag: string,
): Promise<{ added: number; removed: number; tagsRead: boolean }> {
  const currentTags = await retry(() => getContactTags(contactId), `getContactTags(${contactId})`);
  if (currentTags === null) {
    return { added: 0, removed: 0, tagsRead: false };
  }

  const oldTagsWithPrefix = currentTags.filter((t) => t.startsWith(prefix) && t !== newTag);
  const hasNewAlready = currentTags.includes(newTag);

  // Remove antigas em paralelo
  let removedCount = 0;
  if (oldTagsWithPrefix.length > 0) {
    const results = await Promise.allSettled(
      oldTagsWithPrefix.map((t) => retry(() => removeTagFromContact(contactId, t), `removeTag(${t})`)),
    );
    removedCount = results.filter((r) => r.status === 'fulfilled' && r.value !== null).length;
  }

  // Adiciona nova (só se não tem)
  let addedCount = 0;
  if (!hasNewAlready) {
    const r = await retry(() => addTagsToExistingContact(contactId, [newTag]), `addTag(${newTag})`);
    if (r !== null) addedCount = 1;
  }

  return { added: addedCount, removed: removedCount, tagsRead: true };
}

/* -------------------------------------------------------------------------- */
/*  Public APIs                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Sync de status de Person → tag no AC. No-op silencioso se a pessoa não
 * tem contato no AC. Loga activity de auditoria sempre.
 */
export async function syncPersonStatusToAC(personId: string, newStatus: Status): Promise<void> {
  const resolved = await resolveContactId(personId);
  if (!resolved) {
    await logSyncActivity(personId, null, false, {
      reason: 'no_ac_contact',
      newStatus: newStatus.label,
    });
    return;
  }

  // Cacheia acContactId no people pra próxima sync ser direto
  if (resolved.contactId) {
    await db.update(people)
      .set({ acContactId: resolved.contactId, updatedAt: new Date() })
      .where(sql`${people.id} = ${personId} AND ${people.acContactId} IS NULL`);
  }

  const newTag = `${PERSON_TAG_PREFIX}${newStatus.label}`;
  const diff = await applyTagDiff(resolved.contactId, PERSON_TAG_PREFIX, newTag);

  const ok = diff.tagsRead && (diff.added > 0 || diff.removed > 0
    // No-op (já estava certo) também conta como sucesso
    || (diff.added === 0 && diff.removed === 0));

  await logSyncActivity(personId, null, ok, {
    reason: ok ? 'applied' : 'failed_to_apply',
    newStatus: newStatus.label,
    newTag,
    added: diff.added,
    removed: diff.removed,
    contactId: resolved.contactId,
    matchedEmail: resolved.email,
  });
}

/**
 * Sync de status de Company → tag no AC. Atualiza TODAS as pessoas linkadas
 * (AC só tem conceito de contato, não empresa). Cada pessoa fica com tag
 * "Pipeline: <label>".
 *
 * Falha em uma pessoa não bloqueia as outras. Activity de auditoria
 * por pessoa.
 */
export async function syncCompanyStatusToAC(companyId: string, newStatus: Status): Promise<void> {
  const peopleRows = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.companyId, companyId));

  if (peopleRows.length === 0) {
    await logSyncActivity(null, companyId, false, {
      reason: 'no_people_linked',
      newStatus: newStatus.label,
    });
    return;
  }

  const newTag = `${COMPANY_TAG_PREFIX}${newStatus.label}`;

  for (const p of peopleRows) {
    const resolved = await resolveContactId(p.id);
    if (!resolved) {
      await logSyncActivity(p.id, companyId, false, {
        reason: 'no_ac_contact',
        newStatus: newStatus.label,
      });
      continue;
    }

    if (resolved.contactId) {
      await db.update(people)
        .set({ acContactId: resolved.contactId, updatedAt: new Date() })
        .where(sql`${people.id} = ${p.id} AND ${people.acContactId} IS NULL`);
    }

    const diff = await applyTagDiff(resolved.contactId, COMPANY_TAG_PREFIX, newTag);
    const ok = diff.tagsRead;

    await logSyncActivity(p.id, companyId, ok, {
      reason: ok ? 'applied' : 'failed_to_apply',
      newStatus: newStatus.label,
      newTag,
      added: diff.added,
      removed: diff.removed,
      contactId: resolved.contactId,
      matchedEmail: resolved.email,
    });
  }
}
