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
  /**
   * Classificação do lead derivada da intenção declarada no form (em vez de
   * tags `ICP:`/`Persona:`). Valores possíveis:
   *   - "ICP B2B"      → marca-empresa, recebe cadência completa
   *   - "Agência"      → marca-clientes, só E1
   *   - "Criador"      → marca-pessoal, só E1
   * Gate da cadência: If/Else no AC compara `Tipo de Lead = "ICP B2B"`.
   * Perstag é `tipo_de_lead` porque o AC gera a partir do título "Tipo de
   * Lead" (preserva preposições — virou TIPO_DE_LEAD, não TIPO_LEAD).
   */
  tipo_de_lead: { title: 'Tipo de Lead', type: 'text' },
  /**
   * UTMs de PRIMEIRO toque — registram a origem real do lead (não atualizam
   * em visitas posteriores). Substituem as tags `utm_source:X` etc, que
   * poluíam o contato com 3-5 tags por captura.
   * Lógica de "primeiro toque" é responsabilidade do caller (só seta se o
   * campo ainda estiver vazio — ver report-leads.ts).
   */
  utm_source_first: { title: 'UTM Source (1º toque)', type: 'text' },
  utm_medium_first: { title: 'UTM Medium (1º toque)', type: 'text' },
  utm_campaign_first: { title: 'UTM Campaign (1º toque)', type: 'text' },
  /**
   * Campos que antes só viviam nas notas geradas pelos forms. Hoje viram
   * custom fields estruturados — populados em todos os submits e expostos
   * direto na aba Formulários do CRM (sem precisar de parser de nota).
   *
   * `intencao_uso`: marca-empresa | desenvolver-pessoal | criar-publico (etc)
   * `newsletter_opt_in`: "SIM" | "NÃO"
   * `como_conheceu`: texto livre (LinkedIn, indicação, busca, etc)
   * `observacoes`: textarea livre (form Beta tem este)
   */
  intencao_uso: { title: 'Intenção de uso', type: 'text' },
  newsletter_opt_in: { title: 'Newsletter opt-in', type: 'text' },
  observacoes: { title: 'Observações', type: 'textarea' },
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
    // Segmento). Origem foi abolida em mai/2026 — info de origem vai pro
    // contato via note + UTMs (custom fields utm_*_first). Dados
    // estruturados tipo empresa/cargo viraram custom fields (campo `fields`).
    const allTags = [...(input.tags ?? [])];

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
/**
 * Conta total de contatos no AC criados nos últimos N dias.
 * Usa filtro `filters[created_after]` da API. Retorna 0 se AC não configurado.
 *
 * Importante pro funil: nem todos os contatos do AC entram no CRM —
 * o CRM filtra Líderes B2B via tag. Pra ter visão real do volume total de
 * leads gerados pelos forms, precisa contar do AC.
 */
export async function getContactCountSince(daysAgo: number): Promise<number> {
  if (!AC_API_URL || !AC_API_KEY) return 0;
  try {
    const dateStr = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `${AC_API_URL}/api/3/contacts?filters[created_after]=${dateStr}&limit=1`;
    const res = await fetch(url, { headers: acHeaders() });
    if (!res.ok) {
      console.error('[activecampaign] getContactCountSince failed:', res.status);
      return 0;
    }
    const data = (await res.json()) as { meta?: { total?: string | number } };
    return parseInt(String(data.meta?.total ?? '0'), 10);
  } catch (err) {
    console.error('[activecampaign] getContactCountSince error:', err);
    return 0;
  }
}

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
/**
 * Lista TODOS os contatos do AC paginados. Usado pra importação inicial.
 * Yields lotes de 100. Atenção: pode ser lento se a base é grande.
 */
export async function* listAllContacts(): AsyncGenerator<Array<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}>> {
  if (!AC_API_URL || !AC_API_KEY) return;
  let offset = 0;
  const limit = 100;
  while (true) {
    try {
      const res = await fetch(
        `${AC_API_URL}/api/3/contacts?limit=${limit}&offset=${offset}`,
        { headers: acHeaders() },
      );
      if (!res.ok) break;
      const data = await res.json() as { contacts?: Array<{ id: string; email: string; firstName: string; lastName: string; phone: string }> };
      const contacts = data.contacts ?? [];
      if (contacts.length === 0) break;
      yield contacts;
      if (contacts.length < limit) break;
      offset += limit;
    } catch (err) {
      console.error('[activecampaign] listAllContacts error:', err);
      break;
    }
  }
}

/**
 * Pega field values de um contato (custom fields tipo empresa, cargo, etc).
 * Usado na importação pra trazer dados ricos.
 */
export async function getContactFieldValues(contactId: string): Promise<Record<string, string>> {
  if (!AC_API_URL || !AC_API_KEY) return {};
  try {
    const res = await fetch(
      `${AC_API_URL}/api/3/contacts/${contactId}/fieldValues`,
      { headers: acHeaders() },
    );
    if (!res.ok) return {};
    const data = await res.json() as { fieldValues?: Array<{ field: string; value: string }>, fields?: Array<{ id: string; perstag: string }> };
    // Resolve field IDs → perstags (cached em mem fica caro; faz simples aqui)
    const fieldsRes = await fetch(`${AC_API_URL}/api/3/fields?limit=100`, { headers: acHeaders() });
    if (!fieldsRes.ok) return {};
    const fieldsData = await fieldsRes.json() as { fields?: Array<{ id: string; perstag: string }> };
    const fieldMap = new Map((fieldsData.fields ?? []).map((f) => [f.id, f.perstag]));
    const out: Record<string, string> = {};
    for (const fv of data.fieldValues ?? []) {
      const perstag = fieldMap.get(fv.field);
      if (perstag && fv.value) out[perstag.toLowerCase()] = fv.value;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Email events do contato (opens/clicks). Usado pra reconstruir timeline
 * no import enriquecido.
 */
export type EmailEventRaw = {
  type: 'open' | 'click';
  campaignName: string | null;
  url?: string;
  tstamp: string;
};

export async function getContactEmailEvents(contactId: string): Promise<EmailEventRaw[]> {
  if (!AC_API_URL || !AC_API_KEY) return [];
  const events: EmailEventRaw[] = [];

  // Endpoint /api/3/contacts/{id}/logs — retorna events de email (opens/clicks)
  // AC chama isso de "campaign log entries". Vem com type=open|click + tstamp.
  try {
    const res = await fetch(
      `${AC_API_URL}/api/3/contacts/${contactId}/logs?limit=100`,
      { headers: acHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      logs?: Array<{ type: string; campaignName?: string; url?: string; tstamp: string }>;
    };
    for (const log of data.logs ?? []) {
      if (log.type === 'open' || log.type === 'click') {
        events.push({
          type: log.type,
          campaignName: log.campaignName ?? null,
          url: log.url,
          tstamp: log.tstamp,
        });
      }
    }
  } catch (err) {
    console.error('[activecampaign] getContactEmailEvents failed:', err);
  }

  return events;
}

/**
 * Site tracking events do contato (page views) via VGO.
 * AC chama de "eventTrackingEvents" mas também armazena page views.
 *
 * Pode retornar MUITOS events (centenas por contato ativo). Limita a 200.
 */
export type PageViewRaw = {
  url: string;
  tstamp: string;
  domain?: string;
};

export async function getContactPageViews(contactId: string): Promise<PageViewRaw[]> {
  if (!AC_API_URL || !AC_API_KEY) return [];
  const views: PageViewRaw[] = [];
  try {
    // /api/3/siteTrackingEvents?filter[contact]=ID
    const res = await fetch(
      `${AC_API_URL}/api/3/siteTrackingEvents?filters[contact]=${contactId}&limit=200`,
      { headers: acHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      siteTrackingEvents?: Array<{ name?: string; tstamp: string; data?: { url?: string; domain?: string } }>;
    };
    for (const ev of data.siteTrackingEvents ?? []) {
      const url = ev.data?.url ?? ev.name;
      if (!url) continue;
      views.push({
        url,
        tstamp: ev.tstamp,
        domain: ev.data?.domain,
      });
    }
  } catch (err) {
    console.error('[activecampaign] getContactPageViews failed:', err);
  }
  return views;
}

/**
 * Lista todas as tags do contato (nomes). Usado no tag manager UI do CRM.
 * Retorna [] se contato não tem tags ou se houve erro.
 */
export async function getContactTags(contactId: string): Promise<string[]> {
  if (!AC_API_URL || !AC_API_KEY) return [];
  try {
    const listRes = await fetch(
      `${AC_API_URL}/api/3/contacts/${contactId}/contactTags`,
      { headers: acHeaders() },
    );
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const associations = (listData.contactTags ?? []) as Array<{ tag: string }>;
    const tagIds = associations.map((a) => a.tag);
    if (tagIds.length === 0) return [];

    // Resolve nomes de tag em paralelo (Promise.all)
    const tagNames = await Promise.all(
      tagIds.map(async (tagId) => {
        try {
          const res = await fetch(`${AC_API_URL}/api/3/tags/${tagId}`, { headers: acHeaders() });
          if (!res.ok) return null;
          const data = await res.json();
          return data?.tag?.tag ?? null;
        } catch {
          return null;
        }
      }),
    );

    return tagNames.filter((t): t is string => typeof t === 'string');
  } catch (err) {
    console.error('[activecampaign] getContactTags failed:', err);
    return [];
  }
}

/**
 * Lista todas as tags existentes na conta AC (paginated). Cap em 100 pra UI
 * não estourar — Clara provavelmente tem dezenas, não centenas.
 */
export async function listAllTags(): Promise<string[]> {
  if (!AC_API_URL || !AC_API_KEY) return [];
  try {
    const res = await fetch(`${AC_API_URL}/api/3/tags?limit=100`, { headers: acHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    const tags = (data?.tags ?? []) as Array<{ tag: string }>;
    return tags.map((t) => t.tag).filter((t): t is string => typeof t === 'string').sort();
  } catch (err) {
    console.error('[activecampaign] listAllTags failed:', err);
    return [];
  }
}

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
 * Lista todas as notas de um contato.
 * Endpoint: GET /api/3/contacts/{id}/notes
 *
 * IMPORTANTE: o AC retorna a relação como `notes` quando você bate no path
 * /contacts/{id}/notes (relação inversa do reltype=Subscriber).
 *
 * Usado pra extrair dados do form que foram salvos em notas (Intenção,
 * Newsletter opt-in, Origem) — esses não viraram custom fields nos forms antigos.
 */
export type ContactNote = {
  id: string;
  note: string;
  cdate: string; // ISO timestamp
};

export async function getContactNotes(contactId: string): Promise<ContactNote[]> {
  if (!AC_API_URL || !AC_API_KEY) return [];
  try {
    const res = await fetch(
      `${AC_API_URL}/api/3/contacts/${contactId}/notes?limit=100`,
      { headers: acHeaders() },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { notes?: Array<{ id: string; note: string; cdate: string }> };
    return (data.notes ?? []).map((n) => ({ id: n.id, note: n.note, cdate: n.cdate }));
  } catch (err) {
    console.error('[activecampaign] getContactNotes failed:', err);
    return [];
  }
}

/**
 * Parser das notas geradas automaticamente pelos forms do site.
 * Formato típico:
 *   Download do Report Algoritmo LinkedIn 2026
 *   Nome: Waldo Lima
 *   Email: waldo@goalfy.com.br
 *   Intenção: Marca da empresa onde trabalha
 *   Empresa: tecnologia
 *   Opt-in newsletter: SIM
 *   — Tracking —
 *   Origem: LP Algoritmo LinkedIn
 *   utm_source: linkedin
 *   ...
 *
 * Retorna um dict com keys normalizadas (intencao, opt_in_newsletter, origem, etc).
 */
export function parseFormNote(noteText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = noteText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('—') || line.startsWith('-')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const rawKey = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!value) continue;
    // Normaliza key: lowercase, remove acentos, espaços → underscore
    const key = rawKey
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Cria um custom field no AC (Subscriber). Idempotent: se já existir um campo
 * com o mesmo perstag, retorna o ID dele.
 *
 * Usado pra criar Intenção de uso, Como conheceu, Newsletter opt-in,
 * Observações — esses campos eram salvos em nota e agora viram custom field
 * pros próximos leads.
 *
 * type: 'text' (single line), 'textarea', 'dropdown', 'checkbox'
 */
export async function createCustomFieldIfMissing(args: {
  perstag: string;
  title: string;
  type?: 'text' | 'textarea' | 'dropdown' | 'checkbox';
}): Promise<string | null> {
  if (!AC_API_URL || !AC_API_KEY) return null;
  const { perstag, title, type = 'text' } = args;

  try {
    // 1) Checa se já existe
    const existing = await fetch(`${AC_API_URL}/api/3/fields?limit=100`, { headers: acHeaders() });
    if (existing.ok) {
      const data = (await existing.json()) as { fields?: Array<{ id: string; perstag: string }> };
      const found = (data.fields ?? []).find((f) => f.perstag.toLowerCase() === perstag.toLowerCase());
      if (found) return found.id;
    }

    // 2) Cria
    const res = await fetch(`${AC_API_URL}/api/3/fields`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        field: {
          type,
          title,
          perstag: perstag.toUpperCase(),
          visible: 1,
        },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[activecampaign] createCustomField failed:', res.status, txt);
      return null;
    }
    const data = (await res.json()) as { field?: { id: string } };
    return data.field?.id ?? null;
  } catch (err) {
    console.error('[activecampaign] createCustomField error:', err);
    return null;
  }
}

/**
 * Seta o valor de um custom field pra um contato. Por perstag (mais legível
 * que ID). Resolve perstag → fieldId internamente.
 */
export async function setContactFieldValue(args: {
  contactId: string;
  perstag: string;
  value: string;
}): Promise<boolean> {
  if (!AC_API_URL || !AC_API_KEY) return false;
  const { contactId, perstag, value } = args;
  try {
    const fieldsRes = await fetch(`${AC_API_URL}/api/3/fields?limit=100`, { headers: acHeaders() });
    if (!fieldsRes.ok) return false;
    const fieldsData = (await fieldsRes.json()) as { fields?: Array<{ id: string; perstag: string }> };
    const field = (fieldsData.fields ?? []).find((f) => f.perstag.toLowerCase() === perstag.toLowerCase());
    if (!field) {
      console.warn('[activecampaign] setContactFieldValue: field not found:', perstag);
      return false;
    }
    const res = await fetch(`${AC_API_URL}/api/3/fieldValues`, {
      method: 'POST',
      headers: acHeaders(),
      body: JSON.stringify({
        fieldValue: { contact: contactId, field: field.id, value },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[activecampaign] setContactFieldValue error:', err);
    return false;
  }
}

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
