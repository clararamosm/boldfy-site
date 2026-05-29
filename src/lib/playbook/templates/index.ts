/**
 * Catálogo de copy do Playbook de Employee-Led Growth.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth-copy-final.md
 *
 * Estrutura (pós curadoria mai/2026):
 *   - SNAPSHOT_FECHAMENTO: 10 strings, 1 por template-key (Bloco 2)
 *   - TIPS_LIBRARY: 21 dicas com metadados de seleção (Bloco 4)
 *     · 15 da copy-final original + 4 da curadoria mai/2026 (B_PRECISA_JUSTIFICAR,
 *       B_SEM_BUDGET, L_PROPRIO, L_FULL_CONTENT) + 2 da curadoria visual/biblioteca
 *       (U6 variação visual, U7 biblioteca de assets)
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

import type { ChecklistItem, SobreBoldfyCard, TeseMotivo, Tip } from './types';

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
/*  Bloco 4 — TIPS_LIBRARY (21 dicas com metadados de seleção)                 */
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
  {
    id: 'U1',
    numero: 'Dica 01',
    titulo: 'Comece com 5 a 8 vozes, não com a empresa inteira',
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
    titulo: 'Resolva posicionamento antes de cobrar escrita',
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
    titulo: 'Substitua post institucional por bastidor pessoal',
    icon: 'MessageSquare',
    boldfy: {
      titulo: 'IA contextual de voz pessoal',
      items: [
        'IA lê histórico e estilo de cada colaborador',
        'Sugere ângulos a partir do ponto de vista único',
        'Conteúdo sai pessoal, não institucional disfarçado',
      ],
    },
    selectors: { universal: true },
  },
  {
    id: 'U4',
    numero: 'Dica 04',
    titulo: 'Ofereça ganho real e tire fricção do caminho',
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
    titulo: 'Meça earned media e qualidade de inbound, não curtida',
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
  {
    id: 'U6',
    numero: 'Dica 06',
    titulo: 'Faça cada peça circular com hooks diferentes pra evitar achatamento',
    icon: 'Palette',
    boldfy: {
      titulo: 'Variação visual + IA de hooks',
      items: [
        'Mesma peça-base, 3-5 hooks diferentes por colaborador',
        'IA varia título, ângulo de abertura e legenda da peça',
        'Brand Context mantém identidade consistente entre variações',
        'Dashboard mostra qual variação puxou mais alcance',
      ],
      callout: {
        label: 'Veja o case da Semrush — 3 clusters de variação visual na prática',
        href: '/case-semrush',
      },
    },
    selectors: { universal: true },
  },
  {
    id: 'U7',
    numero: 'Dica 07',
    titulo: 'Centralize as peças na biblioteca pra time pegar e adaptar sozinho',
    icon: 'Library',
    boldfy: {
      titulo: 'Biblioteca de assets da empresa',
      items: [
        'Painel admin com peças aprovadas, organizadas por tema',
        'Colaborador pega direto pela plataforma, sem fila de design',
        'Brand Context garante consistência mesmo com auto-serviço',
        'Tracking de qual peça circulou mais e quem usou',
      ],
      // Callout dinâmico injetado em render.ts quando porteColaboradores ≥ 40
      // (mostra o pacote Starter/Growth/Scale grátis correspondente).
    },
    selectors: { universal: true },
  },

  // ===================== ÁREA-ESPECÍFICAS (3) =====================
  {
    id: 'A_MARKETING',
    numero: '',
    titulo: 'Trate Employee-Led como canal de mídia, não como engajamento',
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
    titulo: 'Audite o perfil de cada vendedor antes da próxima fria',
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
    titulo: 'Pare de postar cultura interna pra atrair talento sênior',
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
    titulo: 'Use CPM equivalente como argumento de orçamento',
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
    titulo: 'Distribua voz pra 5-10 perfis e libere a page de carregar tudo',
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
    titulo: 'Mapeie 3-5 vozes do concorrente pra calibrar pauta e ritmo',
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
    titulo: 'Ative colaboradores como referência viva pro próximo candidato',
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
    titulo: 'Faça autópsia do programa anterior antes de subir o próximo',
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
    titulo: 'Distribua a voz do founder pra 3-5 pessoas internas',
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
    titulo: 'Assuma o papel de sponsor: 1 post/semana e aprovação em 24h',
    tagEspecifica: 'C-Level',
    icon: 'Crown',
    boldfy: {
      titulo: 'Painel admin + missões pro sponsor',
      items: [
        'Painel admin específico pra sponsor',
        'Missões de exemplo pra C-level postar consistentemente',
        'SLA de aprovação rastreado no dashboard',
        'Sponsor visível como motor do programa',
      ],
    },
    selectors: { seniority: ['c_level'] },
  },

  // ===================== BUDGET-ESPECÍFICAS (2 — curadoria mai/2026) =======
  {
    id: 'B_PRECISA_JUSTIFICAR',
    numero: '',
    titulo: 'Construa o caso com earned media antes de pedir budget',
    tagEspecifica: 'Precisa justificar',
    icon: 'FileText',
    boldfy: {
      titulo: 'Slide de defesa de budget pré-pronto',
      items: [
        'CPM equivalente medido desde o primeiro post',
        'Comparativo earned vs paid sai automático',
        'Slide de board exportável, sem planilha manual',
        'Linguagem pronta pra finance e CFO',
      ],
    },
    selectors: { budget: ['precisa_justificar'] },
  },
  {
    id: 'B_SEM_BUDGET',
    numero: '',
    titulo: 'Comece pequeno e gere dado pra desbloquear budget no Q seguinte',
    tagEspecifica: 'Sem budget',
    icon: 'PiggyBank',
    boldfy: {
      titulo: 'Trial guiado + plano sem fricção',
      items: [
        'Setup mínimo com 5-8 colaboradores',
        'Resultado em 60 dias vira argumento de board',
        'Sem contrato anual de cara — destrava no Q seguinte',
        'Estrategista da Boldfy acompanha desde o trial',
      ],
    },
    selectors: { budget: ['sem_budget'] },
  },

  // ===================== SPONSORSHIP-ESPECÍFICAS (2 — curadoria mai/2026) ==
  {
    id: 'L_PROPRIO',
    numero: '',
    titulo: 'Acelere os líderes que topam postar com método e ferramenta',
    tagEspecifica: 'Líder topa postar',
    icon: 'Sparkles',
    boldfy: {
      titulo: 'IA assistente + território editorial por líder',
      items: [
        'Cada líder ganha território editorial no Brand Context',
        'IA sugere ângulos a partir do dia a dia da pessoa',
        'Refino e calendário sem trocar de app',
        'Métrica individual mostra quem está puxando o feed',
      ],
    },
    selectors: { sponsorship: ['sim_proprio'] },
  },
  {
    id: 'L_FULL_CONTENT',
    numero: '',
    titulo: 'Terceirize a produção, mas mantenha a autoria do líder',
    tagEspecifica: 'Full Content',
    icon: 'Feather',
    boldfy: {
      titulo: 'Modalidade Full Content (CaaS) da Boldfy',
      items: [
        'Estrategista entrevista o líder pra captar ponto de vista',
        'Equipe Boldfy produz posts no tom da pessoa',
        'Líder revisa e aprova em minutos, sem escrever',
        'Sai opinião autêntica, sem custo de tempo do líder',
      ],
    },
    selectors: { sponsorship: ['sim_full_content'] },
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloco 4.5 — RESULTADOS_POR_DOR (novo mai/2026)                             */
/* -------------------------------------------------------------------------- */
/**
 * Mapeia cada dor P8 pra 1 frase curta com o resultado esperado.
 * Render escolhe as frases correspondentes às dores selecionadas e renderiza
 * como micro-bloco entre Dicas (Bloco 4) e Checklist (Bloco 5).
 *
 * 'outra' fica de fora (sem mapeamento) — micro-bloco só renderiza se sobrar
 * pelo menos 1 resultado mapeado.
 */
export const RESULTADOS_POR_DOR: Partial<Record<DorPrincipalValue, string>> = {
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
