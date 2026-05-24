/**
 * Render engine do Playbook de Employee-Led Growth.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md +
 *       source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 *
 * Responsabilidades:
 *   1. `resolveTemplateKey(quizData)` — escolhe `template_key` (mantido pra
 *      analytics; conteúdo da página vem da copy editorial estática + dicas
 *      selecionadas, não mais de templates hardcoded).
 *   2. `selectTipsForPlaybook(quizData)` — biblioteca de dicas filtradas pelas
 *      regras da seção 2.4 do copy-final.
 *   3. `ativacaoTypicaPercent(porte)` + `calcColabAtivos(porte)` — curva de
 *      ativação por porte (não 30% fixo).
 *   4. `renderPlaybookData(...)` — monta o JSON `RenderedData` completo a
 *      partir das respostas + empresa.
 *
 * O resultado é gravado em `playbook_outputs.rendered_data` no submit.
 * Atualizar templates depois NÃO muda páginas antigas (snapshot fixo).
 */

import {
  CHECKLIST_BOLDFY,
  CTA_TITULO_POR_DOR,
  HERO_LEGENDA_POR_DOR,
  SNAPSHOT_FECHAMENTO,
  TESE_MOTIVOS,
  TIPS_LIBRARY,
  type DorPrincipalValue,
  type TemplateKey,
} from './templates';
import type {
  BattleCard,
  ChecklistItem,
  CurvaAtivacao,
  RenderedData,
  Tip,
} from './templates/types';

/* -------------------------------------------------------------------------- */
/*  Input shape (mirror do PlaybookEmployeeLedGrowthLeadSchema sem identidade) */
/* -------------------------------------------------------------------------- */

export type PlaybookQuizData = {
  porteColaboradores: number;
  cargoSenioridade: 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level';
  cargoArea:
    | 'marketing' | 'growth' | 'vendas' | 'rh' | 'employer_branding' | 'comunicacao' | 'outro';
  setor: string;
  colaboradoresPostando: 'nenhum' | '1_3' | '4_10' | 'mais_10' | 'nao_sei';
  vozAtual:
    | 'founder_solo' | 'alguns_executivos' | 'time_esparso' | 'ninguem' | 'programa_rodando';
  tentativasAnteriores: 'nunca' | 'morreu' | 'baixa_adesao' | 'maduro';
  /** P8 multi (mai/2026) — primeira dor define template-key + hero soco + CTA título. */
  doresPrincipais: DorPrincipalValue[];
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

type TemplateBase = 'marketing' | 'vendas' | 'rh';

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
 * 'baixa_adesao' e 'maduro' caem em 'morreu' — querem destravar adesão, não
 * começar do zero. Receita prática é a mesma.
 */
function tentativasToShort(t: PlaybookQuizData['tentativasAnteriores']): 'nunca' | 'morreu' {
  return t === 'nunca' ? 'nunca' : 'morreu';
}

/**
 * Resolve template-key a partir do quiz. Usa SEMPRE `doresPrincipais[0]`
 * (a primeira dor selecionada) como dor primária — a segunda dor entra
 * via `selectTipsForPlaybook` (gera dica específica adicional).
 */
export function resolveTemplateKey(quiz: PlaybookQuizData): TemplateKey {
  const base = areaToBase(quiz.cargoArea);
  const t = tentativasToShort(quiz.tentativasAnteriores);
  const dor1 = quiz.doresPrincipais[0];

  // Dor transversal — funciona pra qualquer área. Cap específico.
  if (dor1 === 'marca_uma_pessoa') {
    return 'transversal-marca-uma-pessoa';
  }

  // Marketing
  if (base === 'marketing') {
    if (dor1 === 'cac_subindo') {
      return t === 'nunca' ? 'marketing-cac-nunca' : 'marketing-cac-morreu';
    }
    if (dor1 === 'company_page_morta') {
      return t === 'nunca' ? 'marketing-companypage-nunca' : 'marketing-companypage-morreu';
    }
    if (dor1 === 'concorrente_dominando') {
      return 'marketing-concorrente-nunca';
    }
    return t === 'nunca' ? 'marketing-cac-nunca' : 'marketing-cac-morreu';
  }

  // Vendas
  if (base === 'vendas') {
    return t === 'nunca' ? 'vendas-coldoutreach-nunca' : 'vendas-vendedorvisivel-morreu';
  }

  // RH / Employer Branding
  if (base === 'rh') {
    return t === 'nunca' ? 'rh-talento-nunca' : 'rh-talento-morreu';
  }

  // Defensive exhaustiveness fallback
  return 'marketing-cac-nunca';
}

/* -------------------------------------------------------------------------- */
/*  selectTipsForPlaybook — regras da seção 2.4 do copy-final                  */
/* -------------------------------------------------------------------------- */

/**
 * Mapa de dor → id de tip dor-específica.
 *
 * Espaços em branco intencionais:
 *   - 'vendedor_invisivel' → não tem dica dor-específica (A_VENDAS cobre)
 *   - 'marca_uma_pessoa' → V_FOUNDER_SOLO entra via regra de voz, não de dor
 *   - 'outra' → sem dica (princípio editorial §4.12: outras dores não-
 *     auto-diagnosticáveis viram dicas universais como U2 'posicionamento')
 */
const DOR_TO_TIP_ID: Partial<Record<DorPrincipalValue, string>> = {
  cac_subindo: 'D_CAC',
  company_page_morta: 'D_COMPANYPAGE',
  concorrente_dominando: 'D_CONCORRENTE',
  talento_saindo: 'D_TALENTO',
};

const AREA_TO_TIP_ID: Record<TemplateBase, string> = {
  marketing: 'A_MARKETING',
  vendas: 'A_VENDAS',
  rh: 'A_RH',
};

/**
 * Seleciona dicas pra um playbook com base no quiz. Ordem:
 *   1. 5 universais (sempre, U1-U5)
 *   2. Tentativas (T_MORREU se tentativas !== 'nunca')
 *   3. Área (A_MARKETING / A_VENDAS / A_RH conforme base)
 *   4. Dor-específicas (até 2, baseado em doresPrincipais)
 *   5. Voz (V_FOUNDER_SOLO se voz=founder_solo)
 *   6. Seniority (S_CLEVEL se cargoSenioridade=c_level)
 *
 * Cap teórico: 5 + 1 + 1 + 2 + 1 + 1 = 11. Em geral fica 6-9 dicas.
 * Numero ("Dica 01", "Dica 02", ...) é renumerado conforme ordem final.
 */
export function selectTipsForPlaybook(quiz: PlaybookQuizData): Tip[] {
  const selected: Tip[] = [];
  const pushUnique = (tip: Tip | undefined) => {
    if (!tip) return;
    if (selected.some((t) => t.id === tip.id)) return;
    selected.push(tip);
  };
  const findById = (id: string) => TIPS_LIBRARY.find((t) => t.id === id);

  // 1. Universais (sempre, na ordem U1-U5)
  for (const tip of TIPS_LIBRARY) {
    if (tip.selectors.universal) selected.push(tip);
  }

  // 2. Tentativas (qualquer coisa diferente de 'nunca' → T_MORREU)
  if (quiz.tentativasAnteriores !== 'nunca') {
    pushUnique(findById('T_MORREU'));
  }

  // 3. Área-específica (uma das 3)
  const base = areaToBase(quiz.cargoArea);
  pushUnique(findById(AREA_TO_TIP_ID[base]));

  // 4. Dor-específicas (até 2 — depende do que vier em doresPrincipais)
  for (const dor of quiz.doresPrincipais) {
    const tipId = DOR_TO_TIP_ID[dor];
    if (tipId) pushUnique(findById(tipId));
  }

  // 5. Voz específica (founder_solo)
  if (quiz.vozAtual === 'founder_solo') {
    pushUnique(findById('V_FOUNDER_SOLO'));
  }

  // 6. Seniority específica (c_level)
  if (quiz.cargoSenioridade === 'c_level') {
    pushUnique(findById('S_CLEVEL'));
  }

  // Renumera "Dica 01" ... "Dica N" conforme ordem final
  return selected.map((tip, i) => ({
    ...tip,
    numero: `Dica ${String(i + 1).padStart(2, '0')}`,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Curva de ativação (spec copy-final §2.9 + §3)                              */
/* -------------------------------------------------------------------------- */

/**
 * Percentual de colaboradores tipicamente ativos em programa B2B sustentável.
 * Empresas menores têm pertencimento maior, escalas grandes acomodam ritmo.
 */
export function ativacaoTypicaPercent(porte: number): number {
  if (porte <= 20) return 0.35;
  if (porte <= 100) return 0.30;
  if (porte <= 300) return 0.22;
  return 0.17;
}

/** Pelo menos 1 colaborador (não retorna 0 mesmo pra porte=1, defesa em profundidade). */
export function calcColabAtivos(porte: number): number {
  return Math.max(1, Math.round(porte * ativacaoTypicaPercent(porte)));
}

function faixaLabelDePorte(porte: number): string {
  if (porte <= 20) return 'até 20 colaboradores';
  if (porte <= 100) return '21 a 100 colaboradores';
  if (porte <= 300) return '101 a 300 colaboradores';
  return '300+ colaboradores';
}

/* -------------------------------------------------------------------------- */
/*  Earned media (Hero soco)                                                   */
/* -------------------------------------------------------------------------- */

/**
 * CPM médio LinkedIn Brasil (R$/mil impressões). Mantém em paridade com
 * `LINKEDIN_CPM_PER_IMPRESSION` usado no <RoiSimulator />.
 */
const LINKEDIN_CPM_BRL = 300;
const IMPRESSIONS_PER_COLAB_DEFAULT = 10_000;

function calcEarnedMediaMensal(porteColaboradores: number): number {
  // Curva de ativação por porte (substitui o 30% fixo da v1).
  const ativados = calcColabAtivos(porteColaboradores);
  const impressoes = ativados * IMPRESSIONS_PER_COLAB_DEFAULT;
  const valor = impressoes * (LINKEDIN_CPM_BRL / 1000);
  return Math.round(valor);
}

function formatBRL(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/* -------------------------------------------------------------------------- */
/*  Battle card (Bloco 7) — economia de horas / FTE                            */
/* -------------------------------------------------------------------------- */

/**
 * Economia mensal aproximada em horas (admin + colaboradores).
 *
 * Premissas (spec copy-final §2.6):
 *   - Sem Boldfy: admin ~9h/sem; colab ~2h/post
 *   - Com Boldfy: admin ~1h/sem; colab ~0,5h/post (30min)
 *   - Postagem: 2 posts/sem por colaborador ativo
 *   - Mês: 4 semanas
 *
 * Pra empresa de 60 colab → 18 ativos × 2 posts/sem × 4 sem = 144 posts/mês.
 * Economia: admin (8h × 4 = 32h) + colab (1.5h × 144 = 216h) = 248h ≈ ~1,5 FTE.
 */
function calcBattleCard(porteColaboradores: number): BattleCard {
  const ativos = calcColabAtivos(porteColaboradores);
  const postsPorMes = ativos * 2 * 4; // 2 posts/sem × 4 sem

  // Admin: economia 8h/sem × 4 sem = 32h/mês
  const adminEconomiaMes = 8 * 4;
  // Colab: economia 1,5h por post (2h → 0,5h)
  const colabEconomiaMes = 1.5 * postsPorMes;

  const economiaTotalHoras = Math.round(adminEconomiaMes + colabEconomiaMes);
  // 1 FTE ≈ 160h/mês (8h × 5 × 4). Arredondar pra 1 decimal.
  const economiaFTEs = Math.round((economiaTotalHoras / 160) * 10) / 10;

  return {
    economiaMensalHoras: economiaTotalHoras,
    economiaFTEs,
  };
}

/* -------------------------------------------------------------------------- */
/*  Formatadores pretty (Bloco 2)                                              */
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
    maduro: 'Programa maduro, quer otimizar',
  } as const)[t];
}

function outrasAreas(base: TemplateBase): RenderedData['outrasAreas'] {
  const todas: Array<{ slug: 'marketing' | 'vendas' | 'rh'; pretty: string }> = [
    { slug: 'marketing', pretty: 'Marketing' },
    { slug: 'vendas', pretty: 'Vendas' },
    { slug: 'rh', pretty: 'RH / People' },
  ];
  return todas.filter((a) => a.slug !== base);
}

/* -------------------------------------------------------------------------- */
/*  Interpolador de copy ({empresa} → 'Lumify' etc)                           */
/* -------------------------------------------------------------------------- */

function interp(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/* -------------------------------------------------------------------------- */
/*  renderPlaybookData                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Constrói o JSON `RenderedData` a partir do quiz + template-key + empresa.
 *
 * Inputs derivados saem das respostas. Copy editorial vem dos catálogos em
 * `templates/index.ts` (SNAPSHOT_FECHAMENTO, HERO_LEGENDA_POR_DOR, etc).
 */
export function renderPlaybookData(
  quiz: PlaybookQuizData,
  templateKey: TemplateKey,
  empresa: string,
): RenderedData {
  const dor1 = quiz.doresPrincipais[0];

  // === Curva de ativação ===
  const colabAtivos = calcColabAtivos(quiz.porteColaboradores);
  const porcentagem = ativacaoTypicaPercent(quiz.porteColaboradores);
  const faixaLabel = faixaLabelDePorte(quiz.porteColaboradores);
  const curvaAtivacao: CurvaAtivacao = { colabAtivos, porcentagem, faixaLabel };

  // === Hero ===
  const earnedMensal = calcEarnedMediaMensal(quiz.porteColaboradores);
  const heroLegenda = interp(HERO_LEGENDA_POR_DOR[dor1] ?? HERO_LEGENDA_POR_DOR.outra, { empresa });
  const hero = {
    headlineEmpresa: empresa,
    socoNumero: formatBRL(earnedMensal),
    socoLabel: heroLegenda,
  };

  // === Snapshot ===
  const snapshot: RenderedData['snapshot'] = {
    porte: quiz.porteColaboradores,
    portePretty: `${quiz.porteColaboradores} colaboradores`,
    areaPretty: areaPretty(quiz.cargoArea),
    vozAtualPretty: vozAtualPretty(quiz.vozAtual),
    tentativasPretty: tentativasPretty(quiz.tentativasAnteriores),
    paragrafoConector: SNAPSHOT_FECHAMENTO[templateKey],
  };

  // === Tese (fixo) ===
  const tese = { motivos: TESE_MOTIVOS };

  // === Dicas selecionadas ===
  const dicas = selectTipsForPlaybook(quiz);

  // === Checklist antes — começa em PLACEHOLDER (sessão de copy não fechou
  // os 5 itens variáveis por área × seniority × tentativas; vão entrar em
  // sessão de copy futura). Item-zero condicional quando tentou_morreu.
  const checklistAntes: ChecklistItem[] = [];
  if (quiz.tentativasAnteriores !== 'nunca') {
    checklistAntes.push({
      titulo: 'Antes de tudo, mapear o que matou o programa anterior',
      descricao:
        'Sem entender qual dos 3 motivos (porquê, como, ferramenta) faltou, esse plano também morre. Conversa de 30min com quem participou.',
      prazo: '30min',
    });
  }

  // === Calculadora ===
  const calculadora = {
    initialCollaborators: Math.max(5, Math.min(70, quiz.porteColaboradores)),
    initialImpressions: IMPRESSIONS_PER_COLAB_DEFAULT,
    colabAtivosEstimados: colabAtivos,
  };

  // === Battle card ===
  const battleCard = calcBattleCard(quiz.porteColaboradores);

  // === CTA ===
  const ctaTitulo = interp(CTA_TITULO_POR_DOR[dor1] ?? CTA_TITULO_POR_DOR.outra, { empresa });

  // === Outras áreas (Bloco 6 antigo virou parte do CTA / footer) ===
  const outras = outrasAreas(areaToBase(quiz.cargoArea));

  return {
    hero,
    heroLegenda,
    snapshot,
    curvaAtivacao,
    tese,
    dicas,
    checklistAntes,
    checklistBoldfy: CHECKLIST_BOLDFY,
    calculadora,
    battleCard,
    ctaTitulo,
    outrasAreas: outras,
  };
}
