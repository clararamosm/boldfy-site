/**
 * Notion CRM upsert helpers — used by lead capture forms (report,
 * demo, contact, beta) to feed the unified CRM in Notion.
 *
 * Architecture: 3 databases (Empresas, Pessoas, Interações) with
 * relations. Every form submit:
 *   1. upserts Empresa (matched by domain extracted from email)
 *   2. upserts Pessoa (matched by email) — links to the Empresa
 *   3. ALWAYS creates a new Interação — links to Pessoa + Empresa
 *
 * Idempotency: if same email submits twice, Pessoa is updated (not
 * duplicated) and a new Interação is appended. This is exactly the
 * behavior we want — the Pessoa record is the single source of truth
 * about the person, while Interações is an append-only log.
 *
 * Schema-tolerant: queries the database schema first and only sets
 * properties that exist. So if Clara hasn't run the Notion assistant
 * yet to add new fields (UTM, Origem, etc.), this code still works —
 * it just sets fewer properties.
 *
 * Env vars required:
 *   NOTION_API_KEY
 *   NOTION_CRM_EMPRESAS_DB_ID
 *   NOTION_CRM_PESSOAS_DB_ID
 *   NOTION_CRM_INTERACOES_DB_ID
 *
 * If any of those are missing, the corresponding helper returns null
 * and the caller can fall back gracefully (sync to AC anyway).
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const EMPRESAS_DB = process.env.NOTION_CRM_EMPRESAS_DB_ID;
const PESSOAS_DB = process.env.NOTION_CRM_PESSOAS_DB_ID;
const INTERACOES_DB = process.env.NOTION_CRM_INTERACOES_DB_ID;

function headers() {
  return {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type NotionPropertyType =
  | 'title'
  | 'rich_text'
  | 'email'
  | 'phone_number'
  | 'url'
  | 'select'
  | 'multi_select'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'relation'
  | 'people'
  | 'formula'
  | 'rollup';

type DbSchema = Record<string, { type: NotionPropertyType; id: string }>;

export type UpsertEmpresaInput = {
  /** Display name of the company (used as title) */
  nome: string;
  /** Domain extracted from email — used as match key */
  dominio?: string;
  /** Optional: ICP fit */
  icpFit?: 'Tier 1' | 'Tier 2' | 'Fora' | 'A definir';
  /** Optional: setor */
  setor?: string;
  /** Optional: porte (funcionarios) */
  porte?: string;
};

export type UpsertPessoaInput = {
  nome: string;
  email: string;
  cargo?: string;
  whatsapp?: string;
  linkedin?: string;
  /** Empresa page IDs to link (multi-relation) */
  empresaIds?: string[];
  /** Where they came from first (only set on create) */
  origemPrimeira?: string;
  /**
   * Opt-in pra newsletter ongoing (cohort persistente). Default false.
   *
   * IMPORTANTE: NÃO é opt-in pra cadência transacional do material que
   * o lead pediu (essa é parte do que ele aceitou ao submeter o form).
   * Esse flag controla só se ele entra na lista de newsletter contínua
   * (DB Listas/Cohorts → "Newsletter Boldfy").
   */
  emailOptIn?: boolean;
  /** AC contact ID for two-way linkage */
  acContactId?: string;
  /** Status outreach — only set on create, never overwrite existing */
  statusOutreachOnCreate?: string;
};

export type CreateInteracaoInput = {
  /** Title of the interaction (e.g. "Download Report Algoritmo — João Silva") */
  titulo: string;
  pessoaId?: string;
  empresaId?: string;
  /** Type of interaction */
  tipo?:
    | 'Form submit'
    | 'Email aberto'
    | 'Email clicado'
    | 'Reunião agendada'
    | 'Reunião realizada'
    | 'No-show'
    | 'Resposta direta'
    | 'Click LP'
    | 'Download material'
    | 'Cancelamento'
    | 'Outro';
  direcao?: 'Inbound' | 'Outbound';
  canal?: 'Site' | 'Email' | 'WhatsApp' | 'LinkedIn' | 'Calendly' | 'Telefone' | 'Outro';
  /** Origem no site — should match values in DB select */
  origemNoSite?: string;
  conteudoResumo?: string;
  data?: string; // ISO date
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the schema (properties) of a database. Cached per request via
 * Next.js fetch revalidate. Returns null on any failure.
 */
async function getDbSchema(dbId: string): Promise<DbSchema | null> {
  if (!NOTION_API_KEY) return null;

  try {
    const res = await fetch(`${NOTION_API}/databases/${dbId}`, {
      headers: headers(),
      // Schema rarely changes; cache for 5 min
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error('[notion-leads] getDbSchema failed:', res.status, dbId);
      return null;
    }
    const data = await res.json();
    return data.properties as DbSchema;
  } catch (err) {
    console.error('[notion-leads] getDbSchema error:', err);
    return null;
  }
}

/**
 * Build a Notion property payload for a given value, but only if the
 * property exists in the schema. This makes the code tolerant of
 * schema drift (fields can be added/removed on the Notion side without
 * breaking the integration).
 */
function setProperty(
  props: Record<string, unknown>,
  schema: DbSchema,
  name: string,
  builder: () => unknown,
): void {
  if (!schema[name]) return;
  const value = builder();
  if (value === undefined || value === null) return;
  props[name] = value;
}

/** Extract domain from email. "joao@acme.com.br" -> "acme.com.br" */
export function domainFromEmail(email: string): string | undefined {
  const at = email.lastIndexOf('@');
  if (at === -1) return undefined;
  return email.slice(at + 1).toLowerCase().trim();
}

/* -------------------------------------------------------------------------- */
/*  Empresas                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Search for an existing Empresa by domain. Falls back to name match
 * if domain isn't set. Returns the page ID or null.
 */
async function findEmpresa(dominio: string | undefined, nome: string): Promise<string | null> {
  if (!NOTION_API_KEY || !EMPRESAS_DB) return null;

  // Try domain match first
  const filters: unknown[] = [];
  if (dominio) {
    filters.push({
      property: 'Domínio',
      rich_text: { equals: dominio },
    });
  }
  if (nome) {
    filters.push({
      property: 'Nome',
      title: { equals: nome },
    });
  }
  if (filters.length === 0) return null;

  try {
    const res = await fetch(`${NOTION_API}/databases/${EMPRESAS_DB}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filter: filters.length === 1 ? filters[0] : { or: filters },
        page_size: 1,
      }),
    });
    if (!res.ok) {
      console.error('[notion-leads] findEmpresa query failed:', res.status);
      return null;
    }
    const data = await res.json();
    return data.results?.[0]?.id ?? null;
  } catch (err) {
    console.error('[notion-leads] findEmpresa error:', err);
    return null;
  }
}

/**
 * Create or update an Empresa. Match key: domain (preferred) or name.
 *
 * On match: only fills missing fields, never overwrites existing data.
 * On create: sets all provided fields.
 *
 * Returns the page ID or null on failure.
 */
export async function upsertEmpresa(input: UpsertEmpresaInput): Promise<string | null> {
  if (!NOTION_API_KEY || !EMPRESAS_DB) return null;

  const schema = await getDbSchema(EMPRESAS_DB);
  if (!schema) return null;

  const existing = await findEmpresa(input.dominio, input.nome);

  // Build properties, only including ones that exist in schema
  const props: Record<string, unknown> = {};

  // Title is always required
  setProperty(props, schema, 'Nome', () => ({
    title: [{ text: { content: input.nome.slice(0, 200) } }],
  }));

  if (input.dominio) {
    // Domínio might be rich_text or url depending on how Clara set it up
    setProperty(props, schema, 'Domínio', () => {
      const t = schema['Domínio']?.type;
      if (t === 'url') return { url: input.dominio };
      return { rich_text: [{ text: { content: input.dominio! } }] };
    });
  }

  if (input.icpFit) {
    setProperty(props, schema, 'ICP fit', () => ({ select: { name: input.icpFit } }));
  }

  if (input.setor) {
    setProperty(props, schema, 'Setor', () => {
      const t = schema['Setor']?.type;
      if (t === 'select') return { select: { name: input.setor } };
      return { rich_text: [{ text: { content: input.setor! } }] };
    });
  }

  if (input.porte) {
    setProperty(props, schema, 'Porte (funcionários)', () => {
      const t = schema['Porte (funcionários)']?.type;
      if (t === 'select') return { select: { name: input.porte } };
      return { rich_text: [{ text: { content: input.porte! } }] };
    });
  }

  try {
    if (existing) {
      // Update only — don't pass Nome again to avoid overwriting
      // a manually-edited title. Strip 'Nome' from props if present.
      const updateProps = { ...props };
      delete updateProps['Nome'];
      // Skip update if nothing else to set
      if (Object.keys(updateProps).length > 0) {
        const res = await fetch(`${NOTION_API}/pages/${existing}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ properties: updateProps }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('[notion-leads] upsertEmpresa update failed:', res.status, errText);
        }
      }
      return existing;
    }

    // Create new
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        parent: { database_id: EMPRESAS_DB },
        properties: props,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[notion-leads] upsertEmpresa create failed:', res.status, errText);
      return null;
    }
    const data = await res.json();
    return data.id ?? null;
  } catch (err) {
    console.error('[notion-leads] upsertEmpresa error:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Pessoas                                                                     */
/* -------------------------------------------------------------------------- */

/** Search for an existing Pessoa by email. Returns page ID or null. */
async function findPessoaByEmail(email: string): Promise<string | null> {
  if (!NOTION_API_KEY || !PESSOAS_DB) return null;

  try {
    const res = await fetch(`${NOTION_API}/databases/${PESSOAS_DB}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filter: {
          property: 'Email',
          email: { equals: email.toLowerCase().trim() },
        },
        page_size: 1,
      }),
    });
    if (!res.ok) {
      console.error('[notion-leads] findPessoaByEmail query failed:', res.status);
      return null;
    }
    const data = await res.json();
    return data.results?.[0]?.id ?? null;
  } catch (err) {
    console.error('[notion-leads] findPessoaByEmail error:', err);
    return null;
  }
}

/**
 * Create or update a Pessoa. Match key: email.
 *
 * On match (existing pessoa): updates only fields that aren't empty
 * conservatively — does NOT overwrite Cargo/Empresa if already set,
 * does update WhatsApp if missing, does append to Empresa relation
 * (multi-relation), does NOT change Status outreach.
 *
 * On create: sets all provided fields including Origem (primeira),
 * Status outreach, etc.
 *
 * Returns the page ID or null on failure.
 */
export async function upsertPessoa(input: UpsertPessoaInput): Promise<string | null> {
  if (!NOTION_API_KEY || !PESSOAS_DB) return null;

  const schema = await getDbSchema(PESSOAS_DB);
  if (!schema) return null;

  const existing = await findPessoaByEmail(input.email);

  const props: Record<string, unknown> = {};

  // Title — always set on create, skip on update (preserves manual edits)
  setProperty(props, schema, 'Nome', () => ({
    title: [{ text: { content: input.nome.slice(0, 200) } }],
  }));

  setProperty(props, schema, 'Email', () => ({ email: input.email.toLowerCase().trim() }));

  if (input.cargo) {
    setProperty(props, schema, 'Cargo', () => {
      const t = schema['Cargo']?.type;
      if (t === 'select') return { select: { name: input.cargo } };
      return { rich_text: [{ text: { content: input.cargo! } }] };
    });
  }

  if (input.whatsapp) {
    setProperty(props, schema, 'WhatsApp', () => ({ phone_number: input.whatsapp }));
  }

  if (input.linkedin) {
    setProperty(props, schema, 'LinkedIn', () => ({ url: input.linkedin }));
  }

  if (input.empresaIds && input.empresaIds.length > 0) {
    setProperty(props, schema, 'Empresa', () => ({
      relation: input.empresaIds!.map((id) => ({ id })),
    }));
  }

  if (input.acContactId) {
    setProperty(props, schema, 'AC Contact ID', () => ({
      rich_text: [{ text: { content: input.acContactId! } }],
    }));
  }

  if (input.emailOptIn !== undefined) {
    setProperty(props, schema, 'Email opt-in', () => ({ checkbox: input.emailOptIn }));
  }

  // These two ONLY get set on create — don't overwrite history
  const createOnlyProps: Record<string, unknown> = {};
  if (input.origemPrimeira) {
    setProperty(createOnlyProps, schema, 'Origem (primeira)', () => ({
      select: { name: input.origemPrimeira },
    }));
  }
  if (input.statusOutreachOnCreate) {
    setProperty(createOnlyProps, schema, 'Status outreach', () => ({
      select: { name: input.statusOutreachOnCreate },
    }));
  }

  try {
    if (existing) {
      // Update path: don't overwrite Nome, don't set create-only props
      const updateProps = { ...props };
      delete updateProps['Nome'];

      // For Empresa relation: we want to ADD to existing relations,
      // not replace. Fetch current relation and merge.
      if (input.empresaIds && input.empresaIds.length > 0 && schema['Empresa']) {
        try {
          const pageRes = await fetch(`${NOTION_API}/pages/${existing}`, {
            headers: headers(),
          });
          if (pageRes.ok) {
            const page = await pageRes.json();
            const currentRels = (page.properties?.Empresa?.relation ?? []) as Array<{
              id: string;
            }>;
            const currentIds = new Set(currentRels.map((r) => r.id));
            const merged = [...currentIds, ...input.empresaIds.filter((id) => !currentIds.has(id))];
            updateProps['Empresa'] = { relation: merged.map((id) => ({ id })) };
          }
        } catch (err) {
          console.error('[notion-leads] empresaIds merge error (using replace):', err);
        }
      }

      if (Object.keys(updateProps).length > 0) {
        const res = await fetch(`${NOTION_API}/pages/${existing}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ properties: updateProps }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('[notion-leads] upsertPessoa update failed:', res.status, errText);
        }
      }
      return existing;
    }

    // Create new — merge regular props with create-only props
    const allProps = { ...props, ...createOnlyProps };
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        parent: { database_id: PESSOAS_DB },
        properties: allProps,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[notion-leads] upsertPessoa create failed:', res.status, errText);
      return null;
    }
    const data = await res.json();
    return data.id ?? null;
  } catch (err) {
    console.error('[notion-leads] upsertPessoa error:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Interações                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Always creates a new Interação (append-only log). Links to Pessoa
 * and Empresa if their IDs are provided.
 *
 * Returns the page ID or null on failure.
 */
export async function createInteracao(input: CreateInteracaoInput): Promise<string | null> {
  if (!NOTION_API_KEY || !INTERACOES_DB) return null;

  const schema = await getDbSchema(INTERACOES_DB);
  if (!schema) return null;

  const props: Record<string, unknown> = {};

  // Title — the Interação database uses "Interação" as title prop name
  setProperty(props, schema, 'Interação', () => ({
    title: [{ text: { content: input.titulo.slice(0, 200) } }],
  }));

  if (input.pessoaId) {
    setProperty(props, schema, 'Pessoa', () => ({
      relation: [{ id: input.pessoaId }],
    }));
  }

  if (input.empresaId) {
    setProperty(props, schema, 'Empresa', () => ({
      relation: [{ id: input.empresaId }],
    }));
  }

  if (input.tipo) {
    setProperty(props, schema, 'Tipo', () => ({ select: { name: input.tipo } }));
  }

  if (input.direcao) {
    setProperty(props, schema, 'Direção', () => ({ select: { name: input.direcao } }));
  }

  if (input.canal) {
    setProperty(props, schema, 'Canal', () => ({ select: { name: input.canal } }));
  }

  if (input.origemNoSite) {
    // Try both possible names — Clara may rename to "Origem no site"
    const propName = schema['Origem no site'] ? 'Origem no site' : 'origem no site';
    setProperty(props, schema, propName, () => ({
      select: { name: input.origemNoSite },
    }));
  }

  if (input.conteudoResumo) {
    setProperty(props, schema, 'Conteúdo (resumo)', () => ({
      rich_text: [{ text: { content: input.conteudoResumo!.slice(0, 2000) } }],
    }));
  }

  setProperty(props, schema, 'Data', () => ({
    date: { start: input.data ?? new Date().toISOString() },
  }));

  if (input.utmSource) {
    setProperty(props, schema, 'UTM Source', () => ({
      rich_text: [{ text: { content: input.utmSource! } }],
    }));
  }
  if (input.utmMedium) {
    setProperty(props, schema, 'UTM Medium', () => ({
      rich_text: [{ text: { content: input.utmMedium! } }],
    }));
  }
  if (input.utmCampaign) {
    setProperty(props, schema, 'UTM Campaign', () => ({
      rich_text: [{ text: { content: input.utmCampaign! } }],
    }));
  }

  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        parent: { database_id: INTERACOES_DB },
        properties: props,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[notion-leads] createInteracao failed:', res.status, errText);
      return null;
    }
    const data = await res.json();
    return data.id ?? null;
  } catch (err) {
    console.error('[notion-leads] createInteracao error:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  High-level convenience: full lead capture flow                              */
/* -------------------------------------------------------------------------- */

export type CaptureLeadInput = {
  /** Lead identification */
  nome: string;
  email: string;
  empresa: string;
  cargo?: string;
  whatsapp?: string;
  /** Where the lead came from */
  origemNoSite: string;
  /** Title for the Interação record */
  interacaoTitulo: string;
  interacaoTipo: CreateInteracaoInput['tipo'];
  interacaoCanal?: CreateInteracaoInput['canal'];
  conteudoResumo?: string;
  /**
   * Opt-in newsletter ongoing (não da cadência transacional).
   * Ver doc em UpsertPessoaInput.emailOptIn pra detalhes.
   */
  emailOptIn?: boolean;
  /** AC contact ID from earlier sync (for two-way linking) */
  acContactId?: string;
  /** UTM tracking */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type CaptureLeadResult = {
  empresaId: string | null;
  pessoaId: string | null;
  interacaoId: string | null;
};

/**
 * Run the full upsert flow: Empresa -> Pessoa -> Interação.
 *
 * Each step is best-effort — if Empresa fails, Pessoa is still
 * created without the relation; if Pessoa fails, Interação isn't
 * created (since the link target wouldn't exist).
 *
 * Returns IDs for downstream use (e.g. linking from email cadence
 * webhooks, or for adding more interactions later in the same flow).
 */
export async function captureLead(input: CaptureLeadInput): Promise<CaptureLeadResult> {
  const result: CaptureLeadResult = {
    empresaId: null,
    pessoaId: null,
    interacaoId: null,
  };

  if (!NOTION_API_KEY) {
    return result;
  }

  // 1. Upsert Empresa (matched by domain)
  const dominio = domainFromEmail(input.email);
  if (EMPRESAS_DB) {
    result.empresaId = await upsertEmpresa({
      nome: input.empresa,
      dominio,
    });
  }

  // 2. Upsert Pessoa (matched by email) — link to Empresa
  if (PESSOAS_DB) {
    result.pessoaId = await upsertPessoa({
      nome: input.nome,
      email: input.email,
      cargo: input.cargo,
      whatsapp: input.whatsapp,
      empresaIds: result.empresaId ? [result.empresaId] : undefined,
      origemPrimeira: input.origemNoSite,
      emailOptIn: input.emailOptIn ?? false,
      acContactId: input.acContactId,
      statusOutreachOnCreate: 'Lead frio',
    });
  }

  // 3. Always create new Interação (append-only)
  if (INTERACOES_DB && (result.pessoaId || result.empresaId)) {
    result.interacaoId = await createInteracao({
      titulo: input.interacaoTitulo,
      pessoaId: result.pessoaId ?? undefined,
      empresaId: result.empresaId ?? undefined,
      tipo: input.interacaoTipo,
      direcao: 'Inbound',
      canal: input.interacaoCanal ?? 'Site',
      origemNoSite: input.origemNoSite,
      conteudoResumo: input.conteudoResumo,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
    });
  }

  return result;
}
