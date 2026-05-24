/**
 * Render engine do Playbook de Employee-Led Growth (spec §6).
 *
 * Duas responsabilidades:
 *   1. `resolveTemplateKey(quizData)` — escolhe qual `template_key` aplicar
 *      pra um conjunto específico de respostas (combinação area × dor × tent).
 *   2. `renderPlaybookData(quizData, templateKey)` — gera o JSON `RenderedData`
 *      (snapshot, hero, checklist, calculadora, etc) que vira o conteúdo
 *      visual da página /playbook/[slug].
 *
 * Por que separar:
 *   - resolveTemplateKey é puro/determinístico (só leitura de quizData).
 *   - renderPlaybookData faz cálculos (earned media, formatação) + escolhe
 *     copy do catálogo de templates.
 *
 * O resultado é gravado em playbook_outputs.rendered_data — snapshot fixo
 * no momento do submit. Atualizar templates depois não muda páginas antigas
 * (decisão de spec §11 — não força re-render retroativo).
 */

import { CHECKLIST_BOLDFY, TEMPLATES } from './templates';
import type { TemplateBase, TemplateKey } from './templates';
import type { ChecklistItem, RenderedData } from './templates/types';

/* -------------------------------------------------------------------------- */
/*  Input shape (mirror do PlaybookEmployeeLedGrowthLeadSchema sem identidade) */
/* -------------------------------------------------------------------------- */

export type PlaybookQuizData = {
  porteColaboradores: number;
  cargoSenioridade: 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level';
  cargoArea: 'marketing' | 'growth' | 'vendas' | 'rh' | 'employer_branding' | 'comunicacao' | 'outro';
  setor: string;
  colaboradoresPostando: 'nenhum' | '1_3' | '4_10' | 'mais_10' | 'nao_sei';
  vozAtual: 'founder_solo' | 'alguns_executivos' | 'time_esparso' | 'ninguem' | 'programa_rodando';
  tentativasAnteriores: 'nunca' | 'morreu' | 'baixa_adesao' | 'maduro';
  dorPrincipal:
    | 'company_page_morta'
    | 'cac_subindo'
    | 'concorrente_dominando'
    | 'vendedor_invisivel'
    | 'talento_saindo'
    | 'marca_uma_pessoa'
    | 'outra';
  resultadosPrioritarios: Array<
    'awareness' | 'pipeline' | 'reducao_paid' | 'talento' | 'autoridade' | 'engajamento'
  >;
  budgetStatus: 'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget';
  sponsorshipLideranca: 'sim_alguns_postam' | 'sim_com_ajuda' | 'talvez' | 'nao';
  observacoesLivres?: string;
};

/* -------------------------------------------------------------------------- */
/*  resolveTemplateKey                                                         */
/* -------------------------------------------------------------------------- */

function areaToBase(area: PlaybookQuizData['cargoArea']): TemplateBase {
  switch (area) {
    case 'marketing':
    case 'growth':
    case 'comunicacao':
      return 'marketing';
    case 'vendas':
      return 'vendas';
    case 'rh':
    case 'employer_branding':
      return 'rh';
    case 'outro':
      return 'marketing'; // fallback consciente
  }
}

/**
 * Mapeia tentativas anteriores pra eixo "nunca" vs "morreu" (spec §6.1).
 *
 * Por que agrupar 'baixa_adesao' e 'maduro' em 'morreu':
 *   Os dois precisam de plano pra DESTRAVAR adesão (não pra começar do zero).
 *   Receita prática é a mesma — diagnosticar o que falta e ajustar.
 */
function tentativasToShort(t: PlaybookQuizData['tentativasAnteriores']): 'nunca' | 'morreu' {
  return t === 'nunca' ? 'nunca' : 'morreu';
}

/**
 * Resolve template-key a partir das respostas do quiz. Mapeamento principal
 * é area × dor × tentativas, com fallbacks pra dores que não têm template
 * específico (caem no template "principal" da área).
 */
export function resolveTemplateKey(quiz: PlaybookQuizData): TemplateKey {
  const base = areaToBase(quiz.cargoArea);
  const t = tentativasToShort(quiz.tentativasAnteriores);

  // Dor transversal — funciona pra qualquer área. Cap específico.
  if (quiz.dorPrincipal === 'marca_uma_pessoa') {
    return 'transversal-marca-uma-pessoa';
  }

  // Marketing
  if (base === 'marketing') {
    if (quiz.dorPrincipal === 'cac_subindo') {
      return t === 'nunca' ? 'marketing-cac-nunca' : 'marketing-cac-morreu';
    }
    if (quiz.dorPrincipal === 'company_page_morta') {
      return t === 'nunca' ? 'marketing-companypage-nunca' : 'marketing-companypage-morreu';
    }
    if (quiz.dorPrincipal === 'concorrente_dominando') {
      return 'marketing-concorrente-nunca'; // fallback p/ qualquer tentativas
    }
    // Fallback marketing genérico (dor='outra' ou dores não-mkt em respondente mkt)
    return t === 'nunca' ? 'marketing-cac-nunca' : 'marketing-cac-morreu';
  }

  // Vendas
  if (base === 'vendas') {
    if (quiz.dorPrincipal === 'vendedor_invisivel') {
      return t === 'nunca' ? 'vendas-coldoutreach-nunca' : 'vendas-vendedorvisivel-morreu';
    }
    // Fallback vendas
    return t === 'nunca' ? 'vendas-coldoutreach-nunca' : 'vendas-vendedorvisivel-morreu';
  }

  // RH / Employer Branding
  if (base === 'rh') {
    if (quiz.dorPrincipal === 'talento_saindo') {
      return t === 'nunca' ? 'rh-talento-nunca' : 'rh-talento-morreu';
    }
    // Fallback RH
    return t === 'nunca' ? 'rh-talento-nunca' : 'rh-talento-morreu';
  }

  // Defensive — TypeScript exhaustiveness fallback
  return 'marketing-cac-nunca';
}

/* -------------------------------------------------------------------------- */
/*  Cálculo de earned media (números do hero — spec §5 Bloco 1)               */
/* -------------------------------------------------------------------------- */

/**
 * CPM médio LinkedIn Brasil (R$/mil impressões). Mantém em paridade com
 * `LINKEDIN_CPM_PER_IMPRESSION` usado no <RoiSimulator />. Fonte: kb-10 + brand-sheet.
 */
const LINKEDIN_CPM_BRL = 300;
const IMPRESSIONS_PER_COLAB_DEFAULT = 10_000;

function calcEarnedMediaMensal(porteColaboradores: number): number {
  // Estimativa conservadora: 30% dos colaboradores ativados × 10k impressões/mês
  // × R$0,30/impressão. Bate com a calculadora padrão.
  const ativados = Math.round(porteColaboradores * 0.3);
  const impressoes = ativados * IMPRESSIONS_PER_COLAB_DEFAULT;
  const valor = impressoes * (LINKEDIN_CPM_BRL / 1000);
  return Math.round(valor);
}

function formatBRL(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/* -------------------------------------------------------------------------- */
/*  Formatadores de pretty-strings (Bloco 2 — snapshot)                       */
/* -------------------------------------------------------------------------- */

function areaPretty(area: PlaybookQuizData['cargoArea']): string {
  return ({
    marketing: 'Marketing',
    growth: 'Growth',
    vendas: 'Vendas',
    rh: 'RH / People',
    employer_branding: 'Employer Branding',
    comunicacao: 'Comunicação',
    outro: 'Time',
  } as const)[area];
}

function vozAtualPretty(voz: PlaybookQuizData['vozAtual']): string {
  return ({
    founder_solo: 'Founder solo',
    alguns_executivos: 'Alguns executivos',
    time_esparso: 'Time esparso',
    ninguem: 'Silêncio',
    programa_rodando: 'Programa rodando',
  } as const)[voz];
}

function tentativasPretty(t: PlaybookQuizData['tentativasAnteriores']): string {
  return ({
    nunca: 'Nunca tentaram estruturar',
    morreu: 'Já tentou e o programa morreu',
    baixa_adesao: 'Programa rodando com baixa adesão',
    maduro: 'Programa maduro — quer otimizar',
  } as const)[t];
}

/* -------------------------------------------------------------------------- */
/*  Outras áreas (Bloco 6 — "e ainda resolve pra...")                         */
/* -------------------------------------------------------------------------- */

function outrasAreas(base: TemplateBase): RenderedData['outrasAreas'] {
  const todas: Array<{ slug: 'marketing' | 'vendas' | 'rh'; pretty: string }> = [
    { slug: 'marketing', pretty: 'Marketing' },
    { slug: 'vendas', pretty: 'Vendas' },
    { slug: 'rh', pretty: 'RH / People' },
  ];
  return todas.filter((a) => a.slug !== base);
}

/* -------------------------------------------------------------------------- */
/*  renderPlaybookData                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Constrói o JSON RenderedData a partir do quiz + template-key.
 *
 * Inputs derivados (porteColaboradores, dor, tentativas) saem das respostas.
 * Copy editorial vem do TEMPLATES catalog (placeholders enquanto a sessão
 * de copy não rodou — vai ser substituída quando os 9 templates ficarem prontos).
 *
 * @param empresa - Nome da empresa (vem do gate de identificação).
 */
export function renderPlaybookData(
  quiz: PlaybookQuizData,
  templateKey: TemplateKey,
  empresa: string,
): RenderedData {
  const template = TEMPLATES[templateKey];

  // Hero — número-soco varia por dor. Pra v1 (sem copy editorial ainda),
  // sempre uso earned media perdido como soco — é o número mais universal.
  const earnedMensal = calcEarnedMediaMensal(quiz.porteColaboradores);
  const hero = {
    headlineEmpresa: empresa,
    socoNumero: formatBRL(earnedMensal),
    socoLabel: 'em earned media na mesa por mês',
  };

  // Snapshot
  const snapshot: RenderedData['snapshot'] = {
    porte: quiz.porteColaboradores,
    portePretty: `${quiz.porteColaboradores} colaboradores`,
    areaPretty: areaPretty(quiz.cargoArea),
    vozAtualPretty: vozAtualPretty(quiz.vozAtual),
    tentativasPretty: tentativasPretty(quiz.tentativasAnteriores),
    paragrafoConector: template.snapshotFechamento,
  };

  // Checklist antes — do template. Overlay condicional: se tentou e morreu,
  // adiciona item-zero (spec §5 Bloco 4).
  const checklistAntes: ChecklistItem[] = [...template.checklistAntes];
  if (quiz.tentativasAnteriores === 'morreu') {
    checklistAntes.unshift({
      titulo: 'Antes de tudo: mapear o que matou o programa anterior',
      descricao: 'Sem entender qual dos 3 motivos (porquê, como, ferramenta) faltou, esse plano também morre. Conversa de 30min com quem participou.',
      prazo: '30min',
    });
  }

  // Calculadora — defaults do RoiSimulator (clamp 5-70 igual ao componente).
  const calculadora = {
    initialCollaborators: Math.max(5, Math.min(70, quiz.porteColaboradores)),
    initialImpressions: IMPRESSIONS_PER_COLAB_DEFAULT,
  };

  return {
    hero,
    snapshot,
    checklistAntes,
    checklistBoldfy: CHECKLIST_BOLDFY,
    calculadora,
    outrasAreas: outrasAreas(template.base),
  };
}
