/**
 * Configuração das perguntas do quiz do Playbook ELG.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md §3.2.
 *       Curadoria pós-teste (mai/2026):
 *       - P5 e P9 removidas (redundantes/sem uso no output).
 *       - P3 consolidada de 7 → 4 opções (valores canônicos preservados).
 *       - P4 consolidada de 15 → 7 opções (labels novos, string livre).
 *       - P11 reformulada: detector de oportunidade Full Content (CaaS).
 *
 * Quando atualizar copy:
 *   1. Editar este arquivo (labels, icebreakers, descriptions).
 *   2. Build/lint deve continuar passando.
 *   3. Valores (`v`) NÃO podem mudar sem migration — eles batem com enums Zod.
 */

export type SeniorityValue = 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level';
/**
 * Banco mantém os 7 valores antigos. UI agora oferece só 4 botões, cada um
 * gravando o valor canônico do grupo. Playbooks antigos ficam intactos.
 */
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
export type BudgetValue = 'aprovado' | 'planejando' | 'precisa_justificar' | 'sem_budget';

/**
 * P11.5 — gasto mensal em ads (jun/2026).
 *
 * Pergunta opcional adicionada pra alimentar o gráfico "Ads vs ELG" no Bloco 2
 * do output. Faixas conservadoras pro perfil B2B brasileiro (foco em empresas
 * que já investem em mídia paga). Pessoa pode pular — quando pula, o gráfico
 * cai no modo conceitual.
 *
 * Midpoint usado pelo render pra cálculo do gráfico (lib/playbook/render.ts).
 */
export type GastoMensalAdsValue =
  | 'zero'
  | 'ate_10k'
  | '11_a_50k'
  | '51_a_100k'
  | '101_a_300k'
  | 'acima_300k';

/**
 * P11 reformulada (mai/2026 — curadoria pós-teste):
 *   - `sim_proprio` — líder topa postar do próprio perfil. Dispara dica universal
 *     "Lideranças puxando o time multiplicam adesão" + reforço de SaaS.
 *   - `sim_full_content` — líder topa mas precisa que alguém produza por ele.
 *     Dispara dica + bridge sutil pro Content as a Service (CaaS).
 *   - `nao_foco` — não é o foco agora. Silêncio (sem dica extra).
 */
export type SponsorshipValue = 'sim_proprio' | 'sim_full_content' | 'nao_foco';

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

  // P3 — área (consolidada de 7 → 4 opções no UI; banco preserva 7 valores
  // pra compat retroativa. Wizard grava o valor canônico do grupo).
  cargoArea: {
    n: 3,
    faiSay: 'Essa aqui define o template do seu playbook.',
    title: 'Em qual área você trabalha?',
    sub: 'Cada grupo de área tem angulação diferente pra Employee-Led Growth.',
    options: [
      { v: 'marketing', label: 'Marketing & Growth' },
      { v: 'vendas', label: 'Vendas' },
      { v: 'rh', label: 'RH & Employer Branding' },
      { v: 'outro', label: 'Outra' },
    ] satisfies Array<ChoiceOption<AreaValue>>,
  },

  // P4 — setor (consolidado 15 → 7 opções; string livre em companies.industry)
  setor: {
    n: 4,
    faiSay: 'Pra eu trazer exemplos do seu mercado.',
    title: 'Em qual setor sua empresa atua?',
    sub: 'Se não bater 100%, escolhe o mais próximo.',
    options: [
      { v: 'tech_saas_fintech', label: 'Tech / SaaS / Fintech' },
      { v: 'consultoria_servicos_b2b', label: 'Consultoria & Serviços B2B' },
      { v: 'industria_operacoes', label: 'Indústria & Operações', desc: 'Manufatura, agro, logística, construção, energia' },
      { v: 'educacao_saude', label: 'Educação & Saúde' },
      { v: 'varejo_ecommerce', label: 'Varejo / E-commerce' },
      { v: 'imobiliario_terceiro_setor', label: 'Imobiliário / Terceiro Setor' },
      { v: 'outro', label: 'Outro' },
    ] satisfies Array<ChoiceOption<string>>,
  },

  // P5 (colaboradores postando) — REMOVIDA na curadoria (mai/2026).
  // Redundante com P6 (voz atual) + P7 (tentativas anteriores).

  // P6 — voz da empresa
  vozAtual: {
    n: 5,
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
    n: 6,
    faiSay: 'Histórico importa, vou contornar erros se houver.',
    title: 'Vocês já tentaram algum programa de advocacy antes?',
    sub: '',
    options: [
      { v: 'nunca', label: 'Nunca tentamos' },
      { v: 'morreu', label: 'Tentamos e o programa morreu nos primeiros meses' },
      { v: 'baixa_adesao', label: 'Temos algo rodando, mas com baixa adesão' },
      { v: 'maduro', label: 'Temos programa maduro, queremos otimizar' },
    ] satisfies Array<ChoiceOption<TentativasValue>>,
  },

  // P8 — dores principais (multi-select de até 2)
  doresPrincipais: {
    n: 7,
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

  // P9 (resultados prioritários) — REMOVIDA na curadoria (mai/2026).
  // Resultado esperado agora é DERIVADO das dores principais (P8), exibido
  // como micro-bloco "Resultados esperados" no playbook.

  // P10 — budget
  budgetStatus: {
    n: 8,
    faiSay: 'Pra eu calibrar a recomendação ao que é viável.',
    title: 'Existe budget alocado (ou planejado) pra essa estratégia?',
    sub: 'Vou ajustar as dicas conforme sua resposta.',
    options: [
      { v: 'aprovado', label: 'Sim, já temos verba aprovada' },
      { v: 'planejando', label: 'Estamos planejando incluir no próximo orçamento' },
      { v: 'precisa_justificar', label: 'Ainda não, precisaríamos justificar internamente' },
      { v: 'sem_budget', label: 'Não vejo budget como opção no momento' },
    ] satisfies Array<ChoiceOption<BudgetValue>>,
  },

  // P11 — sponsorship/Full Content reformulada (mai/2026)
  sponsorshipLideranca: {
    n: 9,
    faiSay: 'Última pergunta, sobre suas lideranças.',
    title: 'Sua liderança (C-level, founder) tem interesse em fazer parte do programa?',
    sub: 'Se sim, isso muda o caminho da Boldfy pra vocês.',
    options: [
      { v: 'sim_proprio', label: 'Sim, toparia postar do próprio perfil regularmente' },
      { v: 'sim_full_content', label: 'Sim, mas só se alguém produzisse o conteúdo por ela' },
      { v: 'nao_foco', label: 'Não é o foco agora' },
    ] satisfies Array<ChoiceOption<SponsorshipValue>>,
  },

  // P11.5 — gasto em ads (jun/2026, opcional)
  // Aparece após sponsorshipLideranca, antes de observacoesLivres. Pode ser
  // pulada via botão "Pular" no footer (mesmo padrão de observacoesLivres).
  // Faixas largas pra reduzir fricção; midpoint é calculado no render.
  gastoMensalAds: {
    n: 9, // opcional, não conta como obrigatória — fica no mesmo nº da P9
    faiSay: 'Bônus opcional. Vai me ajudar a desenhar um gráfico exclusivo pra vocês.',
    title: 'Quanto vocês investem em ads por mês hoje?',
    sub: 'Vou comparar com o cenário de Employee-Led Growth no seu playbook. Se preferir não dizer, pula pro próximo.',
    options: [
      { v: 'zero', label: 'Não investimos em ads' },
      { v: 'ate_10k', label: 'Até R$ 10k / mês' },
      { v: '11_a_50k', label: 'R$ 11k a R$ 50k / mês' },
      { v: '51_a_100k', label: 'R$ 51k a R$ 100k / mês' },
      { v: '101_a_300k', label: 'R$ 101k a R$ 300k / mês' },
      { v: 'acima_300k', label: 'Mais de R$ 300k / mês' },
    ] satisfies Array<ChoiceOption<GastoMensalAdsValue>>,
  },

  // Aberta opcional
  observacoesLivres: {
    n: 9, // pergunta opcional, não conta como obrigatória
    faiSay: 'Antes da identificação, uma livre, pode pular se preferir.',
    title: 'Tem alguma dor específica que não cobrimos?',
    sub: 'Conta o que tá te incomodando, vou incorporar no plano.',
    placeholder: 'Ex: nosso time é muito técnico e resiste a expor opinião pública...',
    maxLength: 500,
  },

  // Identificação
  identificacao: {
    n: 9,
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
  'vozAtual',
  'tentativasAnteriores',
  'doresPrincipais',
  'budgetStatus',
  'sponsorshipLideranca',
  'gastoMensalAds',
  'observacoesLivres',
  'identificacao',
] as const;

export type StepKey = (typeof STEP_ORDER)[number];

/** Total de perguntas obrigatórias (sem contar identificação nem observação livre). */
export const TOTAL_PERGUNTAS_OBRIGATORIAS = 9;
