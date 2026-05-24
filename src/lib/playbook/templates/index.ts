/**
 * Catálogo de copy do Playbook de Employee-Led Growth.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 *
 * Estrutura (pós sessão de copy editorial mai/2026):
 *   - SNAPSHOT_FECHAMENTO: 10 strings, 1 por template-key (Bloco 2)
 *   - TIPS_LIBRARY: 15 dicas com metadados de seleção (Bloco 4)
 *   - HERO_LEGENDA_POR_DOR: legenda do soco numérico (Bloco 1, varia por dor 1)
 *   - CTA_TITULO_POR_DOR: título do CTA final (Bloco 8, varia por dor 1)
 *   - CHECKLIST_BOLDFY: 4 itens fixos do "Na Boldfy" (Bloco 5)
 *   - TESE_MOTIVOS: 3 cards fixos da Tese (Bloco 3)
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
 */

import type { ChecklistItem, TeseMotivo, Tip } from './types';

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
/*  Bloco 4 — TIPS_LIBRARY (15 dicas com metadados de seleção)                 */
/* -------------------------------------------------------------------------- */
/**
 * Pool completo. Seleção runtime via `selectTipsForPlaybook` em render.ts
 * (spec copy-final §2.4). Universais sempre entram; específicas pegam por
 * área, dor (até 2), tentativas, voz e seniority.
 */
export const TIPS_LIBRARY: Tip[] = [
  // ===================== UNIVERSAIS (5) =====================
  {
    id: 'U1',
    numero: 'Dica 01',
    titulo: 'Comece pequeno, com vozes estratégicas',
    texto:
      'Tentar ativar 30 pessoas de uma vez esfria em 6 semanas. Comece com 5 a 8 colaboradores pra testar o programa, cada um cobrindo um território diferente. Quando vira caso interno, o resto vem sozinho.',
    icon: 'Users',
    boldfy: {
      titulo: 'Primeiro grupo + territórios editoriais',
      items: [
        'Admin define os 5-8 primeiros no painel',
        'Cada um recebe território no Brand Context',
        'Missões e gamificação rodam só pro grupo',
        'Escala adiciona sem refazer setup',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U2',
    numero: 'Dica 02',
    titulo: 'Gargalo é posicionamento, não escrita',
    texto:
      'Pessoa trava porque não sabe sobre o que falar nem qual ângulo dela cabe na marca. Marca pessoal e corporativa precisam conversar pra parar de soar genérico.',
    icon: 'Compass',
    boldfy: {
      titulo: 'Trilhas de discovery + Brand Context',
      items: [
        'Trilha de marca pessoal no app, no ritmo de cada um',
        'Brand Context da empresa configurado uma vez',
        'IA cruza voz pessoal × marca corporativa',
        'Conteúdo soa pessoal e fica alinhado',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U3',
    numero: 'Dica 03',
    titulo: 'Conteúdo pessoal supera institucional',
    texto:
      'Post "tenho orgulho de anunciar" não gera autoridade. Bastidor de projeto, lição de call difícil, opinião sobre o mercado, sim. Aumenta autoridade da empresa por efeito halo.',
    icon: 'MessageSquare',
    boldfy: {
      titulo: 'IA contextual de voz pessoal',
      items: [
        'IA lê histórico e estilo de cada colaborador',
        'Sugere ideias e ângulos a partir do ponto de vista único',
        'Conteúdo sai pessoal, não institucional disfarçado',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U4',
    numero: 'Dica 04',
    titulo: 'Recompensa real, suporte invisível',
    texto:
      'Curtida não paga tempo investido. ELG sobrevive com ganho real percebido (autoridade, carreira) e suporte invisível (ideação, refino, calendário) embutido.',
    icon: 'Trophy',
    boldfy: {
      titulo: 'Gamificação + recompensas + IA assistente',
      items: [
        'Pontos automáticos por ação',
        'Ranking interno e loja de recompensas',
        'IA pra ideação, refino e calendário',
        'Suporte invisível embutido, sem máquina interna',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U5',
    numero: 'Dica 05',
    titulo: 'Resultado é indireto e acumulativo',
    texto:
      'ELG não viraliza. Vira reunião sem fila, prospect respondendo mais rápido, deal aquecendo sozinho. Métrica certa é earned media e qualidade de inbound, não like.',
    icon: 'TrendingUp',
    boldfy: {
      titulo: 'Dashboard de earned media + tracking',
      items: [
        'Earned media em R$ calculado automaticamente',
        'Alcance por colaborador rastreado',
        'Inbound qualificado conectado ao dashboard',
        'Métrica que defende em board, não like',
      ],
    },
    selectors: { universal: true },
  },

  // ===================== ÁREA-ESPECÍFICAS (3) =====================
  {
    id: 'A_MARKETING',
    numero: '',
    titulo: 'Marketing trata como canal de mídia',
    texto:
      'Quando Marketing trata ELG como "engajamento de gente", cai pro RH ou some no organograma. Quando trata como canal de mídia (com métricas e calendário), ganha orçamento e protagonismo.',
    tagEspecifica: 'Marketing',
    icon: 'BarChart3',
    boldfy: {
      titulo: 'Métricas pré-configuradas pra board',
      items: [
        'Earned media em R$ por colaborador',
        'CPM equivalente automático ao CPM LinkedIn BR',
        'Alcance e inbound consolidados',
        'Slide de board sai pronto, sem planilha',
      ],
    },
    selectors: { area: ['marketing'] },
  },
  {
    id: 'A_VENDAS',
    numero: '',
    titulo: 'Vendedor invisível é prospect que não responde',
    texto:
      'O prospect stalkeia o vendedor antes de responder a fria. Se o perfil é vazio (sem post, sem opinião, sem prova de competência), a taxa de resposta despenca. Antes de campanha de outbound nova, audita perfil de cada SDR e BDR.',
    tagEspecifica: 'Vendas',
    icon: 'UserCheck',
    boldfy: {
      titulo: 'Trilha de marca pessoal + social selling',
      items: [
        'Setup de perfil guiado por trilha LXP',
        'IA assistente puxa autoridade técnica do vendedor',
        'Conteúdo amarra com pipeline aberto',
        'Métrica de inbound conectada ao vendedor certo',
      ],
    },
    selectors: { area: ['vendas'] },
  },
  {
    id: 'A_RH',
    numero: '',
    titulo: 'Conteúdo de cultura interna não converte talento',
    texto:
      'Post de "amamos nossa cultura" é bonito de dentro pra dentro, mas não puxa candidato sênior. Talento bom quer ver opinião técnica, bastidor de problema real, evidência de que vai aprender algo. RH precisa pensar conteúdo com lente de mercado, não de pesquisa de clima.',
    tagEspecifica: 'RH',
    icon: 'Heart',
    boldfy: {
      titulo: 'Brand Context alinhado com Marketing',
      items: [
        'Pilares de conteúdo puxados de Marketing',
        'Voz pessoal de cada colaborador respeitada',
        'IA evita post auto-centrado de cultura interna',
        'Inbound de talento rastreado no dashboard',
      ],
    },
    selectors: { area: ['rh'] },
  },

  // ===================== DOR-ESPECÍFICAS (4) =====================
  {
    id: 'D_CAC',
    numero: '',
    titulo: 'Earned media é o número que defende',
    texto:
      'Cada R$ que entra como earned é R$ que não pagam em Ads. CPM equivalente medido desde o dia 1 vira argumento que diminui dependência de paid e protege o budget orgânico.',
    tagEspecifica: 'CAC subindo',
    icon: 'DollarSign',
    boldfy: {
      titulo: 'CPM equivalente automático',
      items: [
        'Cada post vira linha no dashboard de earned media',
        'Sem planilha manual, sem reconciliação mensal',
        'Argumento pronto pra defender budget orgânico',
        'Em breve fase 2: lista de leads engajados pra remarketing direto',
      ],
    },
    selectors: { dor: ['cac_subindo'] },
  },
  {
    id: 'D_COMPANYPAGE',
    numero: '',
    titulo: 'Page corporativa não puxa demanda sozinha',
    texto:
      'Page funciona como vitrine institucional, mas quase nunca como canal de demanda. O atalho não é melhorar o conteúdo da page, é distribuir voz pra 5-10 pessoas postando do perfil delas. O alcance orgânico de pessoa é 4 a 6 vezes maior.',
    tagEspecifica: 'Company Page morta',
    icon: 'Globe',
    boldfy: {
      titulo: 'Publicação direta no perfil de cada colaborador',
      items: [
        'Integração nativa com LinkedIn pessoal',
        'Calendário compartilhado de quem posta o quê',
        'Métricas individuais consolidadas no admin',
        'Brand Context garante consistência da marca',
      ],
    },
    selectors: { dor: ['company_page_morta'] },
  },
  {
    id: 'D_CONCORRENTE',
    numero: '',
    titulo: 'Concorrente tem mais vozes, não mais orçamento',
    texto:
      'Concorrente menor que aparece mais no feed quase sempre tem mais gente postando, não mais mídia paga. Mapear 3-5 perfis dele que crescem vira benchmark de pauta e ritmo pro primeiro grupo.',
    tagEspecifica: 'Concorrente dominando',
    icon: 'Target',
    boldfy: {
      titulo: 'Análise de audiência por colaborador',
      items: [
        'Mostra com quem cada colaborador engaja',
        'Onde tá ganhando audiência real',
        'Sinal pra ajustar pauta e nicho',
        'Benchmark constante contra quem domina o feed',
      ],
    },
    selectors: { dor: ['concorrente_dominando'] },
  },
  {
    id: 'D_TALENTO',
    numero: '',
    titulo: 'Marca empregadora vive no feed do colaborador',
    texto:
      'Talento bom não procura Glassdoor, procura LinkedIn. Cada colaborador ativo é uma referência viva que o próximo candidato vai stalkear antes de aplicar. Sem colaborador presente, o concorrente mais visível atrai.',
    tagEspecifica: 'Talento saindo',
    icon: 'Award',
    boldfy: {
      titulo: 'Trilha LXP + brand alignment',
      items: [
        'Trilhas guiam colaborador a contar bastidor relevante',
        'Brand Context evita post auto-centrado',
        'Inbound de candidato qualificado rastreado',
        'Dashboard mostra quais colaboradores puxam mais talento',
      ],
    },
    selectors: { dor: ['talento_saindo'] },
  },

  // ===================== TENTATIVAS-ESPECÍFICAS (1) =====================
  {
    id: 'T_MORREU',
    numero: '',
    titulo: 'Faça autópsia do programa anterior',
    texto:
      'Programa morreu por 1 dos 3 motivos clássicos. Subir o próximo sem identificar qual falhou é repetir o erro. Conversa de 30min com quem participou basta.',
    tagEspecifica: 'Tentou e morreu',
    icon: 'RotateCcw',
    boldfy: {
      titulo: 'Setup guiado pelos 3 motivos',
      items: [
        'Workshop inicial com a estrategista da Boldfy',
        'Mapeia qual motor falhou no programa anterior',
        'Calibra o novo pra cobrir esse gap específico',
        'Evita o efeito "já tentamos, não funcionou" no time',
      ],
    },
    selectors: { tentativas: ['morreu'] },
  },

  // ===================== VOZ-ESPECÍFICAS (1) =====================
  {
    id: 'V_FOUNDER_SOLO',
    numero: '',
    titulo: 'Founder solo é fragilidade operacional',
    texto:
      'Founder postando sozinho funciona até a primeira semana de férias. Distribuir voz pra 3-5 pessoas internas não tira protagonismo do founder, multiplica os canais da marca. O feed da empresa não morre quando ele para.',
    tagEspecifica: 'Founder solo',
    icon: 'Network',
    boldfy: {
      titulo: 'Territórios editoriais distribuídos',
      items: [
        'Brand Context define quem fala de quê',
        'Founder continua sendo voz principal',
        'C-suite, head de produto, head de operação cobrem outros territórios',
        'Programa não fica refém da agenda de uma pessoa',
      ],
    },
    selectors: { voz: ['founder_solo'] },
  },

  // ===================== SENIORITY-ESPECÍFICAS (1) =====================
  {
    id: 'S_CLEVEL',
    numero: '',
    titulo: 'Você é C-level: o sponsor é você',
    texto:
      'Não terceiriza sponsorship pro gestor que toca. Se você é C-level e está nessa página, o sponsor visível precisa ser você. Compromisso mínimo: 1 post seu por semana e aprovação de pauta dos colaboradores em até 24h.',
    tagEspecifica: 'C-Level',
    icon: 'Crown',
    boldfy: {
      titulo: 'Comitê admin + missões pro sponsor',
      items: [
        'Painel admin específico pra sponsor',
        'Missões de exemplo pra C-level postar consistentemente',
        'SLA de aprovação rastreado no dashboard',
        'Sponsor visível como motor do programa',
      ],
    },
    selectors: { seniority: ['c_level'] },
  },
];
