/**
 * Mapa estático tag AC → automation name.
 *
 * Quando o webhook AC dispara `contact_tag` (tag adicionada a contato), o
 * handler em /api/webhooks/ac olha aqui pra descobrir se essa tag dispara
 * alguma automation conhecida. Se sim, emite activity `automation_started`
 * com o nome da automation pra timeline ficar legível ("🔄 Entrou na
 * cadência X" em vez de só "Tag X adicionada").
 *
 * Adicionar 1 entrada aqui pra cada automation nova criada no AC. Manter
 * o NOME LEGÍVEL da automation (vai aparecer literal na timeline pro time).
 *
 * Spec §6 + §11.A do crm-source-of-truth-fluxo-form.
 */

export const AC_TAG_TO_AUTOMATION: Record<string, string> = {
  // Cadência atual de nurturing pós-Report (E1 entrega PDF, E2-E5 aprofundam
  // pra Líder B2B; outros segments encerram no E1).
  'Form: Algoritmo LinkedIn 2026': 'Cadência Algoritmo LinkedIn',
};

/**
 * Lookup direto (case-sensitive). Retorna nome legível da automation ou
 * null se a tag não está mapeada (caller pode optar por ignorar o evento
 * ou emitir activity genérica `tag_added` em vez de `automation_started`).
 */
export function automationForTag(tag: string): string | null {
  return AC_TAG_TO_AUTOMATION[tag] ?? null;
}
