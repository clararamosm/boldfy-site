/**
 * Schemas zod para validação de inputs das server actions.
 *
 * Cada server action faz `safeParse` na entrada antes de qualquer chamada
 * externa (CRM Boldfy / ActiveCampaign). Se inválido, retorna erro genérico
 * (não vaza detalhes do schema pro client).
 *
 * Building blocks reusáveis ficam no topo; schemas compostos por action
 * ficam abaixo.
 */

import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Email válido, normalizado lowercase + trim. Max 254 (RFC 5321).
 *
 * Usa preprocess pra trim+lowercase ANTES da validação — assim aceita
 * inputs como "  USER@DOMAIN.COM  " que vêm de forms onde o caller esquece
 * de fazer .trim() antes de enviar.
 */
export const EmailSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.email({ message: 'Email inválido' }).max(254),
);

/**
 * Telefone BR — aceita formatos com/sem máscara, com/sem +55.
 * Aceita 10 (fixo) ou 11 (celular) dígitos depois de remover não-numéricos.
 * Normaliza pro formato cru (só dígitos com +55 prefix opcional).
 */
const PHONE_REGEX = /^\+?\d{10,15}$/;
export const PhoneSchema = z
  .string()
  .trim()
  .max(40)
  .transform((v) => v.replace(/[\s()\-.]/g, ''))
  .refine((v) => PHONE_REGEX.test(v), {
    message: 'Telefone inválido',
  });

/** Versão opcional do telefone — vazio ou válido. */
export const PhoneOptionalSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v.replace(/[\s()\-.]/g, '') : undefined))
  .refine((v) => !v || PHONE_REGEX.test(v), {
    message: 'Telefone inválido',
  });

/** Nome de pessoa — trim, 1–120 chars. */
export const NameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Nome obrigatório' })
  .max(120);

/** Nome de empresa — trim, 1–200 chars. */
export const CompanyNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Empresa obrigatória' })
  .max(200);

/** String opcional limitada (até `max` chars). Vazio = undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

/** Campos UTM — todos opcionais, max 200 cada. */
const UtmFieldsSchema = z.object({
  utm_source: optionalText(200),
  utm_medium: optionalText(200),
  utm_campaign: optionalText(200),
  utm_content: optionalText(200),
  utm_term: optionalText(200),
  /**
   * URL atual no momento do submit (window.location.pathname) — adapter
   * combina com `origem` (slot) pra montar sourcePage rico tipo
   * 'header:desktop em /solucoes/saas'. Antes só salvávamos o slot.
   */
  landing_pathname: optionalText(500),
  /**
   * document.referrer no momento do submit. Adapter usa pra inferir canal
   * quando utm_source não veio (LinkedIn orgânico, Google, etc.). Antes
   * caía sempre em 'unknown'.
   */
  referrer: optionalText(500),
  /**
   * Engajamento — opcionais, capturados via useEngagementMeta() no client.
   *
   *   consent_status: 'granted' | 'denied' | 'unset'  — escolha do banner LGPD
   *                                                    no momento exato do submit
   *   ga4_client_id : identificador opaco do cookie _ga (presente só se
   *                   consent=granted e adblocker não bloqueou). Permite
   *                   cruzar a pessoa com sessões GA4 via Analytics Data API
   *                   (aba "Engajamento" do perfil + sessões na timeline).
   */
  consent_status: z.enum(['granted', 'denied', 'unset']).optional(),
  ga4_client_id: optionalText(200),
});

/* -------------------------------------------------------------------------- */
/*  Schemas por server action                                                  */
/* -------------------------------------------------------------------------- */

export const BetaLeadSchema = z
  .object({
    nome: NameSchema,
    email: EmailSchema,
    telefone: PhoneSchema,
    cargo: z.string().trim().min(1).max(120),
    empresa: CompanyNameSchema,
    setor: z.string().trim().min(1).max(120),
    colaboradores: z.string().trim().min(1).max(60),
    objetivoPrincipal: z.string().trim().min(1).max(2000),
    comoConheceu: z.string().trim().min(1).max(200),
    observacoes: optionalText(2000),
    origem: optionalText(200),
  })
  .extend(UtmFieldsSchema.shape);

export const DemoLeadSchema = z
  .object({
    nome: NameSchema,
    email: EmailSchema,
    telefone: PhoneSchema,
    cargo: z.string().trim().min(1).max(120),
    empresa: CompanyNameSchema,
    funcionarios: z.string().trim().min(1).max(60),
    origem: optionalText(200),
  })
  .extend(UtmFieldsSchema.shape);

export const ProposalLeadSchema = z
  .object({
    nome: NameSchema,
    email: EmailSchema,
    empresa: CompanyNameSchema,
    cargo: z.string().trim().min(1).max(120),
    betaActive: z.boolean(),
    plataformaEnabled: z.boolean(),
    plataformaSeats: z.number().int().min(0).max(10000),
    plataformaEnterprise: z.boolean(),
    plataformaPriceFull: z.number().min(0).max(1_000_000),
    plataformaPriceBeta: z.number().min(0).max(1_000_000),
    designPlan: z.string().trim().max(60).nullable(),
    designPrice: z.number().min(0).max(1_000_000),
    fsTls: z.number().int().min(0).max(1000),
    fsFreq: z.number().int().min(0).max(1000),
    fsPrice: z.number().min(0).max(10_000_000),
    totalCurrent: z.number().min(0).max(10_000_000),
    totalFull: z.number().min(0).max(10_000_000),
    savings: z.number().min(0).max(10_000_000),
    origem: z.string().trim().max(200),
    teamItems: z
      .array(
        z.object({
          text: z.string().trim().max(500),
          dedicated: z.boolean(),
        }),
      )
      .max(50),
  })
  .extend(UtmFieldsSchema.shape);

const IntencaoUsoSchema = z.enum([
  'marca-empresa',
  'marca-clientes',
  'marca-pessoal',
]);

export const AlgoritmoLinkedinLeadSchema = z
  .object({
    nome: NameSchema,
    email: EmailSchema,
    intencaoUso: IntencaoUsoSchema,
    empresa: optionalText(200),
    origem: optionalText(200),
    newsletterOptIn: z.boolean().optional(),
  })
  .extend(UtmFieldsSchema.shape);

/**
 * Schema do form do Case Semrush ELG (LP /case-semrush).
 *
 * Mesma base do Algoritmo LinkedIn (nome+email+intencao+newsletter) MAIS três
 * campos extras de qualificação B2B (empresa, cargo, tamanho_empresa) que só
 * são exigidos quando intencaoUso='marca-empresa'. Pros outros casos (agência,
 * criador) o lead segue o fluxo enxuto do algoritmo-linkedin.
 *
 * Validação cruzada via superRefine: se a pessoa marca 'marca-empresa',
 * os 3 campos B2B passam a ser obrigatórios (mesma lógica do gate UI).
 */
const TamanhoEmpresaSchema = z.enum([
  'ate-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
]);

export const CaseSemrushLeadSchema = z
  .object({
    nome: NameSchema,
    email: EmailSchema,
    intencaoUso: IntencaoUsoSchema,
    // Campos B2B — opcionais no schema, validados em superRefine quando
    // intencaoUso='marca-empresa'. Mantemos opcionais aqui pro adapter
    // saber tratar null sem crash quando lead não é B2B.
    empresa: optionalText(200),
    cargo: optionalText(120),
    tamanhoEmpresa: TamanhoEmpresaSchema.optional(),
    origem: optionalText(200),
    newsletterOptIn: z.boolean().optional(),
  })
  .extend(UtmFieldsSchema.shape)
  .superRefine((data, ctx) => {
    if (data.intencaoUso === 'marca-empresa') {
      if (!data.empresa) {
        ctx.addIssue({
          code: 'custom',
          path: ['empresa'],
          message: 'Empresa obrigatória pra leads B2B',
        });
      }
      if (!data.cargo) {
        ctx.addIssue({
          code: 'custom',
          path: ['cargo'],
          message: 'Cargo obrigatório pra leads B2B',
        });
      }
      if (!data.tamanhoEmpresa) {
        ctx.addIssue({
          code: 'custom',
          path: ['tamanhoEmpresa'],
          message: 'Tamanho da empresa obrigatório pra leads B2B',
        });
      }
    }
  });

/* -------------------------------------------------------------------------- */
/*  Playbook de Employee-Led Growth (mai/2026)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Schema do quiz /ferramentas/playbook-employee-led-growth.
 *
 * 11 perguntas obrigatórias + 1 aberta opcional + 4 campos de identificação.
 * Sempre Líder B2B — o gate de elegibilidade (porteColaboradores ≥ 5) na 1ª
 * pergunta filtra autônomos antes do submit chegar aqui, então a validação
 * só rejeita inputs malformados (não filtra de novo).
 *
 * Enums em pares — seniority/area refletem os enums Postgres (job_seniority,
 * job_area) criados na migration 0004. Valores precisam bater exatamente.
 *
 * Honeypot: campo `website` deve vir VAZIO. Se preenchido = bot, server action
 * retorna success silenciosamente sem gravar.
 */
const JobSenioritySchema = z.enum([
  'analista', 'coordenador', 'gerente', 'diretor', 'c_level',
]);
const JobAreaSchema = z.enum([
  'marketing', 'growth', 'vendas', 'rh', 'employer_branding', 'comunicacao', 'outro',
]);
const VozAtualSchema = z.enum([
  'founder_solo', 'alguns_executivos', 'time_esparso', 'ninguem', 'programa_rodando',
]);
const TentativasSchema = z.enum([
  'nunca', 'morreu', 'baixa_adesao', 'maduro',
]);
const DorPrincipalSchema = z.enum([
  'company_page_morta',
  'cac_subindo',
  'concorrente_dominando',
  'vendedor_invisivel',
  'talento_saindo',
  'marca_uma_pessoa',
  'outra',
]);
/**
 * `ResultadoPrioritarioSchema` mantido como deprecated (compat — playbooks
 * antigos no banco têm esse campo). Wizard novo não pede mais.
 */
const ResultadoPrioritarioSchema = z.enum([
  'awareness', 'pipeline', 'reducao_paid', 'talento', 'autoridade', 'engajamento',
]);
const BudgetStatusSchema = z.enum([
  'aprovado', 'planejando', 'precisa_justificar', 'sem_budget',
]);
/**
 * P11.5 — gasto mensal em ads (jun/2026, opcional).
 *
 * Faixas que alimentam o gráfico "Ads vs ELG" no Bloco 2 do output. Midpoint
 * é calculado em lib/playbook/render.ts. Pergunta pode ser pulada → undefined.
 */
const GastoMensalAdsSchema = z.enum([
  'zero', 'ate_10k', '11_a_50k', '51_a_100k', '101_a_300k', 'acima_300k',
]);
/**
 * Sponsorship reformulado (mai/2026 — curadoria pós-teste).
 * Detecta oportunidade de Full Content (CaaS) sem desviar do foco SaaS.
 * Mantém suporte aos valores antigos pra retrocompat (playbooks no banco).
 */
const SponsorshipSchema = z.enum([
  // Valores novos (P11 reformulada)
  'sim_proprio',
  'sim_full_content',
  'nao_foco',
  // Valores antigos preservados pra retrocompat (playbooks pré-mai/2026)
  'sim_alguns_postam',
  'sim_com_ajuda',
  'talvez',
  'nao',
]);
/** `ColaboradoresPostandoSchema` mantido só pra compat. Wizard novo não pede mais. */
const ColaboradoresPostandoSchema = z.enum([
  'nenhum', '1_3', '4_10', 'mais_10', 'nao_sei',
]);

export const PlaybookEmployeeLedGrowthLeadSchema = z
  .object({
    // Identificação (fim do quiz)
    nome: NameSchema,
    email: EmailSchema,
    empresa: CompanyNameSchema,
    telefone: PhoneOptionalSchema,
    newsletterOptIn: z.boolean().optional(),
    lgpdConsent: z.boolean().refine((v) => v === true, {
      message: 'Consentimento LGPD obrigatório',
    }),

    /**
     * State of ELG — consent pra uso anonimizado das respostas no relatório
     * "Panorama Employee-Led Growth no Brasil". Default `true` (opt-out style):
     * a pessoa precisa DESmarcar pra não consentir. Diferente do `lgpdConsent`,
     * não é obrigatório — false é válido, só registra a escolha.
     *
     * Ver docs/SPEC-playbook-state-of-elg-consent.md §3.1.
     */
    stateElgConsent: z.boolean().default(true),

    /**
     * State of ELG — opt-in pra receber o relatório em primeira mão quando
     * ele for publicado. Default `false`: só entra na lista AC
     * `[Lista] Report: Panorama ELG no Brasil` se a pessoa marcar. Só faz
     * sentido se `stateElgConsent === true`; a UI bloqueia o checkbox quando
     * o toggle de consent tá off.
     *
     * Ver docs/SPEC-playbook-state-of-elg-consent.md §3.1.
     */
    stateElgReportSubscribe: z.boolean().default(false),

    // P1 — porte (gate validado client-side; server aceita ≥1 só pra defesa
    // em profundidade; gate real é UI). Aceita 1..100000.
    porteColaboradores: z.number().int().min(1).max(100_000),

    /**
     * Confirmação de compromisso com 5 colaboradores ativos (jun/2026).
     *
     * Pergunta intermediária entre P1 (porte) e P2 (cargo) que só aparece pra
     * empresas com porte entre 5 e 20 inclusive. Respostas "não" caem em
     * `not-eligible` e nunca chegam aqui — server só vê `true`/`undefined`.
     *
     * Opcional pra retrocompat com playbooks antigos no banco e pra os casos
     * em que a pergunta nem foi feita (porte > 20).
     *
     * No CRM vai como custom field PORTE_COMPROMISSO_5_ATIVOS pra time de
     * vendas filtrar leads pequenos que toparam o compromisso vs leads
     * grandes que passaram direto.
     */
    porteCompromisso5Ativos: z.boolean().optional(),

    // P2 + P3
    cargoSenioridade: JobSenioritySchema,
    cargoArea: JobAreaSchema,

    // P4 — setor (string controlada pela UI dropdown, validamos só limite)
    setor: z.string().trim().min(1).max(120),

    // P5 — REMOVIDA na curadoria (mai/2026). Agora opcional pra retrocompat
    // (playbooks antigos no banco ainda têm essa key no quiz_data).
    colaboradoresPostando: ColaboradoresPostandoSchema.optional(),

    // P6 + P7
    vozAtual: VozAtualSchema,
    tentativasAnteriores: TentativasSchema,

    // P8 + P9 + P10 + P11
    // P8 vira multi-select de até 2 dores (mai/2026 — copy editorial decidiu
    // expandir o quiz pra reconhecer combinações comuns tipo CAC + Company
    // Page morta). Primeiro item da array define template-key no render.
    doresPrincipais: z.array(DorPrincipalSchema).min(1).max(2),
    // P9 — REMOVIDA na curadoria. Resultado é derivado das dores agora.
    // Opcional pra retrocompat de playbooks antigos.
    resultadosPrioritarios: z.array(ResultadoPrioritarioSchema).min(1).max(2).optional(),
    budgetStatus: BudgetStatusSchema,
    sponsorshipLideranca: SponsorshipSchema,

    /**
     * P11.5 — gasto mensal em ads (jun/2026, opcional).
     *
     * Alimenta o gráfico "Ads vs ELG" no Bloco 2 do output. Quando undefined,
     * o gráfico cai no modo conceitual (sem números personalizados). Vai pro
     * AC como custom field `Gasto Mensal Ads` (label legível pra vendas).
     */
    gastoMensalAds: GastoMensalAdsSchema.optional(),

    // Aberta opcional
    observacoesLivres: optionalText(500),

    // Honeypot — humanos não preenchem
    website: z.string().max(0).optional().or(z.literal('')),

    // Tracking
    origem: optionalText(200),
  })
  .extend(UtmFieldsSchema.shape);

/* -------------------------------------------------------------------------- */
/*  Helper genérico                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Resultado discriminado de validação. TS narra automaticamente após
 * checar `.ok` (diferente do tuple, que não funciona pra narrowing).
 */
type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Valida input com schema zod. Retorna `{ ok: true, data }` se válido,
 * ou `{ ok: false, error }` com primeira issue formatada (sem vazar
 * árvore inteira pro client).
 *
 * Uso:
 *   const parsed = parseInput(BetaLeadSchema, rawInput);
 *   if (!parsed.ok) return { success: false, error: 'Dados inválidos.' };
 *   const input = parsed.data; // T narrowed
 */
export function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
): ParseResult<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path.join('.') || 'campo';
    const msg = firstIssue?.message || 'Dados inválidos';
    return { ok: false, error: `${path}: ${msg}` };
  }
  return { ok: true, data: result.data };
}
