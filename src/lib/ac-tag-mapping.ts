/**
 * Mapa estático tag AC → activity legível na timeline do CRM.
 *
 * Duas famílias de tags são interpretadas pelo webhook `/api/webhooks/ac`
 * quando elas são adicionadas a um contato:
 *
 * --- 1. Tags de FORM (entrada na cadência) ---
 *
 * Quando o adapter inscreve o lead numa lista de cadência, o AC dispara a
 * automation correspondente, que aplica a tag-mãe (`Form: X`). O webhook
 * registra activity `automation_started` com o nome legível dessa cadência.
 *
 * Mapa: `AC_TAG_TO_AUTOMATION` (lookup direto, case-sensitive).
 *
 * --- 2. Tags de CADÊNCIA CONCLUÍDA (saída da cadência) ---
 *
 * Padrão: **tag no formato `Cadência: <Nome curto> concluída`** aplicada no
 * penúltimo passo da automation (antes do unsubscribe da lista). Padrão já
 * em uso no AC pra cadência do Algoritmo LinkedIn (`Cadência: Report
 * Algoritmo concluída`). Detecção via regex — não precisa registrar cada
 * cadência aqui, qualquer tag que bate com o padrão vira `cadence_completed`.
 *
 * Helper: `cadenceFromCompletedTag(tag)` extrai o nome legível.
 *
 * Exemplos:
 *   tag "Cadência: Playbook TLG concluída"      → cadence_name = "Cadência Playbook TLG"
 *   tag "Cadência: Case Semrush concluída"      → cadence_name = "Cadência Case Semrush"
 *   tag "Cadência: Report Algoritmo concluída"  → cadence_name = "Cadência Report Algoritmo"
 *
 * --- Como adicionar nova cadência ---
 *
 * Form novo dispara cadência nova:
 *   1. Adiciona entrada em `AC_TAG_TO_AUTOMATION` (mapeia tag-mãe ao nome
 *      legível da cadência) — pra timeline mostrar "Entrou na cadência X".
 *   2. Cria no AC a tag `Cadência: <Nome curto> concluída` (aplicada no
 *      penúltimo passo da automation) — webhook detecta o padrão automaticamente.
 *   3. Nenhum código além do mapa precisa ser tocado.
 *
 * Spec §6 + §11.A do crm-source-of-truth-fluxo-form.
 */

/* -------------------------------------------------------------------------- */
/*  1. Tags de FORM → nome legível da cadência (entrada)                       */
/* -------------------------------------------------------------------------- */

export const AC_TAG_TO_AUTOMATION: Record<string, string> = {
  // Form: X → "Entrou na cadência <nome legível>"
  'Form: Algoritmo LinkedIn 2026': 'Cadência Report Algoritmo LinkedIn',
  'Form: Case Semrush TLG': 'Cadência Case Semrush',
  'Form: Playbook Team-Led Growth': 'Cadência Playbook TLG',
};

/**
 * Lookup direto. Retorna nome legível da cadência (entrada) ou null se a
 * tag não está mapeada.
 */
export function automationForTag(tag: string): string | null {
  return AC_TAG_TO_AUTOMATION[tag] ?? null;
}

/* -------------------------------------------------------------------------- */
/*  2. Tag de CADÊNCIA CONCLUÍDA (saída) — detecção via padrão                 */
/* -------------------------------------------------------------------------- */

/**
 * Regex que detecta tags no formato `Cadência: <Nome curto> concluída`.
 * Padrão definido pela Clara em mai/2026, já em uso no AC pra cadência do
 * Algoritmo LinkedIn (`Cadência: Report Algoritmo concluída`).
 *
 * Capturas:
 *   - Grupo 1: nome curto da cadência (`Report Algoritmo`, `Playbook TLG`, etc).
 *
 * Case-insensitive em "concluída/concluida" (com ou sem acento) pra robustez.
 */
const COMPLETED_TAG_PATTERN = /^Cadência:\s+(.+?)\s+conclu[íi]da\s*$/;

/**
 * Detecta se a tag é de "cadência concluída" e extrai o nome legível.
 *
 * Padrão: `Cadência: <Nome curto> concluída`.
 * Ex: `Cadência: Playbook TLG concluída` → retorna "Cadência Playbook TLG".
 *     `Cadência: Report Algoritmo concluída` → retorna "Cadência Report Algoritmo".
 *
 * Retorna null se a tag não bate com o padrão (= não é evento de conclusão).
 */
export function cadenceFromCompletedTag(tag: string): string | null {
  const match = tag.match(COMPLETED_TAG_PATTERN);
  if (!match) return null;
  const shortName = match[1].trim();
  if (!shortName) return null;
  return `Cadência ${shortName}`;
}
