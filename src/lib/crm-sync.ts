/**
 * Sync de status entre Pessoa ↔ Empresa.
 *
 * Regra do produto (mai/2026):
 *
 * PESSOA → EMPRESA (monotônico, só sobe):
 *   Quando uma pessoa muda de status, recalcula o status da empresa olhando
 *   TODAS as pessoas linkadas e escolhendo o sortOrder MAIOR (ignorando
 *   terminais como "Perdido" se houver pessoas vivas). Empresa NUNCA regride —
 *   se atual da empresa já está em sortOrder maior que o agregado das pessoas,
 *   mantém. Garante que "Quero prospectar" não cai pra "No status" quando
 *   pessoa muda.
 *
 * EMPRESA → PESSOA (só pra terminais):
 *   Quando uma empresa vai pra status TERMINAL (Fechado/Perdido), todas as
 *   pessoas linkadas não-terminais herdam o mesmo terminal. Mudanças
 *   não-terminais da empresa NÃO tocam pessoas — empresa segue como
 *   agregação sem forçar pessoas a regredir.
 *
 * Mapeamento entre kinds (pessoa vs empresa):
 *   - Os statuses são tabelas separadas mas com labels equivalentes
 *     ("Reunião marcada", "Fechado", "Perdido"). Match por LABEL case-insensitive.
 *   - Quando pessoa muda pra "Reunião marcada", procura status de empresa com
 *     label "Reunião marcada". Se não existir, fica no atual.
 *   - "Lead"/"Quente"/"Ativo" (pessoa) não têm equivalente direto em empresa —
 *     empresa fica em "No status" ou "Quero prospectar" (que são intencionais).
 *     Mapeamento: pessoa em Lead/Quente → empresa em "No status" (não promove,
 *     porque "Quero prospectar" é intencional manual/extensão).
 *
 * Hooks recomendados:
 *   - movePerson(): chamar syncCompanyFromPeople(companyId) depois de mudar status
 *   - logActivity() com auto-promote: idem (quando newStatusId existir)
 *   - moveCompany(): se newStatus é terminal, chamar propagateTerminalToCompanyPeople(companyId, statusId)
 */

import { db, people, companies, activities, statuses } from '@/db';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { getStatuses, getStatusByLabel } from './statuses';
import type { Status } from '@/db';

/**
 * Mapeia label de status de PESSOA → label equivalente em EMPRESA.
 *
 * Retorna null quando não há equivalente direto — chamador NÃO muda empresa
 * nesse caso (mantém estado atual).
 */
function mapPersonLabelToCompany(personLabel: string): string | null {
  const lower = personLabel.toLowerCase();
  switch (lower) {
    case 'reunião marcada':
    case 'reuniao marcada':
      return 'Reunião marcada';
    case 'fechado':
      return 'Fechado';
    case 'perdido':
      return 'Perdido';
    // Ativo/Lead/Quente/LinkedIn Lead não têm equivalente em empresa
    default:
      return null;
  }
}

/**
 * Recalcula status da empresa olhando todas as pessoas linkadas.
 *
 * Algoritmo:
 *  1. Pega todas as pessoas ativas (não archived, não merged) da empresa
 *  2. Pra cada pessoa, mapeia status pra equivalente em empresa
 *  3. Filtra equivalentes não-null e não-terminais (pessoas vivas)
 *  4. Se há equivalentes vivos, pega o de sortOrder MAIOR como candidato
 *  5. Se todos são terminais (todas as pessoas estão Fechado/Perdido), pega
 *     o terminal de maior sortOrder como candidato
 *  6. Compara candidato com status atual da empresa:
 *     - Se candidato.sortOrder > atual.sortOrder → promove
 *     - Caso contrário → mantém (nunca regride)
 *
 * Side effect: insere activity de status_change na empresa quando muda.
 *
 * Falha silenciosa (try/catch) — não bloqueia o caller.
 */
export async function syncCompanyFromPeople(companyId: string): Promise<void> {
  try {
    const [companyRow] = await db
      .select({ statusId: companies.statusId })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);
    if (!companyRow) return;

    const linkedPeople = await db
      .select({ statusId: people.statusId })
      .from(people)
      .where(and(
        eq(people.companyId, companyId),
        eq(people.archived, false),
        isNull(people.mergedIntoId),
      ));

    if (linkedPeople.length === 0) return;

    const allPersonStatuses = await getStatuses('person');
    const allCompanyStatuses = await getStatuses('company');

    // Resolve cada pessoa pra equivalente em empresa
    const candidates: Status[] = [];
    for (const row of linkedPeople) {
      if (!row.statusId) continue;
      const personStatus = allPersonStatuses.find((s) => s.id === row.statusId);
      if (!personStatus) continue;
      const equivLabel = mapPersonLabelToCompany(personStatus.label);
      if (!equivLabel) continue;
      const equiv = allCompanyStatuses.find((s) => s.label.toLowerCase() === equivLabel.toLowerCase());
      if (equiv) candidates.push(equiv);
    }

    if (candidates.length === 0) return; // nenhum equivalente — mantém empresa atual

    // Prioriza não-terminais (pessoas vivas vencem terminais)
    const alive = candidates.filter((s) => !s.isTerminal);
    const pool = alive.length > 0 ? alive : candidates;
    // Maior sortOrder entre os candidatos elegíveis
    const desired = pool.reduce((max, s) => s.sortOrder > max.sortOrder ? s : max, pool[0]);

    const currentCompanyStatus = companyRow.statusId
      ? allCompanyStatuses.find((s) => s.id === companyRow.statusId)
      : null;

    // Não regride: só promove se desired.sortOrder > current.sortOrder.
    // Se atual é terminal, só muda pra outro terminal mais avançado.
    if (currentCompanyStatus && desired.sortOrder <= currentCompanyStatus.sortOrder) {
      return;
    }

    await db
      .update(companies)
      .set({ statusId: desired.id, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await db.insert(activities).values({
      companyId,
      type: 'status_change',
      weight: 0,
      source: 'system',
      data: {
        fromId: currentCompanyStatus?.id ?? null,
        toId: desired.id,
        toLabel: desired.label,
        reason: 'sync_from_people',
        entity: 'company',
      },
    });
  } catch (err) {
    console.error('[crm-sync.syncCompanyFromPeople] failed:', err);
  }
}

/**
 * Quando empresa vai pra status terminal (Fechado/Perdido), propaga pra todas
 * as pessoas linkadas que ainda não estão em terminal.
 *
 * Pessoas em terminal não-igual (ex: Perdido pessoal mas empresa fechou) NÃO
 * são tocadas — terminal de pessoa é decisão própria.
 *
 * Falha silenciosa.
 */
export async function propagateTerminalToCompanyPeople(
  companyId: string,
  newCompanyStatusId: string,
): Promise<void> {
  try {
    const allCompanyStatuses = await getStatuses('company');
    const newStatus = allCompanyStatuses.find((s) => s.id === newCompanyStatusId);
    if (!newStatus || !newStatus.isTerminal) return;

    // Resolve equivalente em pessoa pelo label (Fechado/Perdido)
    const personEquivalent = await getStatusByLabel('person', newStatus.label);
    if (!personEquivalent) return;

    const allPersonStatuses = await getStatuses('person');
    const terminalIds = allPersonStatuses.filter((s) => s.isTerminal).map((s) => s.id);

    // Pega pessoas linkadas que NÃO estão em nenhum terminal
    const targets = await db
      .select({ id: people.id, statusId: people.statusId })
      .from(people)
      .where(and(
        eq(people.companyId, companyId),
        eq(people.archived, false),
        isNull(people.mergedIntoId),
      ));

    const toUpdate = targets.filter((p) =>
      !p.statusId || !terminalIds.includes(p.statusId),
    );

    if (toUpdate.length === 0) return;

    const ids = toUpdate.map((p) => p.id);
    await db
      .update(people)
      .set({ statusId: personEquivalent.id, updatedAt: new Date() })
      .where(inArray(people.id, ids));

    // Activity em cada pessoa pra auditoria
    await db.insert(activities).values(
      toUpdate.map((p) => ({
        personId: p.id,
        companyId,
        type: 'status_change',
        weight: 0,
        source: 'system' as const,
        data: {
          fromId: p.statusId,
          toId: personEquivalent.id,
          toLabel: personEquivalent.label,
          reason: 'propagated_from_company_terminal',
        },
      })),
    );
  } catch (err) {
    console.error('[crm-sync.propagateTerminalToCompanyPeople] failed:', err);
  }
}
