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
  origem?: string;
  // Proposal data (optional)
  proposalSummary?: string;
  tags?: string[];
  /**
   * Custom fields estruturados — vão pro AC como "Field Values" (não tags).
   * Aparecem na aba "Detalhes gerais" do contato, são pesquisáveis e
   * segmentáveis. Chave = perstag do field (identificador interno).
   *
   * Ex: { empresa: 'Boldfy', cargo: 'Founder', porte: '11-50' }
   *
   * Fields são criados automaticamente no AC no primeiro uso.
   */
  fields?: Record<string, string | number | undefined | null>;
};

type ACContactResponse = {
  contact: { id: string; email: string };
};

type ACFieldDefinition = {
  id: string;
  title: string; // label shown to user
  perstag: string; // internal identifier used in payloads
  type: 'text' | 'textarea' | 'dropdown' | 'multiselect' | 'date' | 'NULL';
};

/**
 * Mapping definitions for the custom fields we auto-create on first use.
 * Keys are the perstag (internal identifier), values have display title + type.
 *
 * Pra adicionar um novo field: só inclui aqui e passa em `input.fields` ao
 * chamar syncContact. O field é criado automaticamente na primeira chamada
 * que o usa.
 */
const CUSTOM_FIELDS: Record<string, { title: string; type: ACFieldDefinition['type'] }> = {
  empresa: { title: 'Empresa', type: 'text' },
  cargo: { title: 'Cargo', type: 'text' },
  porte: { title: 'Porte da empresa', type: 'text' },
  setor: { title: 'Setor', type: 'text' },
  objetivo_principal: { title: 'Objetivo principal', type: 'text' },
  como_conheceu: { title: 'Como conheceu', type: 'text' },
  total_mensal_proposta: { title: 'Total mensal da proposta', type: 'text' },
  url_proposta: { title: 'URL da proposta', type: 'text' },
};

// Cache em memória (survive hot module reloads dentro da mesma lambda execution)
// Evita consultar /fields a cada request — field ID não muda.
const fieldIdCache: Record<string, string> = {};

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
    // Tags agora são APENAS categorização/segmentação (Form, Módulo,
    // Origem, Beta Tester, utm_*). Dados estruturados tipo empresa/cargo
    // viraram custom fields (campo `fields`).
    const allTags = [...(input.tags ?? [])];
    if (input.origem) allTags.push(input.origem);

    if (allTags.length > 0) {
      await addTagsToContact(contactId, allTags).catch((err) => {
        console.error('[activecampaign] Error adding tags:', err);
      });
    }

    // Set custom field values (non-blocking — don't fail if fields fail)
    if (input.fields) {
      await setContactFields(contactId, input.fields).catch((err) => {
        console.error('[activecampaign] Error setting fields:', err);
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
/*  Public helpers (used by webhooks / automations outside of form submits)    */
/* -------------------------------------------------------------------------- */

/**
 * Busca um contato no AC pelo email. Retorna o ID do primeiro match ou null.
 *
 * Usado pelos webhooks que recebem email do lead (tipo Cal.com) e precisam
 * achar o contato existente pra atualizar tags.
 */
export async function findContactByEmail(email: string): Promise<string | null> {
  if (!AC_API_URL || !AC_API_KEY) return null;

  try {
    const url = `${AC_API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { headers: acHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    const contact = (data.contacts ?? [])[0];
    return contact?.id ?? null;
  } catch (err) {
    console.error('[activecampaign] Error finding contact by email:', err);
    return null;
  }
}

/**
 * Adiciona tags a um contato existente. Wrapper publico de addTagsToContact.
 *
 * Cria as tags no AC caso ainda nao existam (find or create).
 */
export async function addTagsToExistingContact(
  contactId: string,
  tagNames: string[],
): Promise<void> {
  return addTagsToContact(contactId, tagNames);
}

/**
 * Remove uma tag de um contato (sem deletar a tag em si).
 *
 * Fluxo:
 *   1. Busca o ID da tag pelo nome.
 *   2. Lista as associacoes tag<->contato desse contato (contactTags).
 *   3. Encontra a associacao especifica desta tag e deleta.
 *
 * Silencioso: se a tag nao existe ou o contato nao tem ela, retorna sem erro.
 */
export async function removeTagFromContact(
  contactId: string,
  tagName: string,
): Promise<void> {
  if (!AC_API_URL || !AC_API_KEY) return;

  try {
    // 1. Find tag by name
    const tagId = await findTagByName(tagName);
    if (!tagId) return; // tag nem existe, nada pra remover

    // 2. List contactTags associations for this contact
    const listRes = await fetch(
      `${AC_API_URL}/api/3/contacts/${contactId}/contactTags`,
      { headers: acHeaders() },
    );
    if (!listRes.ok) return;

    const listData = await listRes.json();
    const associations = (listData.contactTags ?? []) as Array<{
      id: string;
      tag: string;
    }>;

    // 3. Find the association for this specific tag
    const association = associations.find((ct) => ct.tag === tagId);
    if (!association) return; // contato nao tem essa tag, ok

    // 4. Delete the contactTag association
    const deleteRes = await fetch(
      `${AC_API_URL}/api/3/contactTags/${association.id}`,
      { method: 'DELETE', headers: acHeaders() },
    );
    if (!deleteRes.ok) {
      const errText = await deleteRes.text().catch(() => '');
      console.error(
        `[activecampaign] Error removing tag "${tagName}":`,
        deleteRes.status,
        errText,
      );
    }
  } catch (err) {
    console.error(`[activecampaign] Error removing tag "${tagName}":`, err);
  }
}

/**
 * Variante de findOrCreateTag que so busca (nao cria). Retorna null se a tag
 * nao existe. Usado pra remoção de tag — nao faz sentido criar tag so pra
 * dizer que alguem nao a tem.
 */
async function findTagByName(tagName: string): Promise<string | null> {
  const searchRes = await fetch(
    `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`,
    { headers: acHeaders() },
  );

  if (!searchRes.ok) return null;

  const data = await searchRes.json();
  const existing = data.tags?.find(
    (t: { tag: string }) => t.tag.toLowerCase() === tagName.toLowerCase(),
  );
  return existing?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Custom Fields                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Descobre o ID de um custom field pelo seu perstag (identificador interno).
 * Se não existir ainda no AC, cria. Cache em memória pra evitar re-lookups.
 *
 * Perstag segue convenção UPPERCASE_SNAKE (ex: EMPRESA, CARGO, PORTE).
 * O AC normaliza automaticamente ao criar — aqui só uppercaseamos a key.
 */
async function findOrCreateField(
  perstag: string,
  title: string,
  type: ACFieldDefinition['type'] = 'text',
): Promise<string | null> {
  const normalizedPerstag = perstag.toUpperCase();

  if (fieldIdCache[normalizedPerstag]) {
    return fieldIdCache[normalizedPerstag];
  }

  // 1. Search existing fields (paginates; we grab first page of 100)
  try {
    const listRes = await fetch(`${AC_API_URL}/api/3/fields?limit=100`, {
      headers: acHeaders(),
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const existing = (data.fields ?? []).find(
        (f: { perstag: string; id: string }) =>
          f.perstag?.toUpperCase() === normalizedPerstag,
      );
      if (existing) {
        fieldIdCache[normalizedPerstag] = existing.id;
        // Garantia: field pode existir mas sem fieldRel à lista 0.
        // Sem fieldRel, o field nao aparece no contact view da UI.
        await ensureFieldRel(existing.id).catch((err) =>
          console.error(`[activecampaign] ensureFieldRel error:`, err),
        );
        return existing.id;
      }
    }
  } catch (err) {
    console.error(`[activecampaign] Error listing fields:`, err);
  }

  // 2. Create new field
  try {
    const createRes = await fetch(`${AC_API_URL}/api/3/fields`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        field: {
          type,
          title,
          descript: `Auto-created from Boldfy site`,
          perstag: normalizedPerstag,
          visible: 1,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => '');
      console.error(
        `[activecampaign] Error creating field "${title}":`,
        createRes.status,
        errText,
      );
      return null;
    }

    const created = await createRes.json();
    const fieldId = created.field?.id ?? null;
    if (fieldId) {
      fieldIdCache[normalizedPerstag] = fieldId;
      // IMPORTANTE: sem fieldRel, o field existe no backend mas NAO aparece
      // no contact view da UI do AC. Por isso associamos a lista 0 (= todas).
      await ensureFieldRel(fieldId).catch((err) =>
        console.error(`[activecampaign] ensureFieldRel error:`, err),
      );
    }
    return fieldId;
  } catch (err) {
    console.error(`[activecampaign] Error creating field "${title}":`, err);
    return null;
  }
}

/**
 * Garante que o field esta associado a "todas as listas" via /fieldRel.
 *
 * No AC, um custom field so aparece no contact view da UI se houver uma
 * relacao field<->lista (via endpoint /fieldRel). list: 0 = todas as
 * listas, incluindo contatos sem lista. Esse e o comportamento que a
 * maioria das integracoes espera (campo visivel pra todos os contatos).
 *
 * Idempotente: se a relacao ja existe, AC retorna 422 "already exists" e
 * a gente engole o erro (nao impacta).
 */
async function ensureFieldRel(fieldId: string): Promise<void> {
  try {
    const res = await fetch(`${AC_API_URL}/api/3/fieldRels`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        fieldRel: {
          field: fieldId,
          relid: 0, // 0 = all lists
        },
      }),
    });

    // 201 criado, 422 ja existia (esperado quando o field ja tem relacao).
    // Outros status sao erros reais.
    if (!res.ok && res.status !== 422) {
      const errText = await res.text().catch(() => '');
      console.error(
        `[activecampaign] Error creating fieldRel for field ${fieldId}:`,
        res.status,
        errText,
      );
    }
  } catch (err) {
    console.error(`[activecampaign] Error ensuring fieldRel:`, err);
  }
}

/**
 * Preenche múltiplos custom fields de um contato.
 *
 * Para cada chave do objeto `fields`, busca/cria o field no AC (usando
 * a config de `CUSTOM_FIELDS`) e faz POST /fieldValues pra associar o
 * valor ao contato. Chamadas são sequenciais pra respeitar o rate limit
 * de 5 req/s do AC.
 *
 * Valores null/undefined/vazios são ignorados (skip).
 */
async function setContactFields(
  contactId: string,
  fields: Record<string, string | number | undefined | null>,
): Promise<void> {
  for (const [perstag, rawValue] of Object.entries(fields)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;

    const config = CUSTOM_FIELDS[perstag];
    if (!config) {
      console.warn(
        `[activecampaign] Field "${perstag}" not configured in CUSTOM_FIELDS — skipping.`,
      );
      continue;
    }

    const fieldId = await findOrCreateField(perstag, config.title, config.type);
    if (!fieldId) continue;

    try {
      const res = await fetch(`${AC_API_URL}/api/3/fieldValues`, {
        method: 'POST',
        headers: acHeaders(),
        body: JSON.stringify({
          fieldValue: {
            contact: contactId,
            field: fieldId,
            value: String(rawValue),
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(
          `[activecampaign] Error setting field "${perstag}":`,
          res.status,
          errText,
        );
      }
    } catch (err) {
      console.error(`[activecampaign] Error setting field "${perstag}":`, err);
    }
  }
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
