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
  BANNER_SEM_BUDGET,
  CHECKLIST_BOLDFY,
  CHECKLIST_TENTOU_MORREU_ITEM,
  CTA_TITULO_POR_DOR,
  HERO_LEGENDA_POR_DOR,
  RESULTADOS_ESPERADOS,
  SETOR_APLICACAO,
  SNAPSHOT_FECHAMENTO,
  SOBRE_BOLDFY_SAAS,
  SOBRE_BOLDFY_CAAS,
  TESE_MOTIVOS,
  TIPS_LIBRARY,
  type DorPrincipalValue,
  type TemplateKey,
} from './templates';
import type {
  BannerOferta,
  BattleCard,
  ChecklistItem,
  CurvaAtivacao,
  RenderedData,
  SetorAplicacao,
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
  /**
   * P5 removida na curadoria (mai/2026). Mantida como opcional pra compat
   * retroativa de playbooks antigos no banco.
   */
  colaboradoresPostando?: 'nenhum' | '1_3' | '4_10' | 'mais_10' | 'nao_sei';
  vozAtual:
    | 'founder_solo' | 'alguns_executivos' | 'time_esparso' | 'ninguem' | 'programa_rodando';
  tentativasAnteriores: 'nunca' | 'morreu' | 'baixa_adesao' | 'maduro';
  /** P8 multi — primeira dor define template-key + hero soco + CTA título. */
  doresPrincipais: DorPrincipalValue[];
  /**
   * P9 removida na curadoria (mai/2026). Resultado agora é DERIVADO das dores.
   * Opcional pra compat retroativa.
   */
  resultadosPrioritarios?: Array<
    'awareness' | 'pipeline' | 'reducao_paid' | 'talento' | 'autoridade' | 'engajamento'
  >;
  budgetStatus: 'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget';
  /**
   * P11 reformulada (mai/2026): detector de oportunidade Full Content (CaaS).
   * Mantém valores antigos como union pra compat retroativa de playbooks no banco.
   */
  sponsorshipLideranca:
    // Valores novos
    | 'sim_proprio'
    | 'sim_full_content'
    | 'nao_foco'
    // Valores antigos (compat)
    | 'sim_alguns_postam'
    | 'sim_com_ajuda'
    | 'talvez'
    | 'nao';
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
 * Seleciona dicas pra um playbook com base no quiz. Ordem (após 3ª curadoria
 * mai/2026):
 *   1. S_CLEVEL EM DESTAQUE (primeiro card, largura total) quando aplicável
 *   2. 5 universais (sempre, U2/U4/U5/U7/U6)
 *   3. Dor-específicas reformuladas (até 2, dicas imperativas)
 *   4. Voz (V_FOUNDER_SOLO se voz=founder_solo)
 *   5. Sponsorship (L_PROPRIO ou L_FULL_CONTENT)
 *
 * SAÍRAM nessa curadoria:
 *   - A_MARKETING/A_VENDAS/A_RH → Bloco 3.5 (SETOR_APLICACAO via `resolveSetorAplicacao`)
 *   - T_MORREU → item condicional no checklistAntes (via `prependTentativasItem`)
 *   - B_SEM_BUDGET → banner acima da calculadora (via `resolveBannerSemBudget`)
 *   - B_PRECISA_JUSTIFICAR → resultado universal "case earned media"
 *
 * S_CLEVEL nova regra: aparece quando `cargoSenioridade === c_level` E
 * `vozAtual ∈ { founder_solo, alguns_executivos }` — se já tem programa
 * rodando ou time esparso, o C-level provavelmente já tá engajado.
 *
 * Cap teórico: 1 (CLevel) + 5 (universais) + 2 (dor) + 1 (voz) + 1 (sponsorship)
 * = 10 dicas. Em geral fica 6-9 dicas.
 */
export function selectTipsForPlaybook(quiz: PlaybookQuizData): Tip[] {
  const selected: Tip[] = [];
  const pushUnique = (tip: Tip | undefined) => {
    if (!tip) return;
    if (selected.some((t) => t.id === tip.id)) return;
    selected.push(tip);
  };
  const findById = (id: string) => TIPS_LIBRARY.find((t) => t.id === id);

  // 1. S_CLEVEL em destaque (primeira posição) — quando o respondente é
  //    C-level e a voz da empresa indica que ele provavelmente não posta.
  const isCLevelSemVoz =
    quiz.cargoSenioridade === 'c_level' &&
    (quiz.vozAtual === 'founder_solo' || quiz.vozAtual === 'alguns_executivos');
  if (isCLevelSemVoz) {
    pushUnique(findById('S_CLEVEL'));
  }

  // 2. Universais (5 — U2/U4/U5/U7/U6 na ordem do TIPS_LIBRARY)
  for (const tip of TIPS_LIBRARY) {
    if (tip.selectors.universal) pushUnique(tip);
  }

  // 3. Dor-específicas reformuladas (até 2 baseado em doresPrincipais).
  //    Agora rodam em modo imperativa (paragrafo + boldfyAjuda) em vez do
  //    accordion padrão. Áreas saíram (vão pro Bloco 3.5).
  for (const dor of quiz.doresPrincipais) {
    const tipId = DOR_TO_TIP_ID[dor];
    if (tipId) pushUnique(findById(tipId));
  }

  // 4. Voz específica (founder_solo)
  if (quiz.vozAtual === 'founder_solo') {
    pushUnique(findById('V_FOUNDER_SOLO'));
  }

  // 5. Sponsorship/Full Content específica (P11 reformulada mai/2026)
  if (quiz.sponsorshipLideranca === 'sim_proprio') {
    pushUnique(findById('L_PROPRIO'));
  } else if (quiz.sponsorshipLideranca === 'sim_full_content') {
    pushUnique(findById('L_FULL_CONTENT'));
  }

  // Post-process: injeta callout dinâmico na dica U7 (biblioteca de assets)
  // quando o porte cruza os thresholds de Modo Design grátis (40/60/70).
  // Mantém paridade com `DESIGN_FREE_THRESHOLDS` em components/proposal-builder.tsx
  // (single source of truth do bundle de design grátis pra plataforma).
  injectBibliotecaCallout(selected, quiz.porteColaboradores);

  // Renumera "Dica 01" ... "Dica N" conforme ordem final
  return selected.map((tip, i) => ({
    ...tip,
    numero: `Dica ${String(i + 1).padStart(2, '0')}`,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Modo Design grátis — thresholds por colaboradores ATIVOS estimados         */
/* -------------------------------------------------------------------------- */
/**
 * Tabela de pacotes inclusos no Modo Design. Avaliada contra o número de
 * **colaboradores ativos estimados** (via `calcColabAtivos`), não o porte
 * total — mesma base que a pessoa vai usar no proposal-builder pra não dar
 * info conflitante (lá ela mesma coloca a estimativa de ativos).
 *
 * - 40+ ativos estimados → Starter (4 peças/mês)
 * - 60+ ativos estimados → Growth (7 peças/mês)
 * - 70+ ativos estimados → Scale (10 peças/mês)
 *
 * Empresas abaixo de 40 ativos estimados não ganham bundle — a dica da
 * biblioteca renderiza sem callout (sem criar expectativa).
 *
 * Exemplos:
 *   porte 200 (curva 22%) → 44 ativos → Starter
 *   porte 273 (curva 22%) → 60 ativos → Growth
 *   porte 318 (curva 22%) → 70 ativos → Scale
 *   porte 100 (curva 30%) → 30 ativos → nenhum
 */
type DesignBundle = { pack: string; pieces: number; thresholdSeats: number };

function bundleFromAtivos(ativosEstimados: number): DesignBundle | null {
  if (ativosEstimados >= 70) return { pack: 'Scale', pieces: 10, thresholdSeats: 70 };
  if (ativosEstimados >= 60) return { pack: 'Growth', pieces: 7, thresholdSeats: 60 };
  if (ativosEstimados >= 40) return { pack: 'Starter', pieces: 4, thresholdSeats: 40 };
  return null;
}

function injectBibliotecaCallout(tips: Tip[], porte: number): void {
  const ativos = calcColabAtivos(porte);
  const bundle = bundleFromAtivos(ativos);
  if (!bundle) return; // ativos < 40: nenhum pacote grátis aplicável

  const tip = tips.find((t) => t.id === 'U7');
  if (!tip) return;

  // Imutabilidade: clona o tip antes de injetar callout. Caller ainda enxerga
  // o callout no array `tips` porque sobrescreve a referência in-place.
  const index = tips.indexOf(tip);
  tips[index] = {
    ...tip,
    boldfy: {
      ...tip.boldfy,
      callout: {
        // Style 'gift' faz o componente DicaCard renderizar com o
        // AnimatedGiftBox (caixinha animada extraída do MiniGift em
        // product-motion.tsx) em vez do pill default.
        label: `Sua empresa com mais de ${bundle.thresholdSeats} colaboradores ativos já ganharia o pacote ${bundle.pack} de design, com ${bundle.pieces} peças por mês prontas pra circular pela biblioteca`,
        style: 'gift',
      },
    },
  };
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
  // O snapshot é sobre a EMPRESA (não sobre o respondente), então o card 2
  // mostra o setor da empresa (Tech/SaaS, Fintech…). A área pessoal é
  // capturada implicitamente pelo template-key (e fica no `areaPretty`
  // pra compat retroativa de playbooks antigos).
  const snapshot: RenderedData['snapshot'] = {
    porte: quiz.porteColaboradores,
    portePretty: `${quiz.porteColaboradores} colaboradores`,
    areaPretty: areaPretty(quiz.cargoArea),
    setorPretty: quiz.setor || '—',
    vozAtualPretty: vozAtualPretty(quiz.vozAtual),
    tentativasPretty: tentativasPretty(quiz.tentativasAnteriores),
    paragrafoConector: SNAPSHOT_FECHAMENTO[templateKey],
  };

  // === Tese (fixo) ===
  const tese = { motivos: TESE_MOTIVOS };

  // === Dicas selecionadas ===
  const dicas = selectTipsForPlaybook(quiz);

  // === Checklist antes ===
  // 5 itens fixos validados na sessão de copy editorial (preview Lumify cac-morreu).
  // Variações por área × seniority × tentativas podem entrar em sessão futura,
  // mas a base atual funciona pros 10 templates (a primeira linha "Alinhar com
  // Vendas/RH" se adapta pelo nome da área via interpolação).
  //
  // Item-zero condicional (tentou_morreu) usa CHECKLIST_TENTOU_MORREU_ITEM
  // do templates/index.ts — conteúdo migrado da antiga dica T_MORREU na 3ª
  // curadoria mai/2026.
  const checklistAntes: ChecklistItem[] = [];
  if (quiz.tentativasAnteriores !== 'nunca') {
    checklistAntes.push(CHECKLIST_TENTOU_MORREU_ITEM);
  }
  // Os 5 itens-base. O primeiro varia o "parceiro interno" por área do respondente.
  const base = areaToBase(quiz.cargoArea);
  const parceiroInterno =
    base === 'marketing' ? 'Vendas (e RH, se for o caso)' :
    base === 'vendas'    ? 'Marketing' :
    /* base === 'rh' */    'Marketing';
  const parceiroExplicacao =
    base === 'marketing' ? 'Employee-Led Growth é canal de mídia, não comunicação interna nem cultura. Sem esse acordo prévio, Vendas trata como concorrência ao SDR e RH como tarefa de engajamento.' :
    base === 'vendas'    ? 'Sem esse alinhamento, vira "vendedor postando solto" e o conteúdo conflita com a estratégia editorial da empresa. Marketing precisa entrar pra cuidar dos pilares.' :
    /* rh */               'Sem Marketing, RH herda o projeto como cultura/comunicação interna. Com Marketing junto, vira canal de mídia que também atrai talento.';
  checklistAntes.push(
    {
      titulo: `Alinhar com ${parceiroInterno}`,
      descricao: `Senta 30min com cada head antes de envolver mais gente. ${parceiroExplicacao}`,
      prazo: '2 reuniões',
    },
    {
      titulo: 'Travar 1 C-level como sponsor real',
      descricao:
        'Sem manifesto bonito. Precisa de alguém da diretoria comprometido a postar 1x/semana e a aprovar pauta em até 24h. Programa que entra sem esse compromisso vê o ritmo cair entre o mês 2 e o mês 3.',
      prazo: '1 conversa',
    },
    {
      titulo: 'Selecionar primeiro grupo (5-8 colaboradores)',
      descricao:
        'Não tenta a empresa inteira de uma vez. Critério: SSI no LinkedIn acima de 30, pessoas que já postam pelo menos 1x/mês, ou os comunicativos naturais do time. O resto entra depois, vendo o primeiro grupo funcionar.',
      prazo: '1 semana',
    },
    {
      titulo: 'Decidir o pacote de recompensas iniciais',
      descricao:
        'Day-off, voucher iFood, assinatura Spotify, almoço com C-level, qualquer combinação que faça sentido pra cultura de vocês. Não precisa ser caro, precisa existir antes do primeiro post. Recompensa que aparece no mês 2 não funciona como recompensa, vira condicional duvidosa.',
      prazo: '1 reunião',
    },
    {
      titulo: quiz.tentativasAnteriores !== 'nunca'
        ? 'Apresentar a estratégia (com a lição do que morreu) pro primeiro grupo + sponsor'
        : 'Apresentar a estratégia pro primeiro grupo + sponsor',
      descricao: quiz.tentativasAnteriores !== 'nunca'
        ? '30min de pitch interno mostrando: o porquê novo, o que mudou desde a última vez (a Boldfy assume o operacional), o que cada um ganha pessoalmente. Mencionar explicitamente o programa anterior é o que evita o efeito "já tentamos isso e não funcionou" no time-teste.'
        : '30min de pitch interno mostrando: o porquê do programa, como rola no dia a dia, e o que cada um ganha pessoalmente. Alinhamento curto antes de subir.',
      prazo: '30min',
    },
  );

  // === Calculadora ===
  // initialCollaborators: usa colabAtivos (não porteColaboradores) — assim o
  // slider abre com o MESMO número que o header diz ("Considerando X
  // colaboradores ativos"). Antes abria com o porte total e dava incoerência:
  // header dizia 18 ativos, slider abria em 60.
  //
  // Clamp 5-70 é defesa em profundidade pros bounds do slider; o gate de
  // elegibilidade do quiz já filtra porte<5, e empresas gigantes (porte>411,
  // onde ativos>70) ficam clampadas — caso raro e aceitável.
  const calculadora = {
    initialCollaborators: Math.max(5, Math.min(70, colabAtivos)),
    initialImpressions: IMPRESSIONS_PER_COLAB_DEFAULT,
    colabAtivosEstimados: colabAtivos,
  };

  // === Battle card ===
  const battleCard = calcBattleCard(quiz.porteColaboradores);

  // === CTA ===
  const ctaTitulo = interp(CTA_TITULO_POR_DOR[dor1] ?? CTA_TITULO_POR_DOR.outra, { empresa });

  // === Resultados esperados (Bloco 4.5) ===
  // Estrutura desde mai/2026 (3ª curadoria):
  //   1. UNIVERSAIS — sempre aparecem (ganhos transversais do programa)
  //   2. POR DOR — 1 string por dor selecionada em P8 (até 2)
  //   3. POR BUDGET — 1 string condicional (sem_budget = oferta pacote beta)
  // Render dedupa caso uma string apareça nos dois lados (não acontece hoje,
  // mas defesa em profundidade).
  const resultadosUniversais = RESULTADOS_ESPERADOS.universais;
  const resultadosPorDor = quiz.doresPrincipais
    .map((d) => RESULTADOS_ESPERADOS.porDor[d])
    .filter((r): r is string => Boolean(r));
  const resultadoPorBudget = RESULTADOS_ESPERADOS.porBudget[quiz.budgetStatus];
  const resultadosEsperados = Array.from(
    new Set([
      ...resultadosUniversais,
      ...resultadosPorDor,
      ...(resultadoPorBudget ? [resultadoPorBudget] : []),
    ]),
  );

  // === Bloco 3.5: Setor aplicação (mai/2026 3ª curadoria) ===
  // Substitui as antigas dicas A_MARKETING/A_VENDAS/A_RH com layout
  // horizontal abaixo da tese (3 cards de motores fixos + dicas condicionais
  // por setor).
  const setorAplicacao = resolveSetorAplicacao(quiz);

  // === Bloco 6 banner: Sem budget (mai/2026 3ª curadoria) ===
  // Substitui a antiga dica B_SEM_BUDGET com banner acima da calculadora.
  const bannerSemBudget = resolveBannerSemBudget(quiz);

  // === Sobre a Boldfy (modalidades SaaS e CaaS — mai/2026) ===
  // SaaS sempre visível. CaaS aparece SE sponsorship = sim_full_content
  // (sinal de que líderes querem postar mas precisam de quem produza).
  const sobreBoldfy = {
    saas: SOBRE_BOLDFY_SAAS,
    caas: quiz.sponsorshipLideranca === 'sim_full_content' ? SOBRE_BOLDFY_CAAS : null,
  };

  // === Outras áreas (Bloco 6 antigo virou parte do CTA / footer) ===
  const outras = outrasAreas(areaToBase(quiz.cargoArea));

  return {
    hero,
    heroLegenda,
    snapshot,
    curvaAtivacao,
    tese,
    setorAplicacao,
    dicas,
    resultadosEsperados,
    checklistAntes,
    checklistBoldfy: CHECKLIST_BOLDFY,
    bannerSemBudget,
    calculadora,
    battleCard,
    sobreBoldfy,
    ctaTitulo,
    outrasAreas: outras,
  };
}

/* -------------------------------------------------------------------------- */
/*  Resolvers Bloco 3.5 + Banner (mai/2026 3ª curadoria)                       */
/* -------------------------------------------------------------------------- */

/**
 * Resolve o conteúdo do Bloco 3.5 baseado na área P3 do respondente.
 * `marketing/growth/comunicação` → variante marketing;
 * `vendas` → variante vendas; `rh/employer_branding` → variante rh.
 * `outro` cai pro fallback marketing (igual `areaToBase`).
 */
function resolveSetorAplicacao(quiz: PlaybookQuizData): SetorAplicacao {
  const base = areaToBase(quiz.cargoArea);
  return SETOR_APLICACAO[base];
}

/**
 * Retorna o banner SEM_BUDGET quando o respondente marcou `sem_budget`,
 * ou null caso contrário. Componente do output esconde o bloco quando null.
 */
function resolveBannerSemBudget(quiz: PlaybookQuizData): BannerOferta | null {
  return quiz.budgetStatus === 'sem_budget' ? BANNER_SEM_BUDGET : null;
}
