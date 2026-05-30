/**
 * Tipos do render engine do Playbook de Employee-Led Growth.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md +
 *       source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 *
 * `RenderedData` é o JSON injetado na página /playbook/[slug]. Cada bloco da
 * página (Hero, Snapshot, Tese, Dicas, Checklist, Calculadora, Battle card,
 * CTA) lê os campos correspondentes daqui.
 *
 * Snapshot é gravado em `playbook_outputs.rendered_data` no momento do submit
 * — mesmo que a gente atualize templates depois, páginas antigas continuam
 * renderizando o que viram (decisão de spec §11).
 *
 * ════════════════════════════════════════════════════════════════════════════
 *  ATENÇÃO — estrutura expandida (mai/2026)
 * ════════════════════════════════════════════════════════════════════════════
 * Após a sessão de copy editorial, o output cresceu de 7 pra 8 blocos. Saiu
 * o "Bloco 6 Boldfy ataca os 3 problemas" e entraram "Bloco 4 Dicas + Boldfy"
 * (accordion) e "Bloco 7 Battle card" (gráfico). Spec copy-final §1.
 *
 * Campos novos vs versão anterior:
 *   tese, dicas, curvaAtivacao, heroLegenda, ctaTitulo, battleCard
 *   + calculadora.colabAtivosEstimados
 *
 * Cálculo de earned media usa CURVA DE ATIVAÇÃO por porte (não 30% fixo).
 */

/* -------------------------------------------------------------------------- */
/*  Checklist item                                                             */
/* -------------------------------------------------------------------------- */

export type ChecklistItem = {
  titulo: string;
  descricao: string;
  /** Ex: '1h', '30min', '2 reuniões' — opcional, mostra como pill ao lado do título. */
  prazo?: string;
};

/* -------------------------------------------------------------------------- */
/*  Tip (dica do Bloco 4)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Cada dica tem um título descritivo (ação direta) + accordion "Como a Boldfy
 * resolve" com 3-4 bullets. O `numero` é renumerado no render conforme a
 * posição na lista selecionada ("Dica 01", "Dica 02", ...).
 *
 * Curadoria mai/2026: O campo `texto` (parágrafo editorial de 30-40 palavras)
 * foi removido da renderização — virou redundante com o título descritivo + os
 * bullets do accordion. Mantido como opcional pra compat retroativa de
 * playbooks gerados antes da curadoria.
 *
 * `selectors` é a regra que liga essa dica a um perfil de respondente.
 * Universais entram em todo playbook; específicas entram conforme a regra
 * em `selectTipsForPlaybook` em render.ts (spec copy-final §2.4 + curadoria
 * mai/2026: novos selectors `budget` e `sponsorship`).
 */
export type TipSelectors = {
  universal?: true;
  area?: Array<'marketing' | 'vendas' | 'rh'>;
  dor?: Array<
    | 'company_page_morta'
    | 'cac_subindo'
    | 'concorrente_dominando'
    | 'vendedor_invisivel'
    | 'talento_saindo'
    | 'marca_uma_pessoa'
    | 'outra'
  >;
  tentativas?: Array<'nunca' | 'morreu' | 'baixa_adesao' | 'maduro'>;
  voz?: Array<
    'founder_solo' | 'alguns_executivos' | 'time_esparso' | 'ninguem' | 'programa_rodando'
  >;
  seniority?: Array<'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level'>;
  /** P10 — só dispara em precisa_justificar / sem_budget. */
  budget?: Array<'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget'>;
  /**
   * P11 reformulada (mai/2026): detector de oportunidade Full Content.
   * `sim_proprio` → líderes topam postar, mas precisam de método/ferramenta.
   * `sim_full_content` → líderes topam, mas precisam de quem produza por eles.
   */
  sponsorship?: Array<
    // Valores novos (mai/2026)
    | 'sim_proprio'
    | 'sim_full_content'
    | 'nao_foco'
    // Valores antigos (compat retroativa)
    | 'sim_alguns_postam'
    | 'sim_com_ajuda'
    | 'talvez'
    | 'nao'
  >;
};

export type Tip = {
  id: string;
  /** "Dica 01" — preenchido no render conforme ordem na lista selecionada. */
  numero: string;
  /** Título descritivo, verb-led: diz o que fazer. */
  titulo: string;
  /**
   * @deprecated removido da renderização na curadoria mai/2026 — o título
   * descritivo + bullets do accordion já cobrem o ponto. Mantido como opcional
   * pra playbooks antigos no banco que ainda têm o campo populado.
   */
  texto?: string;
  /** "Marketing", "CAC subindo", etc. Universais = undefined. Vira pill. */
  tagEspecifica?: string;
  /** Nome do ícone Lucide (ex: 'Users', 'Compass'). */
  icon: string;
  /**
   * Dica destaque (mai/2026 3ª curadoria): renderiza em largura total, com
   * borda roxa marcada e layout especial (2 colunas de opções em vez do
   * accordion padrão). Usado pra S_CLEVEL — quando o respondente é C-level
   * e não posta, esse é o "putz, essa é a mais importante pra mim".
   *
   * Quando true, o componente DicaCard ignora `boldfy.items` padrão e busca
   * `opcoes` no lugar (ver abaixo).
   */
  destaque?: boolean;
  /**
   * Opções pra renderizar dica em modo destaque (2 colunas).
   * Usado quando `destaque: true`. Mutuamente exclusivo com `boldfy.items`.
   */
  opcoes?: Array<{ titulo: string; desc: string }>;
  /**
   * Índice da opção a destacar visualmente (mai/2026 — refinamento).
   *
   * Quando setado (ex: `opcaoDestacada: 1`), o renderer marca a segunda opção
   * com badge "Recomendado pra você" e borda mais forte. Usado pra sinalizar
   * qual caminho casa melhor com o perfil do respondente no S_CLEVEL:
   *
   *   - sponsorshipLideranca = sim_proprio       → opcaoDestacada = 0 (postar próprio)
   *   - sponsorshipLideranca = sim_full_content  → opcaoDestacada = 1 (Full Content)
   *   - demais valores                            → undefined (sem destaque)
   *
   * Não impede a leitura da outra opção; só sinaliza qual é o match esperado.
   */
  opcaoDestacada?: number;
  /**
   * Mini-descrição (mai/2026 3ª curadoria — refinamento): 1 a 2 linhas curtas
   * dando contexto do que essa dica significa antes de abrir o accordion da
   * Boldfy. Aparece em TODAS as dicas (universais e condicionais) entre o
   * título e o botão "Veja como a Boldfy resolve". O objetivo é a pessoa
   * entender a dica mesmo sem abrir o accordion.
   */
  descricao?: string;
  /**
   * Accordion "Como a Boldfy resolve" — abre embaixo da dica.
   * Aceita markup `[[Feature]]` nos items pra marcar funcionalidades
   * da plataforma. Modo destaque (S_CLEVEL) usa `opcoes` no lugar.
   *
   * **Markup de features:** strings em `items` aceitam `[[Nome da Feature]]`
   * pra marcar funcionalidade da Boldfy. O renderer substitui por uma pill
   * rosa com ícone ✦ pra a pessoa identificar visualmente o que é feature
   * vs dica genérica.
   */
  boldfy: {
    titulo: string;
    items: string[];
    /**
     * Callout opcional renderizado abaixo dos items, em destaque.
     *
     * - `style: 'default'` (omitido): pill simples, ou link clicável se tem
     *   `href` (ex: case Semrush na Dica 05).
     * - `style: 'gift'`: usa AnimatedGiftBox (caixinha animada do site,
     *   reusada do MiniGift em product-motion.tsx) — usado no callout do
     *   pacote de design grátis na Dica 04.
     */
    callout?: {
      label: string;
      href?: string;
      style?: 'default' | 'gift';
    };
  };
  selectors: TipSelectors;
};

/* -------------------------------------------------------------------------- */
/*  Bloco 3.5 — Setor aplicação (novo mai/2026 3ª curadoria)                   */
/* -------------------------------------------------------------------------- */

/**
 * Conteúdo do bloco que vem logo abaixo dos 3 cards da Tese (Bloco 3),
 * mostrando como o setor do respondente aplica a estratégia.
 *
 * Layout do card horizontal:
 * - Esquerda: título do setor + bullets de aplicação prática (varia por setor)
 * - Direita: 3 mini-cards em 3 colunas (porquê/como/ferramenta) — fixos pra
 *   todos os setores
 * - Linha embaixo: jaba "E a Boldfy te ajuda nos três"
 *
 * Substituiu as antigas dicas A_MARKETING / A_VENDAS / A_RH no TIPS_LIBRARY.
 */
export type SetorAplicacao = {
  /** Label pra badge no canto (ex: "Marketing/Growth"). */
  setorBadge: string;
  /** Título da seção (era título da dica A_*). */
  titulo: string;
  /** Bullets de aplicação prática (eram bullets de "Como a Boldfy resolve" do A_*). */
  dicas: string[];
};

/** Os 3 mini-cards do lado direito do Bloco 3.5 — fixos pra todos os setores. */
export type SetorResolucaoMotor = {
  /** Pill ("Porquê", "Como", "Ferramenta"). */
  tag: string;
  /** Título do mini-card. */
  titulo: string;
  /** Descrição curta. */
  desc: string;
};

/* -------------------------------------------------------------------------- */
/*  Banner Sem Budget (novo mai/2026 3ª curadoria)                             */
/* -------------------------------------------------------------------------- */

/**
 * Banner condicional renderizado acima da calculadora (Bloco 6) quando
 * `budgetStatus === 'sem_budget'`. Substituiu a antiga dica B_SEM_BUDGET no
 * TIPS_LIBRARY — fica mais útil próximo da calculadora, onde a pessoa decide
 * o orçamento, do que perdido entre as dicas.
 */
export type BannerOferta = {
  titulo: string;
  desc: string;
};

/* -------------------------------------------------------------------------- */
/*  Tese (Bloco 3) — fixo                                                      */
/* -------------------------------------------------------------------------- */

export type TeseMotivo = {
  num: string;        // "01"
  icon: string;       // 'CheckSquare', 'BookOpen', 'MonitorSmartphone'
  titulo: string;
  desc: string;
};

/* -------------------------------------------------------------------------- */
/*  Battle card (Bloco 7) — calculado                                          */
/* -------------------------------------------------------------------------- */

export type BattleCard = {
  /** Horas totais economizadas por mês — admin + colaboradores. */
  economiaMensalHoras: number;
  /** Equivalente em FTEs (full-time equivalents) — ex: 0.5. */
  economiaFTEs: number;
};

/* -------------------------------------------------------------------------- */
/*  Sobre a Boldfy (Bloco 7.5 — novo bloco mai/2026)                           */
/* -------------------------------------------------------------------------- */

/**
 * Card de modalidade da Boldfy (SaaS ou CaaS).
 *
 * Aparece no novo bloco "Sobre a Boldfy" entre o Battle card e o CTA.
 * Sempre renderiza SaaS. CaaS aparece SOMENTE se P11 = sim_full_content
 * (sinal claro de que líderes querem postar mas precisam de quem produza).
 */
export type SobreBoldfyCard = {
  /** Etiqueta curta no topo do card (ex: "SaaS", "Full Content"). */
  badge: string;
  /** Headline do card. */
  titulo: string;
  /** 1 linha de pitch — descreve a modalidade em uma frase. */
  subtitulo: string;
  /** 3-4 bullets do que está incluído. */
  bullets: string[];
  /** Label do CTA do card. */
  ctaLabel: string;
};

/* -------------------------------------------------------------------------- */
/*  Curva de ativação (Bloco 2 — accordion)                                    */
/* -------------------------------------------------------------------------- */

export type CurvaAtivacao = {
  /** Número absoluto de colaboradores ativos estimados. */
  colabAtivos: number;
  /** Percentual aplicado (0.35, 0.30, 0.22, 0.17). */
  porcentagem: number;
  /** Label da faixa. Ex: "21-100 colaboradores". */
  faixaLabel: string;
};

/* -------------------------------------------------------------------------- */
/*  RenderedData — saída completa do render engine                             */
/* -------------------------------------------------------------------------- */

export type RenderedData = {
  /* Bloco 1 — Hero */
  hero: {
    /** Sempre = nome da empresa que o respondente preencheu. */
    headlineEmpresa: string;
    /** Número-soco. Ex: "R$ 72.000" */
    socoNumero: string;
    /** Legenda dor-específica (HERO_LEGENDA_POR_DOR interpolado). */
    socoLabel: string;
  };

  /** Legenda exibida no hero, varia por dor 1. Já interpolada com {empresa}. */
  heroLegenda: string;

  /* Bloco 2 — Você está aqui hoje + accordion curva */
  snapshot: {
    porte: number;
    portePretty: string;          // "80 colaboradores"
    /** @deprecated mantido pra compat retroativa — use `setorPretty` no Bloco 2. */
    areaPretty: string;           // "Marketing"
    setorPretty: string;          // "Tech / SaaS" — o que aparece no snapshot do output
    vozAtualPretty: string;       // "Founder solo"
    tentativasPretty: string;     // "Já tentou e o programa morreu"
    paragrafoConector: string;    // SNAPSHOT_FECHAMENTO[templateKey]
    /**
     * Sinaliza se o accordion "Por que estimamos N colaboradores ativos?"
     * deve mostrar a explicação extra sobre o piso operacional de 5 ativos.
     *
     * `true` quando o respondente passou pela tela de compromisso (porte
     * 6-20 + confirmou). Justifica pra ele por que mesmo com 6 colab a
     * estimativa exibida é 5 (não 2 pela curva teórica).
     *
     * `false`/`undefined` em outros casos (porte=5, porte>20, playbooks
     * antigos): mostra só o texto histórico da curva. Opcional pra
     * retrocompat com snapshots sem esse campo.
     */
    mostrarPisoOperacional?: boolean;

    /**
     * Sinaliza que o teto operacional do programa (100 ativos) capou a
     * estimativa: a curva teórica daria mais (ex: 170 numa empresa de 1000),
     * mas exibimos 100. Quando `true`, o accordion explica o teto pra conta
     * fechar. `false`/`undefined` quando a curva ficou dentro de 100.
     */
    mostrarTetoOperacional?: boolean;
  };

  /** Snapshot da curva de ativação aplicada (Bloco 2 — accordion). */
  curvaAtivacao: CurvaAtivacao;

  /**
   * Dados do gráfico "Ads vs ELG" (Bloco 2, abaixo do accordion da curva).
   * Introduzido em jun/2026. Opcional pra retrocompat com playbooks gerados
   * antes desse bloco existir (componente esconde quando ausente).
   *
   * `gastoMensalAdsMidpoint = null` significa que o respondente pulou a P11.5
   * — gráfico renderiza em modo conceitual (sem números personalizados).
   */
  adsVsElgChart?: {
    gastoMensalAdsMidpoint: number | null;
    faixaLabel: string | null;
    custoBoldfyMensal: number;
    earnedMediaMensal: number;
    colabAtivos: number;
  };

  /* Bloco 3 — Tese (fixa) */
  tese: {
    motivos: TeseMotivo[];        // sempre 3 cards
  };

  /**
   * Bloco 3.5 — Setor aplicação (mai/2026 3ª curadoria).
   * Card horizontal abaixo dos 3 cards da tese mostrando como o setor do
   * respondente aplica os 3 motores. Opcional pra retrocompat com playbooks
   * gerados antes da curadoria.
   */
  setorAplicacao?: SetorAplicacao;

  /* Bloco 4 — Dicas (selecionadas via selectTipsForPlaybook) */
  dicas: Tip[];

  /**
   * Bloco 4.5 — Resultados esperados (novo mai/2026).
   * Strings curtas derivadas das dores P8 — 1 string por dor escolhida.
   * Aparece como micro-bloco entre Dicas e Checklist.
   *
   * Opcional pra retrocompat com playbooks gerados antes da curadoria.
   */
  resultadosEsperados?: string[];

  /* Bloco 5 — Checklist (antes + na Boldfy) */
  checklistAntes: ChecklistItem[];   // 5 itens (+1 condicional se tentou_morreu)
  checklistBoldfy: ChecklistItem[];  // sempre os 4 itens fixos reformulados

  /**
   * Banner do programa beta acima da calculadora.
   *
   * Mai/2026 (3ª curadoria): introduzido como banner condicional pra
   * `budgetStatus === 'sem_budget'` (sucessor da antiga dica B_SEM_BUDGET).
   *
   * Jun/2026 (refinamento pós-preview): virou UNIVERSAL — aparece pra todos,
   * com narrativa personalizada por budgetStatus em `BANNER_BETA_POR_BUDGET`.
   * Permanece opcional na type pra retrocompat com playbooks antigos no banco
   * que podem ter o campo ausente (gerados antes do banner existir) ou null
   * (gerados na janela mai-jun quando era condicional).
   *
   * Nome do campo (`bannerSemBudget`) preservado intencionalmente pra não
   * quebrar snapshots já em `playbook_outputs.rendered_data`.
   */
  bannerSemBudget?: BannerOferta | null;

  /* Bloco 6 — Calculadora (defaults do RoiSimulator) */
  calculadora: {
    initialCollaborators: number;       // clamp 5-70 do porteColaboradores
    initialImpressions: number;          // default 10k
    /** Colaboradores ativos estimados pela curva. Usado no card de contexto. */
    colabAtivosEstimados: number;
  };

  /* Bloco 7 — Battle card (gráfico 2 colunas) */
  battleCard: BattleCard;

  /**
   * Bloco 7.5 — Sobre a Boldfy (novo mai/2026).
   * SaaS sempre visível. CaaS = null quando P11 ≠ sim_full_content
   * (líder não topa ou já topa postar sozinho).
   *
   * Opcional pra retrocompat com playbooks gerados antes da curadoria.
   */
  sobreBoldfy?: {
    saas: SobreBoldfyCard;
    caas: SobreBoldfyCard | null;
  };

  /* Bloco 8 — CTA final */
  /** Título dor-específico (CTA_TITULO_POR_DOR interpolado com {empresa}). */
  ctaTitulo: string;

  /** Áreas vizinhas pra mostrar "e ainda resolve pra..." (mantido). */
  outrasAreas: Array<{
    slug: 'marketing' | 'vendas' | 'rh';
    pretty: string;
  }>;
};
