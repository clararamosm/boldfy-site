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
  /** Accordion "Como a Boldfy resolve" — abre embaixo da dica. */
  boldfy: {
    titulo: string;
    items: string[];
  };
  selectors: TipSelectors;
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
  };

  /** Snapshot da curva de ativação aplicada (Bloco 2 — accordion). */
  curvaAtivacao: CurvaAtivacao;

  /* Bloco 3 — Tese (fixa) */
  tese: {
    motivos: TeseMotivo[];        // sempre 3 cards
  };

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
