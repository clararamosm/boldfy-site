/**
 * Schemas zod para validação de inputs das server actions.
 *
 * Cada server action faz `safeParse` na entrada antes de qualquer chamada
 * externa (Notion / ActiveCampaign). Se inválido, retorna erro genérico
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

export const ReportLeadSchema = z
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
 * Mesma base do Report (nome+email+intencao+newsletter) MAIS três campos
 * extras de qualificação B2B (empresa, cargo, tamanho_empresa) que só são
 * exigidos quando intencaoUso='marca-empresa'. Pros outros casos (agência,
 * criador) o lead segue o fluxo enxuto do report.
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

export const CaseLeadSchema = z
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
