/**
 * Catálogo dos forms do CRM Boldfy (Task 1 — spec crm-source-of-truth).
 *
 * Cada form que captura lead pro CRM tem 1 linha em `form_definitions` (DB)
 * e 1 entrada no FORM_DEFS_SEED (código) — usado como fallback caso a tabela
 * esteja vazia ou DB esteja inacessível durante render.
 *
 * Convenção:
 *  - `slug`   → chave humana ('report', 'beta', ...). É o FormSlug.
 *  - `kind`   → 'topo_funil' (Report — pergunta intenção, gera 3 segments)
 *              ou 'lider_b2b_only' (Beta/Demo/Proposta/extensão — sempre Líder B2B).
 *  - `ac_tag` → nome legível da tag aplicada no AC pra disparar cadências.
 *              NAMING ESPECÍFICO POR SLUG: a tag atual `Form: Algoritmo
 *              LinkedIn 2026` é MANTIDA (não vira `Form: Report`) — pra
 *              suportar múltiplos materiais futuros (Form: Algoritmo TikTok
 *              2027 etc) sem ter que migrar cadências.
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

export type FormSlug = 'report' | 'beta' | 'demo' | 'proposta' | 'linkedin_extension';
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
}> = {
  report: {
    slug: 'report',
    name: 'Report Algoritmo LinkedIn 2026',
    kind: 'topo_funil',
    acTag: 'Form: Algoritmo LinkedIn 2026',
  },
  beta: {
    slug: 'beta',
    name: 'Beta Test',
    kind: 'lider_b2b_only',
    acTag: 'Form: Beta Test',
  },
  demo: {
    slug: 'demo',
    name: 'Demo',
    kind: 'lider_b2b_only',
    acTag: 'Form: Demo',
  },
  proposta: {
    slug: 'proposta',
    name: 'Simulador de Proposta',
    kind: 'lider_b2b_only',
    acTag: 'Form: Proposta',
  },
  linkedin_extension: {
    slug: 'linkedin_extension',
    name: 'Extracao LinkedIn',
    kind: 'lider_b2b_only',
    acTag: 'Form: LinkedIn',
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
  report: 'form_report',
  beta: 'form_beta',
  demo: 'form_demo',
  proposta: 'form_proposta',
  linkedin_extension: 'extension_linkedin',
};

export function formSlugToSourceMethod(slug: FormSlug): SourceMethod {
  return SLUG_TO_SOURCE_METHOD[slug];
}

/**
 * Mapping slug → tipo do activity (mantém compat com ACTIVITY_WEIGHTS atual).
 * Activity type continua sendo `form_submit_<slug-curto>` pra preservar
 * filtros do kanban e os pesos definidos em crm.ts.
 *
 * linkedin_extension cai em `form_submit_extension_linkedin` (sem peso definido
 * em ACTIVITY_WEIGHTS — Task 5 ajusta quando a extensão for ligada).
 */
export function formSlugToActivityType(slug: FormSlug): string {
  switch (slug) {
    case 'report': return 'form_submit_report';
    case 'beta': return 'form_submit_beta';
    case 'demo': return 'form_submit_demo';
    case 'proposta': return 'form_submit_proposta';
    case 'linkedin_extension': return 'form_submit_extension_linkedin';
  }
}
