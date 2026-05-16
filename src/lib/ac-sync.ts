/**
 * Sync simples Nosso CRM → ActiveCampaign.
 *
 * Quando muda status no CRM, adiciona tag "Status: <label>" no contato AC.
 * Sem retry queue por enquanto (Sprint 3c implementa) — falha apenas loga.
 *
 * Convenção de tag:
 *   Person status → tag "Status: Ativo" | "Status: Lead" | "Status: Quente" (default)
 *   Company status → tag "Pipeline: Fechado" pra is_terminal+color=green
 *                     tag "Pipeline: Perdido" pra is_terminal+não-green
 *                     senão, tag "Pipeline: <label>"
 *
 * Tags antigas com mesmo prefixo são removidas pra evitar acúmulo (ex: lead
 * que era "Status: Lead" agora vira "Status: Quente" — remove a antiga).
 */

import { findContactByEmail, addTagsToExistingContact, removeTagFromContact } from './activecampaign';
import { db, people, statuses } from '@/db';
import { eq } from 'drizzle-orm';
import type { Status } from '@/db';

const PERSON_TAG_PREFIX = 'Status: ';
const COMPANY_TAG_PREFIX = 'Pipeline: ';

/**
 * Sincroniza tag no AC quando status de Person muda.
 * No-op silencioso se a pessoa não tem ac_contact_id.
 */
export async function syncPersonStatusToAC(personId: string, newStatus: Status): Promise<void> {
  try {
    const [p] = await db
      .select({ acContactId: people.acContactId, email: people.email })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!p) return;

    // Resolve contactId — preferir o que já temos cacheado
    let contactId = p.acContactId ?? null;
    if (!contactId) {
      contactId = await findContactByEmail(p.email);
      if (!contactId) {
        console.warn('[ac-sync] Person não tem AC contact:', p.email);
        return;
      }
    }

    // Remove tags antigas do mesmo prefixo
    const allPersonStatuses = await db
      .select({ label: statuses.label })
      .from(statuses)
      .where(eq(statuses.kind, 'person'));

    await Promise.allSettled(
      allPersonStatuses
        .filter((s) => s.label !== newStatus.label)
        .map((s) => removeTagFromContact(contactId!, `${PERSON_TAG_PREFIX}${s.label}`)),
    );

    // Adiciona a nova
    await addTagsToExistingContact(contactId, [`${PERSON_TAG_PREFIX}${newStatus.label}`]);
  } catch (err) {
    console.error('[ac-sync] syncPersonStatusToAC failed:', err);
  }
}

/**
 * Sincroniza tag no AC quando status de Company muda. Encontra TODAS as
 * pessoas da company e adiciona tag pipeline em cada uma (porque AC só tem
 * conceito de contato, não empresa).
 */
export async function syncCompanyStatusToAC(companyId: string, newStatus: Status): Promise<void> {
  try {
    const peopleRows = await db
      .select({ acContactId: people.acContactId, email: people.email })
      .from(people)
      .where(eq(people.companyId, companyId));

    if (peopleRows.length === 0) return;

    const allCompanyStatuses = await db
      .select({ label: statuses.label })
      .from(statuses)
      .where(eq(statuses.kind, 'company'));

    for (const p of peopleRows) {
      let contactId = p.acContactId ?? null;
      if (!contactId) {
        contactId = await findContactByEmail(p.email);
        if (!contactId) continue;
      }

      await Promise.allSettled(
        allCompanyStatuses
          .filter((s) => s.label !== newStatus.label)
          .map((s) => removeTagFromContact(contactId!, `${COMPANY_TAG_PREFIX}${s.label}`)),
      );

      await addTagsToExistingContact(contactId, [`${COMPANY_TAG_PREFIX}${newStatus.label}`]);
    }
  } catch (err) {
    console.error('[ac-sync] syncCompanyStatusToAC failed:', err);
  }
}
