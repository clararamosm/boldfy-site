/**
 * Catálogo de copy do Playbook de Employee-Led Growth.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 *
 * Estrutura (pós curadoria mai/2026):
 *   - SNAPSHOT_FECHAMENTO: 10 strings, 1 por template-key (Bloco 2)
 *   - TIPS_LIBRARY: 18 dicas com metadados de seleção (Bloco 4)
 *     · 5 universais (U2 marca · U4 ganho real · U5 métricas · U7 biblioteca ·
 *       U6 variação visual) + 13 condicionais
 *     · Curadoria mai/2026 (3ª rodada — anti-redundância):
 *       saíram U1 (foi pro Bloco 5), U3 (virou resultado universal),
 *       B_PRECISA_JUSTIFICAR (virou resultado universal); U2/U5/U6/U7
 *       refocadas, U7 vem antes de U6 (acervo antes de variação).
 *   - HERO_LEGENDA_POR_DOR: legenda do soco numérico (Bloco 1, varia por dor 1)
 *   - CTA_TITULO_POR_DOR: título do CTA final (Bloco 8, varia por dor 1)
 *   - CHECKLIST_BOLDFY: 4 itens fixos do "Na Boldfy" (Bloco 5)
 *   - TESE_MOTIVOS: 3 cards fixos da Tese (Bloco 3)
 *   - RESULTADOS_POR_DOR: 1 string por dor — Bloco 4.5 derivado de P8
 *   - SOBRE_BOLDFY_SAAS / SOBRE_BOLDFY_CAAS: cards do Bloco 7.5
 *
 * `TemplateKey` continua existindo (10 entradas) pra `playbook_outputs.template_key`
 * permanecer estável historicamente, mas o conteúdo da página NÃO é mais matriz
 * hardcoded — vem de catálogos + regras de seleção em `render.ts`.
 *
 * Naming editorial fixado (copy-final §4.11):
 *   - "piloto" / "comitê piloto" foram banidos — usar "primeiro grupo" / "colaboradores"
 *   - "crédito de IA" sai do checklist (é default da Boldfy, não decisão do cliente)
 *   - em-dashes (—) viram vírgula ou dois pontos em texto editorial
 *   - sem emojis, só ícones Lucide
 *
 * Curadoria mai/2026:
 *   - Títulos de dicas reescritos como verbos de ação (diz o que fazer)
 *   - Campo `texto` dos tips deixou de ser renderizado (título + bullets bastam)
 *   - 4 novos tips condicionais: 2 por budget (P10) + 2 por sponsorship (P11)
 */

import type {
  BannerOferta,
  ChecklistItem,
  SetorAplicacao,
  SetorResolucaoMotor,
  SobreBoldfyCard,
  TeseMotivo,
  Tip,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                      */
/* -------------------------------------------------------------------------- */

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

export type DorPrincipalValue =
  | 'company_page_morta'
  | 'cac_subindo'
  | 'concorrente_dominando'
  | 'vendedor_invisivel'
  | 'talento_saindo'
  | 'marca_uma_pessoa'
  | 'outra';

/* -------------------------------------------------------------------------- */
/*  Bloco 2 — SNAPSHOT_FECHAMENTO (10 strings)                                 */
/* -------------------------------------------------------------------------- */

export const SNAPSHOT_FECHAMENTO: Record<TemplateKey, string> = {
  'marketing-cac-morreu':
    'Marketing apertado pelo CAC e uma tentativa anterior que não vingou: é o cenário que mais chega aqui. Costuma significar que faltou um dos 3 motores (porquê, como, ferramenta), não vontade do time.',

  'marketing-cac-nunca':
    'Marketing pressionado pelo CAC e Employee-Led Growth ainda no radar: sem trauma de tentativa anterior, é o cenário mais limpo pra começar cobrindo os 3 motores desde o primeiro mês.',

  'marketing-companypage-morreu':
    'Company Page com pouco engajamento e uma tentativa de virar isso que não foi adiante. Acontece com 9 em cada 10 marcas B2B: a página corporativa quase nunca puxa demanda sozinha, e o primeiro grupo provavelmente morreu por falta de motivo claro pros participantes.',

  'marketing-companypage-nunca':
    'Company Page com pouco engajamento e o time ainda dependendo dela como canal principal. Boa hora pra montar Employee-Led desde o início, sem precisar desfazer o hábito de "só a página posta".',

  'marketing-concorrente-nunca':
    'Concorrente menor aparecendo mais no feed que vocês quase sempre significa uma coisa: ele tem 3 ou 4 pessoas postando consistentemente, e vocês têm a página corporativa. Não é orçamento: é distribuição de voz.',

  'vendas-coldoutreach-nunca':
    'Vendedor invisível somado a cold outreach com taxa de resposta baixa é o combo mais comum no B2B brasileiro. Quando o prospect stalkeia o vendedor antes de responder, encontra um perfil vazio, e a fria fica mais fria ainda.',

  'vendas-vendedorvisivel-morreu':
    'Vocês entenderam que vendedor visível responde mais, tentaram estruturar e o programa não vingou. Cenário clássico: cobrança veio antes do método, e a galera comercial não viu post como parte da rotina de prospecção.',

  'rh-talento-nunca':
    'Talento bom indo pra empresa que aparece mais e RH sem programa estruturado de presença no LinkedIn: é o gap que mais atrasa hiring no B2B brasileiro hoje. A marca empregadora vive no feed dos colaboradores, não no Glassdoor.',

  'rh-talento-morreu':
    'Vocês tentaram ativar colaboradores como porta-vozes da marca empregadora e o programa não emplacou. Geralmente é porque RH herda esse projeto sem alinhamento com Marketing e fica preso entre "comunicação interna" e "employer branding", sem virar canal de mídia de verdade.',

  'transversal-marca-uma-pessoa':
    'Marca que depende demais de uma pessoa (founder, CEO, fundador-comunicador) é um risco escondido de manual: quando ela para, o feed fica mudo. A boa notícia é que dá pra distribuir essa voz sem perder a identidade: só precisa de método.',
};

/* -------------------------------------------------------------------------- */
/*  Bloco 1 — HERO_LEGENDA_POR_DOR (legenda do soco numérico)                  */
/* -------------------------------------------------------------------------- */

export const HERO_LEGENDA_POR_DOR: Record<DorPrincipalValue, string> = {
  cac_subindo:
    'em earned media equivalente por mês, que poderia estar substituindo parte do CAC pago da {empresa}.',
  company_page_morta:
    'em earned media equivalente por mês, que sua Company Page sozinha nunca vai entregar.',
  concorrente_dominando:
    'em earned media equivalente por mês, parados enquanto o concorrente posta sozinho.',
  vendedor_invisivel:
    'em earned media equivalente por mês, que os perfis vazios dos seus vendedores deixam de gerar.',
  talento_saindo:
    'em earned media equivalente por mês, que poderia estar atraindo o talento que hoje vai pro concorrente.',
  marca_uma_pessoa:
    'em earned media equivalente por mês, que pararia de existir se o founder parasse de postar.',
  outra:
    'em earned media equivalente por mês, esperando ser ativada pelos colaboradores da {empresa}.',
};

/* -------------------------------------------------------------------------- */
/*  Bloco 8 — CTA_TITULO_POR_DOR                                               */
/* -------------------------------------------------------------------------- */

export const CTA_TITULO_POR_DOR: Record<DorPrincipalValue, string> = {
  cac_subindo:
    'Pronto pra parar de queimar budget em paid e começar a ganhar earned na {empresa}?',
  company_page_morta:
    'Pronto pra acordar a presença da {empresa} no LinkedIn com vozes humanas?',
  concorrente_dominando:
    'Pronto pra parar de ver o concorrente menor dominar seu feed?',
  vendedor_invisivel:
    'Pronto pra ter vendedores que o prospect responde de primeira na {empresa}?',
  talento_saindo:
    'Pronto pra parar de perder talento pra empresa que aparece mais?',
  marca_uma_pessoa:
    'Pronto pra distribuir a voz da {empresa} sem perder identidade?',
  outra:
    'Pronto pra destravar Employee-Led Growth na {empresa}?',
};

/* -------------------------------------------------------------------------- */
/*  Bloco 3 — TESE_MOTIVOS (fixo, 3 cards)                                     */
/* -------------------------------------------------------------------------- */

export const TESE_MOTIVOS: TeseMotivo[] = [
  {
    num: '01',
    icon: 'CheckSquare',
    titulo: 'Ninguém entende por quê está postando',
    desc: 'Vira tarefa não-remunerada. O time desengaja na segunda semana.',
  },
  {
    num: '02',
    icon: 'BookOpen',
    titulo: 'Ninguém sabe como postar',
    desc: 'Especialista no negócio não é especialista em conteúdo. Sem método, vira post genérico.',
  },
  {
    num: '03',
    icon: 'MonitorSmartphone',
    titulo: 'Falta ferramenta que reduza fricção',
    desc: 'Pular entre 4 apps mata o ritmo. O post pronto nunca sai.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco 5 — CHECKLIST_BOLDFY (4 itens fixos reformulados)                    */
/* -------------------------------------------------------------------------- */

export const CHECKLIST_BOLDFY: ChecklistItem[] = [
  {
    titulo: 'Setup do Brand Context (admin)',
    descricao:
      'Configurar tom de voz, tópicos permitidos, restrições e persona de marca dentro do app. É o que guia a IA contextual em todo conteúdo que sair daí pra frente.',
    prazo: '1h',
  },
  {
    titulo: 'Workshop de onboarding com a Boldfy + primeiro grupo',
    descricao:
      'Reunião ao vivo com a estrategista da Boldfy desenhando a estratégia junto com vocês, alinhando pilares de conteúdo e calibrando o time. É aqui que a estratégia personalizada nasce.',
    prazo: '1,5h',
  },
  {
    titulo: 'Trilhas LXP + missões semanais rodando',
    descricao:
      'Cada colaborador entra nas trilhas (marca pessoal, conteúdo, social selling) no próprio ritmo. Missões saem automáticas semana a semana, com pontos, ranking e prêmio do mês. Roda sem cobrança manual.',
    prazo: 'roda sozinho',
  },
  {
    titulo: 'Acompanhamento contínuo via dashboard (admin)',
    descricao:
      'Visibilidade total do programa todo dia: quem postou, quanto cada pessoa gerou de impressões, ranking interno, earned media acumulado, saúde geral. Não precisa esperar reunião de fechamento pra saber como o programa está.',
    prazo: 'contínuo',
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco 4 — TIPS_LIBRARY (18 dicas com metadados de seleção)                 */
/* -------------------------------------------------------------------------- */
/**
 * Pool completo. Seleção runtime via `selectTipsForPlaybook` em render.ts
 * (spec copy-final §2.4 + curadoria mai/2026). Universais sempre entram;
 * específicas pegam por área, dor (até 2), tentativas, voz, seniority,
 * budget e sponsorship.
 *
 * Curadoria mai/2026:
 *   - Títulos reescritos como verbos de ação (diz o que fazer)
 *   - Campo `texto` mantido como string vazia (compat — não renderizado)
 *   - 4 dicas novas: B_PRECISA_JUSTIFICAR, B_SEM_BUDGET (P10),
 *     L_PROPRIO, L_FULL_CONTENT (P11 reformulada)
 */
export const TIPS_LIBRARY: Tip[] = [
  // ===================== UNIVERSAIS (5) =====================
  //
  // Curadoria mai/2026 (3ª rodada — enxugar pra parar de competir com os
  // resultados esperados). IDs antigos mantidos por retrocompat com playbooks
  // já gerados (rendered_data tem snapshot completo, mas mantém id rastreável):
  //   - U1 saiu (info já tá no Bloco 5, item "Workshop + primeiro grupo")
  //   - U3 saiu (virou resultado universal "menos institucional, mais conexão")
  //   - B_PRECISA_JUSTIFICAR saiu (virou resultado universal "case de earned
  //     media pra defender budget")
  //   - U2, U5, U6 refocadas; U7 vem antes de U6 (acervo > variação)
  //
  // Conteúdo do playbook fica com 18 dicas (5 universais + 13 específicas).
  {
    id: 'U2',
    numero: 'Dica 01',
    titulo: 'Alinhe a marca internamente antes de cobrar assertividade do time',
    descricao:
      'Sem alinhamento interno, cada colaborador inventa um pitch diferente e o conteúdo sai desconexo.',
    icon: 'Compass',
    boldfy: {
      titulo: 'Brand Context + trilha de marca da empresa',
      items: [
        '[[Brand Context]] configurado uma vez (pitch, posicionamento, tom)',
        'Admin cria uma [[trilha personalizada de marca]] pro time aprender o pitch',
        '[[IA contextual]] cruza voz pessoal com marca corporativa em cada conteúdo',
        'Conteúdo sai pessoal mas alinhado com o que a empresa defende',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U4',
    numero: 'Dica 02',
    titulo: 'Ofereça ganho real e tire fricção do caminho',
    descricao:
      'Tarefa não-remunerada não dura. Sistema de recompensas e ferramenta certa removem fricção e mantêm ritmo.',
    icon: 'Coins',
    boldfy: {
      titulo: 'Gamificação + recompensas + IA assistente',
      items: [
        '[[Gamificação]] com pontos automáticos por ação',
        '[[Ranking interno]] e [[loja de recompensas]]',
        '[[IA assistente]] pra ideação, refino e calendário',
        'Suporte invisível embutido, sem máquina interna',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U5',
    numero: 'Dica 03',
    titulo: 'Tenha visão das métricas e da performance da estratégia, não siga cego',
    descricao:
      'Sem dado, ninguém sabe se tá rodando. Adoção e qualidade do programa precisam ficar visíveis dia a dia.',
    icon: 'TrendingUp',
    boldfy: {
      titulo: 'Dashboard de adoção + qualidade do programa',
      items: [
        '[[Métricas de adoção]]: quem postou, com que frequência, ranking interno',
        '[[Métricas de qualidade]]: como o conteúdo performa no LinkedIn',
        'Tracking individual por perfil de colaborador',
        'Admin vê o programa todo dia, não só na reunião mensal',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U7',
    numero: 'Dica 04',
    titulo: 'Disponibilize acervo suficiente, biblioteca como hub central',
    descricao:
      'Colaborador sem peça pronta não posta. Biblioteca centralizada elimina a fila do design e destrava o ritmo.',
    icon: 'Library',
    boldfy: {
      titulo: 'Biblioteca de assets da empresa',
      items: [
        '[[Painel admin]] com peças aprovadas, organizadas por tema',
        'Colaborador pega direto pela plataforma, sem fila de design',
        '[[Brand Context]] garante consistência mesmo com auto-serviço',
        'Tracking de qual peça circulou mais e quem usou',
      ],
      // Callout dinâmico (style: 'gift') injetado em render.ts quando
      // calcColabAtivos(porte) ≥ 40 (Starter/Growth/Scale grátis).
    },
    selectors: { universal: true },
  },
  {
    id: 'U6',
    numero: 'Dica 05',
    titulo: 'Crie variação visual no acervo para cada colaborador postar com uma cara diferente',
    descricao:
      'Mesma peça idêntica cansa o feed. Variar identidade visual mantém o conteúdo fresco e o alcance subindo.',
    icon: 'Palette',
    boldfy: {
      titulo: 'Variação visual + IA de hooks',
      items: [
        'Mesma peça-base com 3 a 5 tratamentos visuais distintos',
        '[[IA]] varia título e ângulo de abertura pra cada pessoa',
        '[[Brand Context]] mantém identidade entre variações',
        'Evita que a audiência canse de ver a mesma peça no feed',
      ],
      callout: {
        label: 'Veja o case da Semrush, 3 clusters de variação visual na prática',
        href: '/case-semrush',
      },
    },
    selectors: { universal: true },
  },

  // ===================== ÁREA-ESPECÍFICAS — REMOVIDAS (mai/2026 3ª curadoria) ===
  //
  // As antigas A_MARKETING / A_VENDAS / A_RH migraram pro Bloco 3.5 (SETOR_APLICACAO
  // mais abaixo neste arquivo). Conteúdo é o mesmo, formato visual diferente —
  // vira card horizontal abaixo da Tese com layout 2-colunas (esquerda
  // personalizada por setor, direita com 3 mini-cards fixos dos motores).
  //
  // Resolução pelo render: ver `resolveSetorAplicacao(quiz)` em render.ts.

  // ===================== DOR-ESPECÍFICAS (4) ==================================
  //
  // Reformuladas mai/2026 (3ª curadoria — refinamento): conselhos práticos
  // primeiro (o título é o conselho), com mini-descrição contextualizando e
  // accordion "Veja como a Boldfy resolve" fechado por padrão — mesmo padrão
  // visual das universais. Features marcadas com [[...]] nos bullets.
  {
    id: 'D_CAC',
    numero: '',
    titulo: 'Use CPM equivalente como argumento de orçamento',
    tagEspecifica: 'CAC subindo',
    descricao:
      'Earned media é argumento que finance entende. Calcule o que cada post teria custado em CPM LinkedIn Brasil e leve pra revisão de budget.',
    icon: 'DollarSign',
    boldfy: {
      titulo: 'Dashboard de earned media + slide de defesa',
      items: [
        '[[Dashboard de earned media]] calcula CPM equivalente automaticamente',
        'Comparativo earned vs paid sai pronto no relatório mensal',
        'Slide pra board exportável sem planilha',
        'Linguagem pronta pra finance e CFO',
      ],
    },
    selectors: { dor: ['cac_subindo'] },
  },
  {
    id: 'D_COMPANYPAGE',
    numero: '',
    titulo: 'Use a page pra cultura e história do time, não pra conteúdo técnico',
    tagEspecifica: 'Company Page morta',
    descricao:
      'Page funciona pra coisas humanas: bastidor, eventos, história dos colaboradores. Voz técnica vai pros perfis de quem tem autoridade no assunto.',
    icon: 'Globe',
    boldfy: {
      titulo: 'Vozes técnicas distribuídas + Brand Context',
      items: [
        '[[Brand Context]] separa o que vai pra page vs perfis pessoais',
        '[[IA assistente]] traduz mensagem corporativa em ângulo pessoal',
        'Pilares editoriais distribuídos entre vozes técnicas',
        'Métrica individual mostra quem puxa mais inbound',
      ],
    },
    selectors: { dor: ['company_page_morta'] },
  },
  {
    id: 'D_CONCORRENTE',
    numero: '',
    titulo: 'Mapeie 3 a 5 vozes do concorrente pra calibrar pauta e ritmo',
    tagEspecifica: 'Concorrente dominando',
    descricao:
      'Quem do concorrente posta, sobre o quê, com que frequência. Esse baseline orienta sua pauta e calibra o ritmo do nicho.',
    icon: 'Target',
    boldfy: {
      titulo: 'Análise de audiência por colaborador',
      items: [
        '[[Análise de audiência por colaborador]] mostra onde cada um ganha tração',
        'Benchmark contínuo da pauta vs concorrente',
        'Sinal pra ajustar nicho e ritmo de publicação',
        'Mapeamento de vozes do mercado integrado',
      ],
    },
    selectors: { dor: ['concorrente_dominando'] },
  },
  {
    id: 'D_TALENTO',
    numero: '',
    titulo: 'Ative colaboradores como referência viva pro próximo candidato',
    tagEspecifica: 'Talento saindo',
    descricao:
      'Candidato sênior pesquisa pessoas, não cultura. Bastidor técnico e jornada profissional dos colaboradores são o que criam prova social real.',
    icon: 'Award',
    boldfy: {
      titulo: 'Trilhas LXP + brand alignment',
      items: [
        '[[Trilhas LXP]] guiam colaborador a contar bastidor relevante',
        '[[Brand Context]] evita post auto-centrado de cultura interna',
        'Inbound de candidato qualificado rastreado',
        'Dashboard mostra quais colaboradores puxam mais talento',
      ],
    },
    selectors: { dor: ['talento_saindo'] },
  },

  // ===================== TENTATIVAS REMOVIDA — VAI PRO CHECKLIST ==============
  //
  // T_MORREU saiu na 3ª curadoria (mai/2026). Agora é item condicional do
  // checklistAntes no Bloco 5 quando `tentativasAnteriores !== 'nunca'`.
  // Resolução: ver `prependTentativasItem()` em render.ts +
  // `CHECKLIST_TENTOU_MORREU_ITEM` mais abaixo neste arquivo.

  // ===================== VOZ-ESPECÍFICAS (1) =====================
  {
    id: 'V_FOUNDER_SOLO',
    numero: '',
    titulo: 'Distribua a voz do founder pra 3 a 5 pessoas internas',
    tagEspecifica: 'Founder solo',
    descricao:
      'Programa que mora num CPF morre quando o CPF afasta. Distribuir voz cria sustentação.',
    icon: 'Network',
    boldfy: {
      titulo: 'Territórios editoriais distribuídos',
      items: [
        '[[Brand Context]] define quem fala de quê (territórios editoriais)',
        'Founder continua sendo voz principal',
        'C-suite, head de produto, head de operação cobrem outros territórios',
        'Programa não fica refém da agenda de uma pessoa',
      ],
    },
    selectors: { voz: ['founder_solo'] },
  },

  // ===================== SENIORITY EM DESTAQUE (1) — reformulada mai/2026 =====
  //
  // S_CLEVEL agora renderiza em DESTAQUE (largura total, borda roxa marcada,
  // pill "essa é a mais importante pra você") com 2 opções pro C-level:
  // entrar na gamificação OU delegar pra Full Content. O seletor mudou pra
  // exigir voz solo/sem método além do cargo (se já tem programa rodando,
  // o C-level provavelmente já posta).
  //
  // Resolução: ver lógica em render.ts (selectTipsForPlaybook §6).
  {
    id: 'S_CLEVEL',
    numero: '',
    titulo: 'Você é C-level, tem 2 opções pra entrar no programa sem virar refém da agenda',
    tagEspecifica: 'C-Level',
    icon: 'Crown',
    destaque: true,
    opcoes: [
      {
        titulo: 'Entra no game junto com o time',
        desc:
          'Você participa da [[gamificação]] dentro da plataforma, com missões semanais e [[IA assistente]] sugerindo ângulos. Vai no seu ritmo, mas vira parte do programa visivelmente.',
      },
      {
        titulo: 'Boldfy faz por você (Full Content)',
        desc:
          'Modalidade [[Full Content (CaaS)]]: estrategista entrevista você, equipe Boldfy produz no seu tom, você só aprova em minutos. Sai conteúdo autoral sem custo de tempo seu.',
      },
    ],
    boldfy: { titulo: '', items: [] }, // não renderizado em modo destaque
    selectors: {}, // resolvido manualmente em render.ts (lógica composta)
  },

  // ===================== BUDGET-ESPECÍFICAS (1 — curadoria mai/2026) =======
  //
  // B_PRECISA_JUSTIFICAR saiu na 3ª rodada (mai/2026): virava redundante com
  // Dica 09 (D_CAC: "Use CPM equivalente como argumento"), que já cobre a
  // mecânica de defesa de budget via earned media. O ângulo único do
  // "precisa_justificar" (case pronto pra board) foi promovido pra resultado
  // esperado universal — apresenta como ganho do programa em vez de dica.
  // B_SEM_BUDGET REMOVIDA — VAI PRO BANNER DA CALCULADORA (mai/2026 3ª curadoria)
  //
  // Conteúdo da antiga dica agora vive em 2 lugares:
  //   1. `BANNER_SEM_BUDGET` (definida mais abaixo) — banner acima da
  //      calculadora pra disparar leitura nesse perfil.
  //   2. Resultado condicional em RESULTADOS_ESPERADOS.porBudget.sem_budget.
  // Resolução: ver `resolveBannerSemBudget(quiz)` em render.ts.

  // ===================== SPONSORSHIP-ESPECÍFICAS (2 — reformuladas mai/2026) ==
  {
    id: 'L_PROPRIO',
    numero: '',
    titulo: 'Acelere os líderes que topam postar com método e ferramenta',
    tagEspecifica: 'Líder topa postar',
    descricao:
      'Quem já tem vontade só precisa de facilitador. Onboarding rápido na primeira semana e a galera já tá postando.',
    icon: 'Sparkles',
    boldfy: {
      titulo: 'IA assistente + território editorial por líder',
      items: [
        'Onboarding na primeira semana',
        'Cada líder ganha [[território editorial]] no Brand Context',
        '[[IA assistente]] sugere ângulos a partir do dia a dia da pessoa',
        'Refino e calendário sem trocar de app',
      ],
    },
    selectors: { sponsorship: ['sim_proprio'] },
  },
  {
    id: 'L_FULL_CONTENT',
    numero: '',
    titulo: 'Terceirize a produção, mantenha a autoria do líder',
    tagEspecifica: 'Full Content',
    descricao:
      'Líder topa postar mas não tem tempo de produzir? A Boldfy entrevista, escreve no tom da pessoa, líder só aprova.',
    icon: 'Feather',
    boldfy: {
      titulo: 'Modalidade Full Content dentro da plataforma',
      items: [
        '[[Full Content]] mora dentro da mesma plataforma, com tipo de conta diferente',
        'Estrategista entrevista o líder e produz no tom da pessoa',
        'Líder aprova em minutos, sem escrever',
        'Admin vê métricas iguais às dos colaboradores SaaS',
      ],
    },
    selectors: { sponsorship: ['sim_full_content'] },
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco 4.5 — RESULTADOS_ESPERADOS                                           */
/* -------------------------------------------------------------------------- */
/**
 * Resultados esperados do programa, renderizados como micro-bloco entre
 * Dicas (Bloco 4) e Checklist (Bloco 5).
 *
 * Curadoria mai/2026 (3ª rodada):
 *   - Estrutura expandida pra ter UNIVERSAIS (sempre aparecem) + POR DOR
 *     (condicionais ao P8).
 *   - Universais cobrem ganhos transversais do programa que não dependem da
 *     dor principal (cultura, conteúdo, defesa de budget, lista de remarketing).
 *   - 2 universais novas vieram de dicas removidas pra evitar redundância:
 *     · "menos institucional, mais conteúdo de conexão" (era U3)
 *     · "case com earned media pra defender budget" (era B_PRECISA_JUSTIFICAR)
 *   - Por dor mantém o mesmo mapeamento da 1ª curadoria (6 dores válidas).
 *
 * Render junta `universais` + os resultados das `doresPrincipais` (até 2).
 * 'outra' fica sem mapeamento por dor — só aparecem os universais nesse caso.
 */
type BudgetStatusValue = 'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget';

export const RESULTADOS_ESPERADOS: {
  universais: string[];
  porDor: Partial<Record<DorPrincipalValue, string>>;
  porBudget: Partial<Record<BudgetStatusValue, string>>;
} = {
  universais: [
    'Menos conteúdo institucional, mais conteúdo de conexão vivido pelo time',
    'Aderência à cultura aumenta, colaboradores sentem que fazem parte de algo',
    'Lista de pessoas com ponto de contato com a marca, pronta pra remarketing direto sem CAC frio',
    'Case de earned media na mesa pra defender budget na próxima revisão',
  ],
  porDor: {
    cac_subindo:
      'CAC menor com earned media substituindo parte da mídia paga',
    company_page_morta:
      'Voz da empresa cresce no feed sem depender da Company Page',
    concorrente_dominando:
      'Vocês passam a aparecer onde antes só o concorrente aparecia',
    vendedor_invisivel:
      'Vendedores com perfil cheio aumentam taxa de resposta de outbound',
    talento_saindo:
      'Marca empregadora visível atrai talento sênior sem subir custo de hiring',
    marca_uma_pessoa:
      'Voz da marca deixa de depender de uma única pessoa',
  },
  porBudget: {
    sem_budget:
      'Pacote Beta com 1º mês grátis (com 5 colaboradores) e valor beta nos 6 meses seguintes, pra começar sem comprometer Q atual',
  },
};

/**
 * @deprecated 2026-05-30 — substituído por `RESULTADOS_ESPERADOS.porDor`.
 * Mantido como alias por retrocompat com playbook_outputs antigos (render
 * antigo lia direto desta const). Pode ser removido depois que o render
 * for migrado em produção.
 */
export const RESULTADOS_POR_DOR = RESULTADOS_ESPERADOS.porDor;

/* -------------------------------------------------------------------------- */
/*  Bloco 3.5 — SETOR APLICAÇÃO (novo mai/2026 3ª curadoria)                   */
/* -------------------------------------------------------------------------- */

/**
 * Mapa setor → conteúdo do lado esquerdo do card horizontal (Bloco 3.5).
 *
 * Substituiu as antigas dicas A_MARKETING / A_VENDAS / A_RH do TIPS_LIBRARY.
 * Resolução pelo render: `resolveSetorAplicacao(quiz)` usa a área (P3) pra
 * escolher uma das 3 variações abaixo. Áreas que mapeiam pra base "marketing"
 * (marketing, growth, comunicação) caem em SETOR_APLICACAO.marketing.
 */
export const SETOR_APLICACAO: Record<'marketing' | 'vendas' | 'rh', SetorAplicacao> = {
  marketing: {
    setorBadge: 'Marketing/Growth',
    titulo: 'Trate Employee-Led como canal de mídia, não como engajamento',
    dicas: [
      'Marketing como dono do programa, ranqueado igual paid/organic/SEO',
      'CPM equivalente entra no relatório mensal, lado a lado com paid',
      'Pauta editorial casa com calendário de produto e campanha',
      'Inbound vindo do programa atribuído ao colaborador certo',
    ],
  },
  vendas: {
    setorBadge: 'Vendas',
    titulo: 'Audite o perfil de cada vendedor antes da próxima fria',
    dicas: [
      'Setup de perfil guiado: foto, headline, sobre, recomendações',
      'Conteúdo amarra com pipeline aberto (não é só "frase do dia")',
      'Autoridade técnica do vendedor vira post antes de virar reunião',
      'Inbound qualificado conectado ao vendedor que produziu o conteúdo',
    ],
  },
  rh: {
    setorBadge: 'RH / Employer Branding',
    titulo: 'Pare de postar cultura interna pra atrair talento sênior',
    dicas: [
      'Pilares de conteúdo puxados de Marketing pra alinhar narrativa de marca',
      'Voz pessoal de cada colaborador respeitada (não vira porta-voz de cultura)',
      'Evitar post auto-centrado de "olha que legal nosso happy-hour"',
      'Inbound de talento qualificado rastreado por quem puxou no perfil',
    ],
  },
};

/**
 * Os 3 mini-cards do lado direito do Bloco 3.5 — FIXOS pra todos os setores.
 * Layout no componente: 3 colunas (igual a tese do Bloco 3 logo acima).
 */
export const SETOR_RESOLUCAO_MOTORES: SetorResolucaoMotor[] = [
  {
    tag: 'Porquê',
    titulo: 'A empresa entrega motivação',
    desc: 'Sistema de pontos, ranking, reconhecimento interno',
  },
  {
    tag: 'Como',
    titulo: 'A empresa entrega conhecimento',
    desc: 'Trilhas de marca e capacitação contínua de voz pessoal',
  },
  {
    tag: 'Ferramenta',
    titulo: 'A empresa entrega ferramenta',
    desc: 'Plataforma simples que junta tudo num só lugar',
  },
];

/**
 * Linha de jaba que ocupa a largura dos 3 mini-cards (embaixo deles).
 * Jaba sutil ligando os 3 motores à Boldfy.
 */
export const SETOR_JABA = 'E a Boldfy te ajuda nos três';

/* -------------------------------------------------------------------------- */
/*  Banner SEM_BUDGET (Bloco 6 — acima da calculadora, mai/2026 3ª curadoria) */
/* -------------------------------------------------------------------------- */

/**
 * Banner condicional acima da calculadora quando `budgetStatus === 'sem_budget'`.
 * Conteúdo migrado da antiga dica B_SEM_BUDGET — fica mais útil próximo da
 * calculadora, onde a pessoa decide budget, do que perdido entre as dicas.
 */
export const BANNER_SEM_BUDGET: BannerOferta = {
  titulo: 'Sem budget hoje? Tem rota: 1º mês grátis pelo programa beta',
  desc:
    'Pacote Beta libera o primeiro mês com 5 colaboradores rodando, sem custo. Do 2º mês em diante, valor beta (preço reduzido) nos 6 meses seguintes. Dá tempo de gerar dado pra defender budget no Q seguinte.',
};

/* -------------------------------------------------------------------------- */
/*  Checklist item condicional — "Tentou e morreu" (mai/2026 3ª curadoria)    */
/* -------------------------------------------------------------------------- */

/**
 * Item prependado ao `checklistAntes` quando `tentativasAnteriores !== 'nunca'`.
 * Substituiu a antiga dica T_MORREU — fica mais útil como ação prática no
 * checklist do que como dica solta entre as outras.
 */
export const CHECKLIST_TENTOU_MORREU_ITEM: ChecklistItem = {
  titulo: 'Faça autópsia do programa anterior antes de subir o próximo',
  descricao:
    'Se vocês tentaram e morreu, mapear qual dos 3 motores falhou (motivação, conhecimento, ferramenta) evita repetir o erro. Workshop inicial com a estrategista da Boldfy ajuda nessa autópsia.',
  prazo: '1 reunião',
};

/* -------------------------------------------------------------------------- */
/*  Bloco 7.5 — SOBRE A BOLDFY (SaaS sempre + CaaS condicional)                */
/* -------------------------------------------------------------------------- */
/**
 * Cards da seção "Sobre a Boldfy", entre Battle card e CTA final.
 *
 * SOBRE_BOLDFY_SAAS aparece sempre (é o produto core).
 * SOBRE_BOLDFY_CAAS aparece SOMENTE se P11 = sim_full_content — quando o
 * respondente sinaliza que líderes topam postar mas precisam de quem produza.
 */
export const SOBRE_BOLDFY_SAAS: SobreBoldfyCard = {
  badge: 'Plataforma',
  titulo: 'Plataforma Boldfy',
  subtitulo:
    'O software que destrava Employee-Led Growth no dia a dia, sem montar máquina interna.',
  bullets: [
    'IA contextual pra ideação, refino e calendário de cada colaborador',
    'Brand Context: tom, pilares e territórios em um setup único',
    'Trilhas LXP, missões semanais e gamificação rodando sem cobrança manual',
    'Dashboard de earned media e alcance pronto pra board',
  ],
  ctaLabel: 'Quero conhecer a plataforma',
};

export const SOBRE_BOLDFY_CAAS: SobreBoldfyCard = {
  badge: 'Full Content',
  titulo: 'Boldfy Full Content',
  subtitulo:
    'Pra líderes que topam aparecer, mas não têm tempo de escrever: nossa equipe produz, o líder aprova.',
  bullets: [
    'Estrategista da Boldfy entrevista o líder pra captar ponto de vista',
    'Time de conteúdo produz posts no tom autêntico da pessoa',
    'Líder revisa e aprova em minutos pelo próprio painel',
    'Mantém autoria e voz, sem custo de tempo do líder',
  ],
  ctaLabel: 'Quero entender o Full Content',
};
