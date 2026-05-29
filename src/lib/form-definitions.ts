/**
 * Catálogo dos forms do CRM Boldfy (Task 1 — spec crm-source-of-truth).
 *
 * Cada form que captura lead pro CRM tem 1 linha em `form_definitions` (DB)
 * e 1 entrada no FORM_DEFS_SEED (código) — usado como fallback caso a tabela
 * esteja vazia ou DB esteja inacessível durante render.
 *
 * Convenção (AGENTS.md §"Convenção de nomes para forms/materiais"):
 *  - `slug`   → SEMPRE igual ao slug da URL pública do material/form. Ex:
 *              'algoritmo-linkedin' (não 'report'), 'case-semrush' (não 'case').
 *              Termo genérico é proibido — quando o segundo material chegar, o
 *              slug `report` deixaria de ser identificável. Para forms sem URL
 *              pública (ex: linkedin_extension), slug = descritor específico.
 *  - `kind`   → 'topo_funil' (pergunta intenção, gera 3 segments) ou
 *              'lider_b2b_only' (Beta/Demo/Proposta/extensão — sempre Líder B2B).
 *  - `ac_tag` → nome legível da tag aplicada no AC pra disparar cadências.
 *              Específico por material (`Form: Algoritmo LinkedIn 2026`, não
 *              `Form: Report`) — quando o segundo material chegar, ele tem
 *              tag própria sem migrar cadência existente.
 *
 * Helpers:
 *  - getFormDefinition(slug) → lê do DB com cache 60s; fallback no seed.
 *  - formSlugToSourceMethod(slug) → mapeia pro SourceMethod do CRM.
 *
 * `fields_schema` é DESCRITIVO (catálogo pra UI/admin futura). Validação real
 * continua via Zod hardcoded em app/actions/_schemas.ts (decisão arquitetural
 * §11 da spec — runtime Zod via JSONB perde TS narrowing).
 */

import { db, formDefinitions } from '@/db';
import type { FormDefinition } from '@/db';
import type { SourceMethod } from './crm';
import { eq } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type FormSlug =
  | 'algoritmo-linkedin'
  | 'beta'
  | 'demo'
  | 'proposta'
  | 'linkedin_extension'
  | 'case-semrush'
  | 'playbook-employee-led-growth';
export type FormKind = 'topo_funil' | 'lider_b2b_only';

export type LeadSegment = 'lider_b2b' | 'parceiro' | 'profissional_individual';

/* -------------------------------------------------------------------------- */
/*  Seed estático (fallback + fonte de verdade da ac_tag em código)            */
/* -------------------------------------------------------------------------- */
/**
 * Mantém EM SINCRONIA com a query 3 do Neon que seedou a tabela.
 *
 * Esse seed é a fonte autoritativa em código — usado quando a tabela está
 * vazia ou o DB falha. UI/scripts podem ler do DB pra ter o `fields_schema`
 * descritivo, mas pro fluxo de captação (server actions) preferimos esse
 * mapa estático pra não bloquear submit em caso de DB lento.
 */
export const FORM_DEFS_SEED: Record<FormSlug, {
  slug: FormSlug;
  name: string;
  kind: FormKind;
  acTag: string;
  /**
   * Nome da lista no AC pra inscrever automaticamente o contato quando esse
   * form é preenchido (mai/2026 — Caminho 2 sustentável). Resolvido em
   * runtime via getListIdByNameMap(). Se a lista não existir no AC, sync
   * pula com warning. Use null pra forms que NÃO disparam cadência própria
   * (ex: extension_linkedin). Listas de SEGMENTO (Líderes B2B, Profissional,
   * Parceiro) são adicionadas separadamente pelo crm.ts baseado em segment.
   */
  acListName?: string | null;
}> = {
  'algoritmo-linkedin': {
    slug: 'algoritmo-linkedin',
    name: 'Report Algoritmo LinkedIn 2026',
    kind: 'topo_funil',
    acTag: 'Form: Algoritmo LinkedIn 2026',
    acListName: '[Cadência] Report Algoritmo LinkedIn',
  },
  beta: {
    slug: 'beta',
    name: 'Beta Test',
    kind: 'lider_b2b_only',
    acTag: 'Form: Beta Test',
    acListName: 'Beta tester',
  },
  demo: {
    slug: 'demo',
    name: 'Demo',
    kind: 'lider_b2b_only',
    acTag: 'Form: Demo',
    acListName: null, // sem cadência de email — fluxo direto pro Cal.com
  },
  proposta: {
    slug: 'proposta',
    name: 'Simulador de Proposta',
    kind: 'lider_b2b_only',
    acTag: 'Form: Proposta',
    acListName: null, // sem cadência — fundo de funil já em conversa direta
  },
  linkedin_extension: {
    slug: 'linkedin_extension',
    name: 'Extracao LinkedIn',
    kind: 'lider_b2b_only',
    acTag: 'Form: LinkedIn',
    acListName: null, // captura interna, sem cadência associada
  },
  // Case de meio-funil (Semrush ELG). Mesma natureza topo_funil do algoritmo-
  // linkedin — pergunta intencao_uso, gera 3 segments (lider_b2b/parceiro/
  // profissional). Pede mais campos (cargo + tamanho da empresa) só pra quem
  // marca 'marca-empresa', porque audiência de case é mais qualificada e
  // aguenta atrito extra de fundo de funil.
  'case-semrush': {
    slug: 'case-semrush',
    name: 'Case Semrush ELG',
    kind: 'topo_funil',
    acTag: 'Form: Case Semrush ELG',
    acListName: '[Cadência] Case Semrush',
  },
  // Playbook ELG (mai/2026): quiz interativo de 11 perguntas em
  // /ferramentas/playbook-employee-led-growth. Gera página pessoal /playbook/[slug]
  // com estratégia personalizada. Sempre Líder B2B — gate de elegibilidade
  // (≥5 colab) na 1ª pergunta filtra autônomos/profissionais individuais.
  'playbook-employee-led-growth': {
    slug: 'playbook-employee-led-growth',
    name: 'Playbook de Employee-Led Growth',
    kind: 'lider_b2b_only',
    acTag: 'Form: Playbook Employee-Led Growth',
    // Lista criada manualmente no AC em 2026-05-29. Cadência de 4 emails
    // documentada em docs/cadencia-playbook-elg.md.
    acListName: '[Cadência] Playbook ELG',
  },
};

/* -------------------------------------------------------------------------- */
/*  Cache em memória (idem padrão dos statuses)                               */
/* -------------------------------------------------------------------------- */

type CacheEntry = { def: FormDefinition; expires: number };
const cache = new Map<FormSlug, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateFormDefinitionCache(): void {
  cache.clear();
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Lê definição completa do DB (com fields_schema). Cache 60s.
 *
 * Se DB falhar ou linha não existir, retorna shape mínimo derivado do seed
 * estático (sem fields_schema) — preserva fluxo de captação.
 */
export async function getFormDefinition(slug: FormSlug): Promise<FormDefinition> {
  const hit = cache.get(slug);
  if (hit && hit.expires > Date.now()) return hit.def;

  try {
    const rows = await db
      .select()
      .from(formDefinitions)
      .where(eq(formDefinitions.slug, slug))
      .limit(1);
    if (rows[0]) {
      cache.set(slug, { def: rows[0], expires: Date.now() + CACHE_TTL_MS });
      return rows[0];
    }
  } catch (err) {
    console.error(`[form-definitions] DB lookup failed for slug=${slug}:`, err);
    // cai no fallback abaixo
  }

  // Fallback: shape mínimo a partir do seed (sem fieldsSchema do DB)
  const seed = FORM_DEFS_SEED[slug];
  const fallback: FormDefinition = {
    id: '00000000-0000-0000-0000-000000000000',
    slug: seed.slug,
    name: seed.name,
    kind: seed.kind,
    acTag: seed.acTag,
    fieldsSchema: {},
    active: true,
    createdAt: new Date(0),
  };
  return fallback;
}

/**
 * Sync — só pega do seed (não toca DB). Pra hot path de adapter onde
 * a única coisa que importamos é o `acTag` + `kind`.
 */
export function getFormDefinitionSync(slug: FormSlug): typeof FORM_DEFS_SEED[FormSlug] {
  return FORM_DEFS_SEED[slug];
}

/**
 * Mapping slug → SourceMethod (enum do schema). Garante consistência
 * entre form_definitions e o enum `source_method` do Postgres.
 */
const SLUG_TO_SOURCE_METHOD: Record<FormSlug, SourceMethod> = {
  'algoritmo-linkedin': 'form_algoritmo_linkedin',
  beta: 'form_beta',
  demo: 'form_demo',
  proposta: 'form_proposta',
  linkedin_extension: 'extension_linkedin',
  // Case-semrush usa source_method dedicado pra diferenciar nos analytics
  // do CRM. Migration 0002_form_case_semrush.sql adicionou 'form_case_semrush'
  // ao enum. Migration 0003a renomeou 'form_report' → 'form_algoritmo_linkedin'.
  'case-semrush': 'form_case_semrush',
  // Playbook ELG (mai/2026): migration 0004 adicionou o valor ao enum.
  'playbook-employee-led-growth': 'form_playbook_employee_led_growth',
};

export function formSlugToSourceMethod(slug: FormSlug): SourceMethod {
  return SLUG_TO_SOURCE_METHOD[slug];
}

/**
 * Mapping slug → tipo do activity. Activity type segue o slug do form (em
 * snake_case porque convive com outros tipos snake como `status_change`,
 * `ac_synced`, etc).
 *
 * linkedin_extension cai em `form_submit_extension_linkedin` (sem peso definido
 * em ACTIVITY_WEIGHTS — Task 5 ajusta quando a extensão for ligada).
 *
 * Migration 0003a renomeou os tipos antigos genéricos:
 *   form_submit_report → form_submit_algoritmo_linkedin
 *   form_submit_case   → form_submit_case_semrush
 */
export function formSlugToActivityType(slug: FormSlug): string {
  switch (slug) {
    case 'algoritmo-linkedin': return 'form_submit_algoritmo_linkedin';
    case 'beta': return 'form_submit_beta';
    case 'demo': return 'form_submit_demo';
    case 'proposta': return 'form_submit_proposta';
    case 'linkedin_extension': return 'form_submit_extension_linkedin';
    case 'case-semrush': return 'form_submit_case_semrush';
    case 'playbook-employee-led-growth': return 'form_submit_playbook_employee_led_growth';
  }
}
