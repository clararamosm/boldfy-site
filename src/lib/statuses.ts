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
  // Etapas de vendas — preenchidas via Cal.com webhook ou movimento manual.
  // "Em andamento" é o degrau acima de "Reunião marcada": pessoa que já
  // marcou demo e segue preenchendo forms (Beta/Proposta) sobe pra cá
  // (em vez de ficar parada em Reunião marcada como antes).
  { label: 'Reunião marcada', color: 'purple', sortOrder: 4, scoreThresholdMin: null, isDefault: false, isTerminal: false },
  { label: 'Em andamento', color: 'orange', sortOrder: 5, scoreThresholdMin: null, isDefault: false, isTerminal: false },
  // Etapas terminais — só movimento manual, sem auto-promotion
  { label: 'Fechado', color: 'green', sortOrder: 6, scoreThresholdMin: null, isDefault: false, isTerminal: true },
  { label: 'Perdido', color: 'gray', sortOrder: 7, scoreThresholdMin: null, isDefault: false, isTerminal: true },
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
 * Cadeia de promoção por sourceMethod — lista ordenada de labels, da menos
 * pra mais avançada. classifyByMethod escolhe o PRIMEIRO target da cadeia
 * que seja MAIS avançado que o status atual da pessoa (não-terminal).
 *
 * Por que cadeia em vez de target único:
 *   Ex: pessoa em "Reunião marcada" preenche form Beta. Target original
 *   seria "Quente" — não promove (Reunião marcada > Quente). Antes ficava
 *   parada, só logava activity. Agora com cadeia ['Quente', 'Em andamento'],
 *   o segundo elemento é maior que Reunião marcada → promove pra Em andamento.
 *
 * Regras do produto (mai/2026 ciclo 2):
 *   - form_algoritmo_linkedin → ['Ativo']                       (lead frio, só acumula score)
 *   - form_case_semrush       → ['Ativo']                       (meio-funil, mesma ladder)
 *   - form_beta               → ['Quente', 'Em andamento']      (sinal forte; promove em cadeia)
 *   - form_demo               → []                              (relevado — Cal webhook salta direto pra Reunião marcada)
 *   - form_proposta           → ['Quente', 'Em andamento']
 *   - extension_linkedin      → ['LinkedIn Lead']               (captura intencional via extensão)
 *   - imported_folk (legado)  → ['LinkedIn Lead']               (equivalente histórico)
 *   - manual                  → ['Ativo']
 *
 * NÃO-REGRESSÃO permanece: nunca volta pra status menor. Se nenhum label da
 * cadeia é mais avançado que o atual → retorna null (chamador mantém estado).
 *
 * Por que form_demo é vazio:
 *   Quem preenche o form de Demo geralmente marca reunião no Cal logo em
 *   seguida (next step do funil). O webhook do Cal salta direto pra
 *   "Reunião marcada" — promover pra Quente no meio causaria flicker visual
 *   sem ganho real. Activity de form_submit_demo continua sendo logada na
 *   timeline (fica evidente que o form foi preenchido).
 *   Edge case (preenche demo mas não marca reunião): fica em Ativo, mas a
 *   activity tá lá pra revisão manual.
 */
export type SourceMethodForClassify =
  | 'form_demo' | 'form_beta' | 'form_algoritmo_linkedin' | 'form_case_semrush' | 'form_proposta'
  | 'form_playbook_team_led_growth' | 'form_eventosbh'
  | 'extension_linkedin' | 'imported_folk' | 'manual';

const METHOD_TO_LADDER: Record<SourceMethodForClassify, string[]> = {
  form_algoritmo_linkedin: ['Ativo'],
  // form_case_semrush é meio-funil — mais qualificado que algoritmo-linkedin,
  // mas ainda não pediu reunião nem proposta. Cai em 'Ativo' acumulando score;
  // lead score promove pra 'Em andamento' quando passa o threshold.
  form_case_semrush: ['Ativo'],
  // Eventos BH (jun/2026): pré-inscrição/demonstração de interesse pros eventos
  // B2B em BH. Líder B2B validado (empresa obrigatória), mas é topo de funil —
  // não pediu reunião nem proposta. Cai em 'Ativo' acumulando score; lead score
  // promove pra 'Em andamento' quando passa o threshold.
  form_eventosbh: ['Ativo'],
  // Playbook TLG (mai/2026): quem completa quiz de 11 perguntas + LGPD + email
  // corporativo é lead qualificado. Comportamento similar ao beta — entra
  // direto em Quente; auto-promoção pra Em andamento via score quando passa
  // o threshold (sponsorship+budget+C-level somam até ~110 pts).
  form_playbook_team_led_growth: ['Quente', 'Em andamento'],
  form_beta: ['Quente', 'Em andamento'],
  form_demo: [],
  form_proposta: ['Quente', 'Em andamento'],
  extension_linkedin: ['LinkedIn Lead'],
  imported_folk: ['LinkedIn Lead'],
  manual: ['Ativo'],
};

/**
 * Resolve a coluna alvo de uma pessoa baseado em sourceMethod E status atual.
 *
 * Percorre a cadeia (METHOD_TO_LADDER) e retorna o PRIMEIRO Status cujo
 * sortOrder seja maior que o atual e que não seja terminal. Retorna null
 * se nenhum se aplica (pessoa em terminal, ou cadeia toda menor que current).
 *
 * @param method - sourceMethod da pessoa
 * @param currentStatusSortOrder - sortOrder do status atual da pessoa (null se sem status)
 */
/**
 * True se o sourceMethod tem cadeia de promoção definida (com pelo menos
 * 1 elemento). False pra métodos intencionalmente sem classificação
 * (ex: form_demo — Cal webhook cuida do salto).
 *
 * Caller usa pra decidir se a activity de skip deve ser logada como
 * 'no_regression' (cadeia não promoveu) ou 'no_classification_by_design'
 * (cadeia vazia de propósito).
 */
export function hasClassificationLadder(method: SourceMethodForClassify): boolean {
  const ladder = METHOD_TO_LADDER[method];
  return Array.isArray(ladder) && ladder.length > 0;
}

export async function classifyByMethod(
  method: SourceMethodForClassify,
  currentStatusSortOrder: number | null = null,
): Promise<Status | null> {
  const ladder = METHOD_TO_LADDER[method];
  if (!ladder || ladder.length === 0) return null;

  const all = await getStatuses('person');
  for (const label of ladder) {
    const target = all.find((s) => s.label.toLowerCase() === label.toLowerCase());
    if (!target) continue;
    if (target.isTerminal) continue;
    // Se pessoa não tem status OU target é mais avançado → escolhe esse
    if (currentStatusSortOrder === null || target.sortOrder > currentStatusSortOrder) {
      return target;
    }
  }
  return null; // ninguém da cadeia promove → mantém status atual
}
