/**
 * Helpers de Status (CRM modular).
 *
 * Lazy seed: na primeira leitura, se a tabela `statuses` está vazia, insere os
 * defaults. Isso evita precisar de um script de seed separado.
 *
 * Cache em memória do processo (TTL 60s) pra evitar query em toda renderização
 * de card. Statuses mudam raro.
 */

import { db, statuses } from '@/db';
import type { Status } from '@/db';
import { eq, asc } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Defaults (lazy seed na primeira leitura)                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PERSON_STATUSES: Array<{
  label: string;
  color: string;
  sortOrder: number;
  scoreThresholdMin: number | null;
  isDefault: boolean;
  isTerminal: boolean;
}> = [
  // LinkedIn Lead vem por sourceMethod, não por score — pessoas capturadas pela
  // extensão LinkedIn (ou legado imported_folk com sourceMethod equivalente).
  // Fica DEPOIS de Ativo porque tem mais "intenção" mas score zero por
  // enquanto. NÃO tem scoreThresholdMin pra evitar que qualquer lead com
  // score >= X caia aqui — só entra explicitamente via classifyByMethod.
  { label: 'Ativo', color: 'neutral', sortOrder: 0, scoreThresholdMin: 0, isDefault: true, isTerminal: false },
  { label: 'LinkedIn Lead', color: 'blue', sortOrder: 1, scoreThresholdMin: null, isDefault: false, isTerminal: false },
  // Lead e Quente continuam por score, mas a entrada inicial agora também é
  // definida por sourceMethod (forms beta/demo/proposta entram direto em Quente).
  { label: 'Lead', color: 'pink', sortOrder: 2, scoreThresholdMin: 21, isDefault: false, isTerminal: false },
  { label: 'Quente', color: 'amber', sortOrder: 3, scoreThresholdMin: 50, isDefault: false, isTerminal: false },
  // Etapa de vendas — preenchida via Cal.com webhook ou movimento manual
  { label: 'Reunião marcada', color: 'purple', sortOrder: 4, scoreThresholdMin: null, isDefault: false, isTerminal: false },
  // Etapas terminais — só movimento manual, sem auto-promotion
  { label: 'Fechado', color: 'green', sortOrder: 5, scoreThresholdMin: null, isDefault: false, isTerminal: true },
  { label: 'Perdido', color: 'gray', sortOrder: 6, scoreThresholdMin: null, isDefault: false, isTerminal: true },
];

const DEFAULT_COMPANY_STATUSES: Array<{
  label: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isTerminal: boolean;
}> = [
  { label: 'No status', color: 'gray', sortOrder: 0, isDefault: true, isTerminal: false },
  { label: 'Quero prospectar', color: 'blue', sortOrder: 1, isDefault: false, isTerminal: false },
  { label: 'Reunião marcada', color: 'purple', sortOrder: 2, isDefault: false, isTerminal: false },
  { label: 'Em andamento', color: 'amber', sortOrder: 3, isDefault: false, isTerminal: false },
  { label: 'Fechado', color: 'green', sortOrder: 4, isDefault: false, isTerminal: true },
  { label: 'Perdido', color: 'neutral', sortOrder: 5, isDefault: false, isTerminal: true },
];

/* -------------------------------------------------------------------------- */
/*  Cache em memória do processo (Vercel serverless reusa entre requests      */
/*  na mesma instância). TTL curto pra Clara ver mudanças quase em tempo real.*/
/* -------------------------------------------------------------------------- */

type Cache = { data: Status[]; expires: number } | null;
let personCache: Cache = null;
let companyCache: Cache = null;
const CACHE_TTL_MS = 60 * 1000;

export function invalidateStatusCache() {
  personCache = null;
  companyCache = null;
}

/* -------------------------------------------------------------------------- */
/*  getStatuses (com lazy seed)                                                */
/* -------------------------------------------------------------------------- */

export async function getStatuses(kind: 'person' | 'company'): Promise<Status[]> {
  const cache = kind === 'person' ? personCache : companyCache;
  if (cache && cache.expires > Date.now()) {
    return cache.data;
  }

  let rows = await db
    .select()
    .from(statuses)
    .where(eq(statuses.kind, kind))
    .orderBy(asc(statuses.sortOrder));

  // Lazy seed
  if (rows.length === 0) {
    if (kind === 'person') {
      await db.insert(statuses).values(
        DEFAULT_PERSON_STATUSES.map((d) => ({
          kind: 'person' as const,
          label: d.label,
          color: d.color,
          sortOrder: d.sortOrder,
          scoreThresholdMin: d.scoreThresholdMin,
          isDefault: d.isDefault,
          isTerminal: d.isTerminal,
        })),
      );
    } else {
      await db.insert(statuses).values(
        DEFAULT_COMPANY_STATUSES.map((d) => ({
          kind: 'company' as const,
          label: d.label,
          color: d.color,
          sortOrder: d.sortOrder,
          scoreThresholdMin: null,
          isDefault: d.isDefault,
          isTerminal: d.isTerminal,
        })),
      );
    }
    rows = await db
      .select()
      .from(statuses)
      .where(eq(statuses.kind, kind))
      .orderBy(asc(statuses.sortOrder));
  }

  const newCache: Cache = { data: rows, expires: Date.now() + CACHE_TTL_MS };
  if (kind === 'person') personCache = newCache;
  else companyCache = newCache;

  return rows;
}

export async function getDefaultStatus(kind: 'person' | 'company'): Promise<Status | null> {
  const all = await getStatuses(kind);
  return all.find((s) => s.isDefault) ?? all[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  statusForScore — promoção automática usando thresholds dinâmicos          */
/* -------------------------------------------------------------------------- */

/**
 * Dado um score, retorna o ÚLTIMO status (na ordem sortOrder) cujo
 * scoreThresholdMin <= score. Ignora terminais (não auto-promove pra Fechado).
 *
 * Ex: pessoa com score 35
 *   Statuses: Ativo (0), Lead (21), Quente (51), Cliente terminal (100)
 *   Threshold <= 35: Ativo, Lead → último = Lead
 */
export async function statusForScore(score: number): Promise<Status | null> {
  const all = await getStatuses('person');
  const eligible = all
    .filter((s) => s.scoreThresholdMin !== null && s.scoreThresholdMin <= score && !s.isTerminal)
    .sort((a, b) => (b.scoreThresholdMin ?? 0) - (a.scoreThresholdMin ?? 0));
  return eligible[0] ?? null;
}

/**
 * Determina se deve auto-promover: novo desejado é "mais alto" que o atual
 * (sortOrder maior) e não terminal.
 */
export async function shouldAutoPromote(
  currentStatusId: string | null,
  desiredStatusId: string,
): Promise<boolean> {
  if (currentStatusId === desiredStatusId) return false;
  const all = await getStatuses('person');
  const current = currentStatusId ? all.find((s) => s.id === currentStatusId) : null;
  const desired = all.find((s) => s.id === desiredStatusId);
  if (!desired) return false;
  if (desired.isTerminal) return false;
  if (!current) return true; // pessoa sem status → promove pro desired
  return desired.sortOrder > current.sortOrder;
}

/* -------------------------------------------------------------------------- */
/*  Lookups por label e por sourceMethod                                       */
/* -------------------------------------------------------------------------- */

/**
 * Busca status por label (case-insensitive). Usado pelas regras de
 * classificação que querem mirar uma coluna específica por nome.
 */
export async function getStatusByLabel(
  kind: 'person' | 'company',
  label: string,
): Promise<Status | null> {
  const all = await getStatuses(kind);
  const lower = label.toLowerCase();
  return all.find((s) => s.label.toLowerCase() === lower) ?? null;
}

/**
 * Target de coluna pra cada sourceMethod de pessoa, definido em palavras
 * (label). Resolvido em tempo de execução via getStatusByLabel — então
 * funciona mesmo se a Clara renomear/reordenar via UI, desde que o label
 * exato exista. Se não existir, cai pra default (Ativo) — comportamento
 * defensivo.
 *
 * Regra do produto (mai/2026):
 *   - form_report             → Ativo (lead frio que acumula score)
 *   - form_beta               → Quente (sinal forte de intenção)
 *   - form_demo               → Quente
 *   - form_proposta           → Quente
 *   - extension_linkedin      → LinkedIn Lead (captura intencional via extensão)
 *   - imported_folk (legado)  → LinkedIn Lead (equivalente histórico)
 *   - manual                  → Ativo
 *
 * NÃO-REGRESSÃO: chamadores devem comparar sortOrder com status atual antes
 * de aplicar (via shouldAutoPromote). Se já está em Reunião marcada, form
 * Beta NÃO regride pra Quente.
 */
export type SourceMethodForClassify =
  | 'form_demo' | 'form_beta' | 'form_report' | 'form_proposta'
  | 'extension_linkedin' | 'imported_folk' | 'manual';

const METHOD_TO_LABEL: Record<SourceMethodForClassify, string> = {
  form_report: 'Ativo',
  form_beta: 'Quente',
  form_demo: 'Quente',
  form_proposta: 'Quente',
  extension_linkedin: 'LinkedIn Lead',
  imported_folk: 'LinkedIn Lead',
  manual: 'Ativo',
};

/**
 * Resolve a coluna alvo de uma pessoa baseado em sourceMethod. Retorna o
 * Status row se a coluna existir, ou null como fallback (chamador decide
 * o que fazer — geralmente manter default).
 */
export async function classifyByMethod(method: SourceMethodForClassify): Promise<Status | null> {
  const label = METHOD_TO_LABEL[method];
  if (!label) return null;
  return getStatusByLabel('person', label);
}
