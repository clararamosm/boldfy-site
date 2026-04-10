/**
 * ActiveCampaign API v3 integration.
 *
 * Used to sync contacts from the Boldfy site (proposal builder, forms, etc.)
 * into ActiveCampaign for email marketing and automation.
 */

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL; // e.g. https://boldfy76930.api-us1.com
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

function acHeaders() {
  return {
    'Api-Token': AC_API_KEY!,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ACContactInput = {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  // Proposal data (optional)
  proposalSummary?: string;
  tags?: string[];
};

type ACContactResponse = {
  contact: { id: string; email: string };
};

/* -------------------------------------------------------------------------- */
/*  Create or update contact (sync)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new contact or updates an existing one (matched by email).
 * Uses the /contact/sync endpoint which is idempotent.
 */
export async function syncContact(input: ACContactInput): Promise<string | null> {
  if (!AC_API_URL || !AC_API_KEY) {
    console.error('[activecampaign] API URL or KEY not configured');
    return null;
  }

  try {
    const res = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        contact: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName ?? '',
          phone: input.phone ?? '',
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[activecampaign] Error syncing contact:', res.status, errText);
      return null;
    }

    const data = (await res.json()) as ACContactResponse;
    const contactId = data.contact.id;

    // Add tags (non-blocking — don't fail if tags don't work)
    const allTags = [...(input.tags ?? [])];
    if (input.origem) allTags.push(input.origem);
    if (input.empresa && input.empresa !== '—') allTags.push(`empresa:${input.empresa}`);
    if (input.cargo && input.cargo !== '—') allTags.push(`cargo:${input.cargo}`);

    if (allTags.length > 0) {
      await addTagsToContact(contactId, allTags).catch((err) => {
        console.error('[activecampaign] Error adding tags:', err);
      });
    }

    return contactId;
  } catch (error) {
    console.error('[activecampaign] Error:', error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Ensures tags exist in ActiveCampaign, then links them to the contact.
 */
async function addTagsToContact(contactId: string, tagNames: string[]): Promise<void> {
  for (const tagName of tagNames) {
    try {
      // 1. Find or create the tag
      const tagId = await findOrCreateTag(tagName);
      if (!tagId) continue;

      // 2. Link tag to contact
      await fetch(`${AC_API_URL}/api/3/contactTags`, {
        method: 'POST',
        headers: acHeaders(),
        body: JSON.stringify({
          contactTag: {
            contact: contactId,
            tag: tagId,
          },
        }),
      });
    } catch (err) {
      console.error(`[activecampaign] Error adding tag "${tagName}":`, err);
    }
  }
}

async function findOrCreateTag(tagName: string): Promise<string | null> {
  // Search for existing tag
  const searchRes = await fetch(
    `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`,
    { headers: acHeaders() },
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    const existing = data.tags?.find(
      (t: { tag: string }) => t.tag.toLowerCase() === tagName.toLowerCase(),
    );
    if (existing) return existing.id;
  }

  // Create new tag
  const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
    method: 'POST',
    headers: acHeaders(),
    body: JSON.stringify({
      tag: {
        tag: tagName,
        tagType: 'contact',
        description: `Auto-created from Boldfy site`,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    console.error(`[activecampaign] Error creating tag "${tagName}":`, createRes.status, errText);
    return null;
  }

  const created = await createRes.json();
  return created.tag?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Notes (attach proposal details to contact)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Adds a note to a contact with the proposal summary.
 */
export async function addNoteToContact(contactId: string, note: string): Promise<void> {
  if (!AC_API_URL || !AC_API_KEY) return;

  try {
    const res = await fetch(`${AC_API_URL}/api/3/notes`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        note: {
          note,
          relid: contactId,
          reltype: 'Subscriber',
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[activecampaign] Error adding note:', res.status, errText);
    }
  } catch (err) {
    console.error('[activecampaign] Error adding note:', err);
  }
}
