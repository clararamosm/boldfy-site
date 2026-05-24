/**
 * Configuração das perguntas do quiz do Playbook ELG.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md §3.2.
 *
 * Centralizada aqui pra:
 *   - Render do wizard ler em runtime (1 fonte de verdade UI ↔ schema Zod)
 *   - Sessão de copy editorial poder iterar sem mexer no componente
 *   - Type-safety com Zod (enums casam com PlaybookEmployeeLedGrowthLeadSchema)
 *
 * Quando atualizar copy:
 *   1. Editar este arquivo (labels, icebreakers, descriptions).
 *   2. Build/lint deve continuar passando.
 *   3. Valores (`v`) NÃO podem mudar — eles batem com enums Zod no server.
 */

export type SeniorityValue = 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level';
export type AreaValue =
  | 'marketing' | 'growth' | 'vendas' | 'rh' | 'employer_branding' | 'comunicacao' | 'outro';
export type VozValue =
  | 'founder_solo' | 'alguns_executivos' | 'time_esparso' | 'ninguem' | 'programa_rodando';
export type TentativasValue = 'nunca' | 'morreu' | 'baixa_adesao' | 'maduro';
export type DorValue =
  | 'company_page_morta'
  | 'cac_subindo'
  | 'concorrente_dominando'
  | 'vendedor_invisivel'
  | 'talento_saindo'
  | 'marca_uma_pessoa'
  | 'outra';
export type ResultadoValue =
  | 'awareness' | 'pipeline' | 'reducao_paid' | 'talento' | 'autoridade' | 'engajamento';
export type BudgetValue = 'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget';
export type SponsorshipValue = 'sim_alguns_postam' | 'sim_com_ajuda' | 'talvez' | 'nao';
export type ColaboradoresPostandoValue = 'nenhum' | '1_3' | '4_10' | 'mais_10' | 'nao_sei';

export type ChoiceOption<V extends string> = {
  v: V;
  label: string;
  desc?: string;
};

export const QUESTIONS = {
  // P1 — porte (input numérico)
  porte: {
    n: 1,
    faiSay: 'Oi! Bora começar pelo número que mais pesa no cálculo do seu earned media.',
    title: 'Quantos colaboradores sua empresa tem hoje?',
    sub: 'Pode ser número aproximado. Esse dado vai pra calculadora depois.',
    initial: 80,
    min: 1,
  },

  // P2 — senioridade
  cargoSenioridade: {
    n: 2,
    faiSay: 'Show. Pra eu calibrar o tom certo do playbook...',
    title: 'Qual seu cargo na empresa?',
    sub: 'Vou usar pra você convencer quem precisa ser convencido.',
    options: [
      { v: 'analista', label: 'Analista', desc: 'Operação, execução hands-on' },
      { v: 'coordenador', label: 'Coordenador', desc: 'Coordena equipe pequena' },
      { v: 'gerente', label: 'Gerente', desc: 'Líder de área, responsável por OKRs' },
      { v: 'diretor', label: 'Diretor', desc: 'Reporta direto pro C-level' },
      { v: 'c_level', label: 'C-Level', desc: 'CEO, CMO, COO, founder' },
    ] satisfies Array<ChoiceOption<SeniorityValue>>,
  },

  // P3 — área
  cargoArea: {
    n: 3,
    faiSay: 'Essa aqui define o template do seu playbook.',
    title: 'Em qual área você trabalha?',
    sub: 'Marketing, vendas e RH têm angulações diferentes pra Employee-Led Growth.',
    options: [
      { v: 'marketing', label: 'Marketing' },
      { v: 'growth', label: 'Growth' },
      { v: 'vendas', label: 'Vendas' },
      { v: 'rh', label: 'RH / People' },
      { v: 'employer_branding', label: 'Employer Branding' },
      { v: 'comunicacao', label: 'Comunicação' },
      { v: 'outro', label: 'Outro' },
    ] satisfies Array<ChoiceOption<AreaValue>>,
  },

  // P4 — setor (lista controlada — 15 setores spec §3.2)
  setor: {
    n: 4,
    faiSay: 'Pra eu trazer exemplos do seu mercado.',
    title: 'Em qual setor sua empresa atua?',
    sub: 'Se não bater 100%, escolhe o mais próximo.',
    options: [
      { v: 'tech_saas', label: 'Tech / SaaS' },
      { v: 'fintech', label: 'Fintech' },
      { v: 'consultoria', label: 'Consultoria' },
      { v: 'industria', label: 'Indústria' },
      { v: 'educacao', label: 'Educação / EdTech' },
      { v: 'saude', label: 'Saúde' },
      { v: 'varejo', label: 'Varejo / E-commerce' },
      { v: 'servicos_b2b', label: 'Serviços B2B' },
      { v: 'construcao', label: 'Construção' },
      { v: 'agronegocio', label: 'Agronegócio' },
      { v: 'logistica', label: 'Logística' },
      { v: 'energia', label: 'Energia' },
      { v: 'imobiliario', label: 'Imobiliário' },
      { v: 'terceiro_setor', label: 'Terceiro Setor' },
      { v: 'outro', label: 'Outro' },
    ] satisfies Array<ChoiceOption<string>>,
  },

  // P5 — colaboradores postando hoje
  colaboradoresPostando: {
    n: 5,
    faiSay: 'Pra entender o ponto de partida.',
    title: 'Quantos colaboradores postam no LinkedIn pelo menos 1x por mês?',
    sub: 'Estimativa serve.',
    options: [
      { v: 'nenhum', label: 'Nenhum ou quase ninguém' },
      { v: '1_3', label: '1 a 3 pessoas' },
      { v: '4_10', label: '4 a 10 pessoas' },
      { v: 'mais_10', label: 'Mais de 10 pessoas' },
      { v: 'nao_sei', label: 'Não sei dizer' },
    ] satisfies Array<ChoiceOption<ColaboradoresPostandoValue>>,
  },

  // P6 — voz da empresa
  vozAtual: {
    n: 6,
    faiSay: 'Agora a parte boa. Não tem certo nem errado aqui.',
    title: 'Quem é a "voz" da sua empresa no LinkedIn hoje?',
    sub: 'Isso define o ponto de partida do plano que vou montar.',
    options: [
      { v: 'founder_solo', label: 'Só o founder/CEO posta regularmente', desc: 'Founder-led growth puro' },
      { v: 'alguns_executivos', label: 'Alguns executivos postam, sem método', desc: 'Vontade dispersa' },
      { v: 'time_esparso', label: 'O time todo posta de vez em quando', desc: 'Movimento espontâneo' },
      { v: 'ninguem', label: 'Ninguém posta com regularidade', desc: 'Silêncio corporativo' },
      { v: 'programa_rodando', label: 'Já temos programa rodando', desc: 'Vocês querem otimizar' },
    ] satisfies Array<ChoiceOption<VozValue>>,
  },

  // P7 — tentativas anteriores
  tentativasAnteriores: {
    n: 7,
    faiSay: 'Histórico importa — vou contornar erros se houver.',
    title: 'Vocês já tentaram algum programa de advocacy antes?',
    sub: '',
    options: [
      { v: 'nunca', label: 'Nunca tentamos' },
      { v: 'morreu', label: 'Tentamos e o programa morreu nos primeiros meses' },
      { v: 'baixa_adesao', label: 'Temos algo rodando, mas com baixa adesão' },
      { v: 'maduro', label: 'Temos programa maduro, queremos otimizar' },
    ] satisfies Array<ChoiceOption<TentativasValue>>,
  },

  // P8 — dores principais (multi-select de até 2, mai/2026)
  // Reconhece combinações comuns no B2B BR (ex: CAC subindo + Company Page morta)
  // que a primeira versão de radio único forçava o respondente a escolher uma só.
  // Primeira dor selecionada define template-key + soco numérico + CTA final.
  doresPrincipais: {
    n: 8,
    faiSay: 'Essa decide o "soco no estômago" do seu playbook. Pode marcar até 2.',
    title: 'Quais suas dores principais hoje?',
    sub: 'Se cabem duas no seu cenário, marca as duas. A primeira define o foco da estratégia.',
    max: 2,
    options: [
      { v: 'company_page_morta', label: 'Nossa Company Page tem baixo engajamento e não gera demanda' },
      { v: 'cac_subindo', label: 'CAC subindo, dependência alta de paid media' },
      { v: 'concorrente_dominando', label: 'Concorrente menor aparece mais no feed que a gente' },
      { v: 'vendedor_invisivel', label: 'Vendedores invisíveis no LinkedIn, cold outreach ignorado' },
      { v: 'talento_saindo', label: 'Talentos bons vão pra empresas mais "visíveis"' },
      { v: 'marca_uma_pessoa', label: 'Marca depende demais de uma pessoa só (founder, CEO)' },
      { v: 'outra', label: 'Outra' },
    ] satisfies Array<ChoiceOption<DorValue>>,
  },

  // P9 — resultados prioritários (multi-select, máx 2)
  resultadosPrioritarios: {
    n: 9,
    faiSay: 'Última das objetivas — marca até 2.',
    title: 'Que resultado é prioridade pra você?',
    sub: 'Vou destacar especialmente os que você marcar no playbook.',
    max: 2,
    options: [
      { v: 'awareness', label: 'Awareness orgânico', desc: 'Share of voice no LinkedIn' },
      { v: 'pipeline', label: 'Pipeline pra vendas', desc: 'Leads qualificados' },
      { v: 'reducao_paid', label: 'Reduzir mídia paga', desc: 'Menos dependência de Ads' },
      { v: 'talento', label: 'Atrair talento', desc: 'Candidaturas inbound' },
      { v: 'autoridade', label: 'Autoridade do time', desc: 'Referência no nicho' },
      { v: 'engajamento', label: 'Engajamento interno', desc: 'Retenção e orgulho' },
    ] satisfies Array<ChoiceOption<ResultadoValue>>,
  },

  // P10 — budget
  budgetStatus: {
    n: 10,
    faiSay: 'Pra eu calibrar a recomendação ao que é viável.',
    title: 'Existe budget alocado (ou planejado) pra essa estratégia?',
    sub: '',
    options: [
      { v: 'aprovado', label: 'Sim, já temos verba aprovada' },
      { v: 'planejando', label: 'Estamos planejando incluir no próximo orçamento' },
      { v: 'precisa_justificar', label: 'Ainda não, precisaríamos justificar internamente' },
      { v: 'sem_budget', label: 'Não vejo budget como opção no momento' },
    ] satisfies Array<ChoiceOption<BudgetValue>>,
  },

  // P11 — sponsorship liderança
  sponsorshipLideranca: {
    n: 11,
    faiSay: 'A última pergunta-chave.',
    title: 'A liderança toparia postar com regularidade?',
    sub: 'Sponsorship faz ou quebra programas de ELG.',
    options: [
      { v: 'sim_alguns_postam', label: 'Sim, alguns executivos já postam' },
      { v: 'sim_com_ajuda', label: 'Sim, mas precisariam de ajuda' },
      { v: 'talvez', label: 'Talvez, depende da proposta' },
      { v: 'nao', label: 'Não, eles não topariam' },
    ] satisfies Array<ChoiceOption<SponsorshipValue>>,
  },

  // Aberta opcional
  observacoesLivres: {
    n: 11, // mantém n=11 (pergunta opcional, não conta)
    faiSay: 'Antes da identificação, uma livre — pode pular se preferir.',
    title: 'Tem alguma dor específica que não cobrimos?',
    sub: 'Conta o que tá te incomodando, vou incorporar no plano.',
    placeholder: 'Ex: nosso time é muito técnico e resiste a expor opinião pública...',
    maxLength: 500,
  },

  // Identificação
  identificacao: {
    n: 11,
    faiSay: 'Pra eu criar sua página exclusiva do playbook...',
    title: 'Pra onde mando seu playbook?',
    sub: 'Vou gerar uma página única pra você compartilhar com seu time.',
  },
} as const;

/** Lista ordenada dos steps do quiz pra navegação prev/next. */
export const STEP_ORDER = [
  'porte',
  'cargoSenioridade',
  'cargoArea',
  'setor',
  'colaboradoresPostando',
  'vozAtual',
  'tentativasAnteriores',
  'doresPrincipais',
  'resultadosPrioritarios',
  'budgetStatus',
  'sponsorshipLideranca',
  'observacoesLivres',
  'identificacao',
] as const;

export type StepKey = (typeof STEP_ORDER)[number];
