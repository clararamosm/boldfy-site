/**
 * Server actions de Tag Manager (lead detail).
 *
 * fetchPersonTags(personId): puxa do AC + popula ac_tags denormalizado
 * addTagToPerson(personId, tagName): chama AC + atualiza array local
 * removeTagFromPerson(personId, tagName): chama AC + atualiza array local
 * listAvailableTags(): lista todas as tags do AC pra autocomplete
 */

'use server';

import { db, people } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  getContactTags,
  addTagsToExistingContact,
  removeTagFromContact as acRemoveTag,
  listAllTags,
  findContactByEmail,
} from '@/lib/activecampaign';

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function getAcContactId(personId: string): Promise<string | null> {
  const [p] = await db
    .select({ acContactId: people.acContactId, email: people.email })
    .from(people)
    .where(eq(people.id, personId))
    .limit(1);
  if (!p) return null;
  if (p.acContactId) return p.acContactId;
  // LinkedIn Leads podem não ter email — sem email, sem contato no AC.
  if (!p.email) return null;
  return findContactByEmail(p.email);
}

export async function fetchPersonTags(personId: string): Promise<Result<string[]>> {
  try {
    const contactId = await getAcContactId(personId);
    if (!contactId) return { ok: true, data: [] };

    const tags = await getContactTags(contactId);

    // Persiste no denormalizado pra speed em outras queries
    await db
      .update(people)
      .set({ acTags: tags, updatedAt: new Date() })
      .where(eq(people.id, personId));

    return { ok: true, data: tags };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function addTagToPerson(personId: string, tagName: string): Promise<Result<string[]>> {
  const name = tagName.trim();
  if (name.length === 0) return { ok: false, error: 'Tag vazia' };
  if (name.length > 120) return { ok: false, error: 'Tag muito longa (max 120 chars)' };

  try {
    const contactId = await getAcContactId(personId);
    if (!contactId) return { ok: false, error: 'Esta pessoa não tem contato no ActiveCampaign.' };

    await addTagsToExistingContact(contactId, [name]);

    // Refresh denormalizado
    const tags = await getContactTags(contactId);
    await db
      .update(people)
      .set({ acTags: tags, updatedAt: new Date() })
      .where(eq(people.id, personId));

    revalidatePath(`/internal/crm/people/${personId}`);
    return { ok: true, data: tags };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function removeTagFromPerson(personId: string, tagName: string): Promise<Result<string[]>> {
  try {
    const contactId = await getAcContactId(personId);
    if (!contactId) return { ok: false, error: 'Esta pessoa não tem contato no ActiveCampaign.' };

    await acRemoveTag(contactId, tagName);

    const tags = await getContactTags(contactId);
    await db
      .update(people)
      .set({ acTags: tags, updatedAt: new Date() })
      .where(eq(people.id, personId));

    revalidatePath(`/internal/crm/people/${personId}`);
    return { ok: true, data: tags };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listAvailableTags(): Promise<Result<string[]>> {
  try {
    const tags = await listAllTags();
    return { ok: true, data: tags };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
