/**
 * Catálogo de templates do Playbook de Employee-Led Growth (spec §6).
 *
 * Cada template-key resolve um conjunto de copys e items condicionais.
 * O `template_key` é gravado em playbook_outputs e usado pra renderizar
 * a página /playbook/[slug] — fixar a chave garante que páginas antigas
 * continuem visíveis mesmo se a gente revisar templates depois.
 *
 * ════════════════════════════════════════════════════════════════════════════
 *                              ⚠️  COPY PENDENTE  ⚠️
 * ════════════════════════════════════════════════════════════════════════════
 * Os strings marcados como `__COPY_TODO__` são placeholders pra a sessão
 * dedicada de copy editorial com a Clara (decisão pós-brainstorm, spec
 * Anexo C). A estrutura está PRONTA — só precisa preencher.
 *
 * Quando rodar a sessão de copy:
 *   1. Cada combinação `{area}-{dor}-{tentativas}` tem seu próprio bloco
 *      em `TEMPLATES` abaixo. Total: 9 combinações principais.
 *   2. Substituir cada `__COPY_TODO__` por copy real, mantendo as
 *      placeholders `{empresa}`, `{porte}`, etc — render engine injeta.
 *   3. Verificar que o build (tsc + lint) continua passando.
 *
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Formato da chave: `{area}-{dor-curta}-{tentativas-curta}`.
 *
 * Áreas (P3): marketing | growth | vendas | rh | employer_branding | comunicacao | outro
 *   → Agrupadas em 3 templates-base: marketing (mkt+growth+comunicacao), vendas, rh (rh+employer_branding).
 *   → 'outro' cai em marketing como fallback.
 *
 * Dores (P8): company_page_morta | cac_subindo | concorrente_dominando |
 *             vendedor_invisivel | talento_saindo | marca_uma_pessoa | outra
 *
 * Tentativas (P7): nunca | morreu | baixa_adesao | maduro
 *   → Compactadas pra 'nunca' | 'morreu' no template-key (baixa_adesao e
 *      maduro caem em 'morreu' por similaridade — querem otimizar/destravar).
 */

import type { ChecklistItem } from './types';

export type TemplateBase = 'marketing' | 'vendas' | 'rh';
export type TemplateKey =
  | 'marketing-cac-nunca'
  | 'marketing-cac-morreu'
  | 'marketing-companypage-nunca'
  | 'marketing-companypage-morreu'
  | 'marketing-concorrente-nunca'
  | 'vendas-coldoutreach-nunca'
  | 'vendas-vendedorvisivel-morreu'
  | 'rh-talento-nunca'
  | 'rh-talento-morreu'
  | 'transversal-marca-uma-pessoa';

/**
 * Bloco de copy condicional por template. Os campos abaixo são
 * lidos pelo render engine (`renderPlaybookData`) e injetados em RenderedData.
 */
export type Template = {
  base: TemplateBase;
  /** Frase contextual de fechamento do snapshot (Bloco 2). */
  snapshotFechamento: string;
  /** Lista de 5 itens "antes" — pode ser sobrescrita por overlays condicionais (tentativas). */
  checklistAntes: ChecklistItem[];
};

/** Placeholder textual sinalizando que a copy ainda precisa ser escrita. */
const TODO = '__COPY_TODO__';

/** Checklist "antes" placeholder — substituir na sessão de copy. */
const PLACEHOLDER_ANTES: ChecklistItem[] = [
  { titulo: TODO, descricao: TODO, prazo: TODO },
  { titulo: TODO, descricao: TODO, prazo: TODO },
  { titulo: TODO, descricao: TODO, prazo: TODO },
  { titulo: TODO, descricao: TODO, prazo: TODO },
  { titulo: TODO, descricao: TODO, prazo: TODO },
];

/**
 * Os 4 itens "na Boldfy" são FIXOS — não variam entre templates.
 * Copy provisória que a sessão de copy pode refinar, mas a estrutura é definitiva.
 */
export const CHECKLIST_BOLDFY: ChecklistItem[] = [
  {
    titulo: 'Setup do Brand Context',
    descricao: 'Configurar tom de voz, tópicos permitidos, restrições e persona de marca dentro do app. Guia a IA contextual.',
    prazo: '1h',
  },
  {
    titulo: 'Onboarding dos pilotos via trilhas LXP',
    descricao: 'Cada colaborador completa a trilha de marca pessoal + estratégia de conteúdo. IA assiste, plataforma guia.',
    prazo: '~30min/colab',
  },
  {
    titulo: 'Primeiras missões semanais',
    descricao: 'Missões geram pontos, ranking e prêmio do mês — rodam automático depois do setup. Cria hábito sem cobrança manual.',
    prazo: 'roda sozinho',
  },
  {
    titulo: 'Dashboard de earned media na 1ª reunião do mês 2',
    descricao: 'Métricas de impressões, alcance e valor equivalente em R$ pra defender a estratégia internamente.',
    prazo: '30 dias',
  },
];

/**
 * Mapa principal de templates. Cada entry é uma combinação de área × dor ×
 * tentativas (com tentativas agrupado em "nunca" e "morreu" pra reduzir
 * matriz). Quando a copy editorial chegar, basta sobrescrever os strings TODO.
 */
export const TEMPLATES: Record<TemplateKey, Template> = {
  // ═══════════════ MARKETING — 3 dores principais ═══════════════
  'marketing-cac-nunca': {
    base: 'marketing',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'marketing-cac-morreu': {
    base: 'marketing',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'marketing-companypage-nunca': {
    base: 'marketing',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'marketing-companypage-morreu': {
    base: 'marketing',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'marketing-concorrente-nunca': {
    base: 'marketing',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },

  // ═══════════════ VENDAS — 2 dores principais ═══════════════
  'vendas-coldoutreach-nunca': {
    base: 'vendas',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'vendas-vendedorvisivel-morreu': {
    base: 'vendas',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },

  // ═══════════════ RH — 2 cenários (nunca/morreu) ═══════════════
  'rh-talento-nunca': {
    base: 'rh',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
  'rh-talento-morreu': {
    base: 'rh',
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },

  // ═══════════════ TRANSVERSAL — dor "marca depende de uma pessoa" ═══════════════
  // Usa o template-base da área do respondente como fundo, mas com fechamento próprio
  // (pega founder-led growth como narrativa central).
  'transversal-marca-uma-pessoa': {
    base: 'marketing', // fallback de área quando dor é transversal
    snapshotFechamento: TODO,
    checklistAntes: PLACEHOLDER_ANTES,
  },
};
