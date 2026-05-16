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
  scoreThresholdMin: number;
  isDefault: boolean;
  isTerminal: boolean;
}> = [
  { label: 'Ativo', color: 'neutral', sortOrder: 0, scoreThresholdMin: 0, isDefault: true, isTerminal: false },
  { label: 'Lead', color: 'blue', sortOrder: 1, scoreThresholdMin: 21, isDefault: false, isTerminal: false },
  { label: 'Quente', color: 'amber', sortOrder: 2, scoreThresholdMin: 51, isDefault: false, isTerminal: false },
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
