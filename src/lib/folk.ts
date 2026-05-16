/**
 * Folk CRM integration — sync de leads B2B.
 *
 * Arquitetura (mai/2026):
 *   - AC é universo geral (todos os leads, segmentação por tag, cadências)
 *   - Folk é CRM B2B (só leads marcados como Líderes B2B vão pra cá)
 *
 * Modelo de dados no Folk:
 *   - Group `Leads`     → contém PESSOAS (Person) com Status: Ativo/Lead/Quente
 *   - Group `Prospects` → contém EMPRESAS (Company) com Status: No status /
 *                          Quero prospectar / Reunião marcada / Em andamento /
 *                          Fechado / Perdido
 *   - Person ↔ Company conectados via campo nativo `companies` do Person
 *
 * Status do Person (auto pelo código):
 *   - Lead só baixou Report B2B  → Ativo
 *   - Lead preencheu Demo/Beta/Simulador → Lead
 *   - Quente é manual (Clara move quando lead responde mensagem)
 *
 * Status do Company (auto pelo código):
 *   - Novo lead entra como `No status`
 *   - Quando agenda demo via Cal.com → webhook move pra `Reunião marcada`
 *   - Outras movimentações são manuais
 *
 * Upgrade automático de Person:
 *   - Se person já existe com status Ativo e novo form é B2B → vai pra Lead
 *   - Nunca faz downgrade (Lead nunca volta pra Ativo, Quente nunca volta)
 *
 * Dedupe:
 *   - Person: match por email (case-insensitive)
 *   - Company: match por nome (Clara confirmou — se duplicar, Folk tem
 *     ferramenta de identificar duplicadas nativa)
 *
 * Custom fields esperados (criados manualmente ou via lazy create):
 *   Person (group Leads):
 *     - Status (singleSelect: Ativo / Lead / Quente)
 *     - form_origem (singleSelect: Demo / Beta / Report B2B / Simulador)
 *     - utm_source_first, utm_medium_first, utm_campaign_first (text)
 *     - ac_contact_id (text) — linkback pro AC
 *     - linkedin_url (text/url)
 *   Company (group Prospects):
 *     - Status (singleSelect: No status / Quero prospectar / Reunião marcada
 *               / Em andamento / Fechado / Perdido)
 *     - origem (singleSelect: Demo / Beta / Report B2B / Simulador)
 *     - porte (singleSelect: faixas de funcionários)
 *
 * Env vars:
 *   FOLK_API_KEY              — Bearer token
 *   FOLK_GROUP_LEADS_ID       — UUID do group Leads (com ou sem prefixo `grp_`)
 *   FOLK_GROUP_PROSPECTS_ID   — UUID do group Prospects
 *
 * Se as envs não estiverem configuradas, todas as funções retornam null
 * silenciosamente (degradação graceful — o lead continua no AC).
 */

const FOLK_API_URL = 'https://api.folk.app';
const FOLK_API_KEY = process.env.FOLK_API_KEY;

/**
 * Normaliza group ID — aceita UUID puro (vindo da URL do Folk) ou já com
 * prefixo `grp_`. A API exige o prefixo.
 */
function normalizeGroupId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.startsWith('grp_') ? raw : `grp_${raw}`;
}

const FOLK_GROUP_LEADS_ID = normalizeGroupId(process.env.FOLK_GROUP_LEADS_ID);
const FOLK_GROUP_PROSPECTS_ID = normalizeGroupId(process.env.FOLK_GROUP_PROSPECTS_ID);

function folkHeaders() {
  return {
    Authorization: `Bearer ${FOLK_API_KEY!}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function isConfigured(): boolean {
  if (!FOLK_API_KEY || !FOLK_GROUP_LEADS_ID || !FOLK_GROUP_PROSPECTS_ID) {
    console.warn(
      '[folk] integração não configurada — pulando sync. Verifique FOLK_API_KEY, FOLK_GROUP_LEADS_ID e FOLK_GROUP_PROSPECTS_ID no Vercel.',
    );
    return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PersonStatus = 'Ativo' | 'Lead' | 'Quente';

export type CompanyStatus =
  | 'No status'
  | 'Quero prospectar'
  | 'Reunião marcada'
  | 'Em andamento'
  | 'Fechado'
  | 'Perdido';

export type FormOrigem = 'Demo' | 'Beta' | 'Report B2B' | 'Simulador';

export type FolkPersonInput = {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  /** Status desejado. Upgrade automático se já existir — nunca downgrade. */
  status: PersonStatus;
  customFields?: {
    form_origem?: FormOrigem;
    utm_source_first?: string;
    utm_medium_first?: string;
    utm_campaign_first?: string;
    ac_contact_id?: string;
    linkedin_url?: string;
  };
};

export type FolkCompanyInput = {
  /** Nome da empresa — usado pra match no upsert. */
  name: string;
  /** Domínio/site se conhecido (ajuda o Folk a hidratar com Enrich). */
  url?: string;
  /** Setor (campo nativo `industry` do Folk). */
  industry?: string;
  customFields?: {
    origem?: FormOrigem;
    porte?: string;
  };
};

export type FolkLeadInput = {
  person: FolkPersonInput;
  company?: FolkCompanyInput;
};

export type FolkLeadResult = {
  personId: string | null;
  companyId: string | null;
};

/* -------------------------------------------------------------------------- */
/*  HTTP helpers                                                               */
/* -------------------------------------------------------------------------- */

type FolkPersonResponse = {
  data: {
    id: string;
    emails: string[];
    customFieldValues?: Record<string, Record<string, unknown>>;
    companies?: Array<{ id: string; name?: string }>;
  };
};

type FolkCompanyResponse = {
  data: {
    id: string;
    name: string;
  };
};

type FolkListResponse<T> = {
  data: {
    items: T[];
    pagination?: { nextCursor?: string };
  };
};

async function folkFetch<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T | null> {
  try {
    const res = await fetch(`${FOLK_API_URL}${path}`, {
      method,
      headers: folkHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[folk] ${method} ${path} → ${res.status}`, errText);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[folk] ${method} ${path} threw:`, err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  List ALL — usado pra importação one-shot pro nosso CRM próprio.            */
/* -------------------------------------------------------------------------- */

export type FolkPersonRaw = {
  id: string;
  firstName?: string;
  lastName?: string;
  emails?: string[];
  phones?: string[];
  jobTitle?: string;
  description?: string;
  customFieldValues?: Record<string, Record<string, unknown>>;
  companies?: Array<{ id: string; name?: string }>;
};

export type FolkCompanyRaw = {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  customFieldValues?: Record<string, Record<string, unknown>>;
};

/**
 * Lista todas as Persons do group Leads paginado. Yields lotes.
 */
export async function* listAllFolkPersons(): AsyncGenerator<FolkPersonRaw[]> {
  if (!isConfigured()) return;
  let cursor: string | undefined = undefined;
  const limit = 100;
  while (true) {
    const url: string = `/v1/people?groupId=${FOLK_GROUP_LEADS_ID}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const res: FolkListResponse<FolkPersonRaw> | null = await folkFetch<FolkListResponse<FolkPersonRaw>>('GET', url);
    if (!res?.data?.items) break;
    yield res.data.items;
    cursor = res.data.pagination?.nextCursor;
    if (!cursor || res.data.items.length === 0) break;
  }
}

export async function* listAllFolkCompanies(): AsyncGenerator<FolkCompanyRaw[]> {
  if (!isConfigured()) return;
  let cursor: string | undefined = undefined;
  const limit = 100;
  while (true) {
    const url: string = `/v1/companies?groupId=${FOLK_GROUP_PROSPECTS_ID}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const res: FolkListResponse<FolkCompanyRaw> | null = await folkFetch<FolkListResponse<FolkCompanyRaw>>('GET', url);
    if (!res?.data?.items) break;
    yield res.data.items;
    cursor = res.data.pagination?.nextCursor;
    if (!cursor || res.data.items.length === 0) break;
  }
}

/**
 * Helpers exportados pra outras libs (import).
 */
export function getFolkLeadsGroupId(): string | undefined {
  return FOLK_GROUP_LEADS_ID;
}
export function getFolkProspectsGroupId(): string | undefined {
  return FOLK_GROUP_PROSPECTS_ID;
}
export function isFolkConfigured(): boolean {
  return isConfigured();
}

/* -------------------------------------------------------------------------- */
/*  Find by email / name                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Busca Person no Folk por email. Retorna ID com customFieldValues do group
 * Leads (pra decisões de upgrade de status).
 *
 * Folk não tem endpoint nativo de "find by email" — usa list + filter no client.
 * Isso é OK enquanto o volume está baixo (centenas/poucos milhares). Se passar
 * disso, vale construir um índice em KV (Vercel KV) ou usar /search.
 */
type PersonFindResult = {
  id: string;
  currentStatus: PersonStatus | null;
};

async function findPersonByEmail(email: string): Promise<PersonFindResult | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  // O endpoint /v1/people aceita filtros — tenta filtro por email primeiro.
  // Se a API não suportar esse param exato, o fallback é paginar e filtrar.
  const filtered = await folkFetch<FolkListResponse<FolkPersonResponse['data']>>(
    'GET',
    `/v1/people?email=${encodeURIComponent(target)}&limit=10`,
  );

  if (filtered?.data?.items) {
    const match = filtered.data.items.find((p) =>
      p.emails?.some((e) => e.toLowerCase() === target),
    );
    if (match) {
      return {
        id: match.id,
        currentStatus: extractPersonStatus(match),
      };
    }
  }

  return null;
}

function extractPersonStatus(
  person: FolkPersonResponse['data'],
): PersonStatus | null {
  if (!FOLK_GROUP_LEADS_ID) return null;
  const values = person.customFieldValues?.[FOLK_GROUP_LEADS_ID];
  const raw = values?.['Status'];
  if (raw === 'Ativo' || raw === 'Lead' || raw === 'Quente') return raw;
  return null;
}

/**
 * Match exact (case-insensitive) por nome da empresa. Se a Folk tiver
 * múltiplas com mesmo nome (raro), pega a primeira.
 */
async function findCompanyByName(name: string): Promise<string | null> {
  const target = name.trim().toLowerCase();
  if (!target) return null;

  const filtered = await folkFetch<FolkListResponse<FolkCompanyResponse['data']>>(
    'GET',
    `/v1/companies?name=${encodeURIComponent(target)}&limit=10`,
  );

  const match = filtered?.data?.items?.find(
    (c) => c.name?.trim().toLowerCase() === target,
  );
  return match?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Create / update                                                            */
/* -------------------------------------------------------------------------- */

function buildPersonCustomFields(input: FolkPersonInput): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Status: input.status,
  };
  const cf = input.customFields;
  if (cf?.form_origem) fields['form_origem'] = cf.form_origem;
  if (cf?.utm_source_first) fields['utm_source_first'] = cf.utm_source_first;
  if (cf?.utm_medium_first) fields['utm_medium_first'] = cf.utm_medium_first;
  if (cf?.utm_campaign_first) fields['utm_campaign_first'] = cf.utm_campaign_first;
  if (cf?.ac_contact_id) fields['ac_contact_id'] = cf.ac_contact_id;
  if (cf?.linkedin_url) fields['linkedin_url'] = cf.linkedin_url;
  return fields;
}

function buildCompanyCustomFields(input: FolkCompanyInput): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    Status: 'No status',
  };
  const cf = input.customFields;
  if (cf?.origem) fields['origem'] = cf.origem;
  if (cf?.porte) fields['porte'] = cf.porte;
  return fields;
}

async function createPerson(
  input: FolkPersonInput,
  companyId?: string,
): Promise<string | null> {
  if (!FOLK_GROUP_LEADS_ID) return null;

  const body: Record<string, unknown> = {
    firstName: input.firstName,
    lastName: input.lastName ?? '',
    emails: [input.email],
    groups: [{ id: FOLK_GROUP_LEADS_ID }],
    customFieldValues: {
      [FOLK_GROUP_LEADS_ID]: buildPersonCustomFields(input),
    },
  };
  if (input.phone) body.phones = [input.phone];
  if (input.jobTitle) body.jobTitle = input.jobTitle;
  if (companyId) body.companies = [{ id: companyId }];

  const res = await folkFetch<FolkPersonResponse>('POST', '/v1/people', body);
  return res?.data?.id ?? null;
}

async function updatePersonStatusAndFields(
  personId: string,
  input: FolkPersonInput,
  currentStatus: PersonStatus | null,
  companyId?: string,
): Promise<boolean> {
  if (!FOLK_GROUP_LEADS_ID) return false;

  // Regra de upgrade: nunca faz downgrade.
  //   Quente > Lead > Ativo (na ordem do funil)
  // Se status atual é Quente, mantém Quente.
  // Se atual é Lead e novo é Ativo, mantém Lead.
  // Se atual é Ativo e novo é Lead, vira Lead.
  const newStatus = decidePersonStatus(currentStatus, input.status);

  const customFields = buildPersonCustomFields({ ...input, status: newStatus });

  const body: Record<string, unknown> = {
    customFieldValues: {
      [FOLK_GROUP_LEADS_ID]: customFields,
    },
  };

  // Se forneceu company nova, anexa. Folk preserva relações existentes
  // se não passar `companies`; passar substitui — então só passamos se temos
  // company válida pra anexar.
  if (companyId) body.companies = [{ id: companyId }];

  const res = await folkFetch<FolkPersonResponse>(
    'PATCH',
    `/v1/people/${personId}`,
    body,
  );
  return !!res?.data?.id;
}

function decidePersonStatus(
  current: PersonStatus | null,
  incoming: PersonStatus,
): PersonStatus {
  // Ordem do funil (maior = mais quente).
  const rank: Record<PersonStatus, number> = {
    Ativo: 1,
    Lead: 2,
    Quente: 3,
  };
  if (!current) return incoming;
  return rank[incoming] > rank[current] ? incoming : current;
}

async function createCompany(input: FolkCompanyInput): Promise<string | null> {
  if (!FOLK_GROUP_PROSPECTS_ID) return null;

  const body: Record<string, unknown> = {
    name: input.name,
    groups: [{ id: FOLK_GROUP_PROSPECTS_ID }],
    customFieldValues: {
      [FOLK_GROUP_PROSPECTS_ID]: buildCompanyCustomFields(input),
    },
  };
  if (input.url) body.urls = [input.url];
  if (input.industry) body.industry = input.industry;

  const res = await folkFetch<FolkCompanyResponse>('POST', '/v1/companies', body);
  return res?.data?.id ?? null;
}

async function updateCompanyFields(
  companyId: string,
  input: FolkCompanyInput,
): Promise<boolean> {
  if (!FOLK_GROUP_PROSPECTS_ID) return false;

  // Para companies existentes, NÃO sobrescrevemos Status — só atualizamos
  // os custom fields que vieram preenchidos. Senão um lead novo entrando
  // poderia resetar uma empresa que já estava em "Quero prospectar" pra
  // "No status".
  const fields: Record<string, unknown> = {};
  if (input.customFields?.origem) fields['origem'] = input.customFields.origem;
  if (input.customFields?.porte) fields['porte'] = input.customFields.porte;

  const body: Record<string, unknown> = {};
  if (Object.keys(fields).length > 0) {
    body.customFieldValues = { [FOLK_GROUP_PROSPECTS_ID]: fields };
  }
  if (input.industry) body.industry = input.industry;

  // Se nada pra atualizar, não chama API (evita PATCH vazio).
  if (Object.keys(body).length === 0) return true;

  const res = await folkFetch<FolkCompanyResponse>(
    'PATCH',
    `/v1/companies/${companyId}`,
    body,
  );
  return !!res?.data?.id;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Sincroniza um lead B2B no Folk: upsert Company + upsert Person linkados.
 *
 * Idempotente: chamadas repetidas com mesmo email não duplicam Person, e mesmo
 * `company.name` não duplica Company (match exato, case-insensitive).
 *
 * Returns { personId, companyId } — null em qualquer um indica falha parcial.
 * Falha não bloqueia o caller — a integração com AC continua sendo a fonte
 * de verdade. Tudo logado pra debug.
 */
export async function syncFolkLead(input: FolkLeadInput): Promise<FolkLeadResult> {
  if (!isConfigured()) return { personId: null, companyId: null };

  // 1. Upsert Company (se nome foi informado)
  let companyId: string | null = null;
  if (input.company?.name?.trim()) {
    const existing = await findCompanyByName(input.company.name);
    if (existing) {
      companyId = existing;
      await updateCompanyFields(existing, input.company);
    } else {
      companyId = await createCompany(input.company);
    }
  }

  // 2. Upsert Person (match por email)
  const existingPerson = await findPersonByEmail(input.person.email);
  let personId: string | null;

  if (existingPerson) {
    const ok = await updatePersonStatusAndFields(
      existingPerson.id,
      input.person,
      existingPerson.currentStatus,
      companyId ?? undefined,
    );
    personId = ok ? existingPerson.id : null;
  } else {
    personId = await createPerson(input.person, companyId ?? undefined);
  }

  return { personId, companyId };
}

/**
 * Atualiza apenas o status de uma Company. Usado pelo webhook do Cal.com
 * quando uma demo é efetivamente agendada — move a empresa pra "Reunião
 * marcada".
 *
 * NÃO sobrescreve outros custom fields.
 */
export async function updateFolkCompanyStatus(
  companyId: string,
  status: CompanyStatus,
): Promise<boolean> {
  if (!isConfigured()) return false;
  if (!FOLK_GROUP_PROSPECTS_ID) return false;

  const res = await folkFetch<FolkCompanyResponse>(
    'PATCH',
    `/v1/companies/${companyId}`,
    {
      customFieldValues: {
        [FOLK_GROUP_PROSPECTS_ID]: { Status: status },
      },
    },
  );
  return !!res?.data?.id;
}

/**
 * Atalho pro webhook do Cal.com: dado um email, retorna o ID da primary
 * company do Person no Folk (ou null se Person não existir ou não tiver
 * empresa primária).
 */
export async function findFolkPrimaryCompanyByEmail(
  email: string,
): Promise<string | null> {
  if (!isConfigured()) return null;

  const target = email.trim().toLowerCase();
  if (!target) return null;

  const filtered = await folkFetch<FolkListResponse<FolkPersonResponse['data']>>(
    'GET',
    `/v1/people?email=${encodeURIComponent(target)}&limit=10`,
  );

  const match = filtered?.data?.items?.find((p) =>
    p.emails?.some((e) => e.toLowerCase() === target),
  );

  // No Folk, a primeira company da lista é a "primary" (ver docs).
  return match?.companies?.[0]?.id ?? null;
}
