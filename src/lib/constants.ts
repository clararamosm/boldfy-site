/**
 * Constantes globais do site Boldfy.
 *
 * Manter os valores aqui centralizados garante consistência entre
 * simulador de ROI da home, simulador da /beta-test, página /precos,
 * /para/marketing e qualquer outra LP/seção que cite preços ou CPM.
 *
 * ⚠️ Esses valores espelham as constantes equivalentes na plataforma
 * (boldfy-platform/src/lib/constants.ts → LINKEDIN_CPM_BRL = 300).
 * Se mudar aqui, mudar lá também.
 */

// ─── CPM / Earned Media ───────────────────────────────────────

/** CPM benchmark do LinkedIn Ads em R$ por mil impressões */
export const LINKEDIN_CPM_BRL = 300;

/** CPM convertido para custo por impressão única (R$ 0,30) */
export const LINKEDIN_CPM_PER_IMPRESSION = LINKEDIN_CPM_BRL / 1000;

/** Faixa de CPM de Ads tradicionais para comparação no simulador (R$/impressão) */
export const ADS_CPM_LOW = 0.20;
export const ADS_CPM_HIGH = 0.50;

/**
 * Calcula o valor de mídia equivalente em reais a partir do total de
 * impressões. Espelha a fórmula usada na plataforma.
 *
 * @example
 *   calcMediaValue(50000) // 15000 (R$ 15 mil)
 */
export function calcMediaValue(impressions: number): number {
  return impressions * LINKEDIN_CPM_PER_IMPRESSION;
}

// ─── Pricing Boldfy ───────────────────────────────────────────

/**
 * Quando true, simulador de ROI e tiles de pricing exibem o preço
 * de beta (-30%) ao lado do preço cheio. Quando false (pós-beta),
 * a página inteira passa a mostrar só o preço cheio.
 *
 * Mexer só nessa flag pra encerrar a oferta de beta no fim do programa.
 */
export const BETA_PRICING_ENABLED = true;

/** Desconto aplicado durante o programa beta (30%) */
export const BETA_DISCOUNT = 0.30;

/**
 * Tiers de preço cheio Boldfy por faixa de seats (R$/seat/mês).
 *
 * ⚠️ Esse array alimenta DIRETAMENTE os tiles públicos da /beta-test
 * (page.tsx mapeia PRICING_TIERS → 4 tiles + "70+ enterprise"). NÃO
 * adicionar faixas grandes aqui, senão elas vazam pro site público. As
 * faixas 71-100 e 101-200 vivem nas constantes/funções abaixo e só são
 * alcançadas no simulador do playbook (slider vai até 200).
 */
export const PRICING_TIERS = [
  { maxSeats: 10, fullPrice: 499 },
  { maxSeats: 20, fullPrice: 449 },
  { maxSeats: 40, fullPrice: 399 },
  { maxSeats: 70, fullPrice: 349 },
] as const;

/**
 * Faixas grandes — usadas só onde o slider passa de 70 (simulador do
 * playbook + gráfico Ads vs ELG). Não aparecem nos tiles públicos.
 *
 * - 71-100 seats  → R$ 300/seat cheio (valor fechado).
 * - 101-200 seats → faixa enterprise R$ 150-200/seat cheio (range; preço
 *   final cai conforme o volume de pessoas no programa, sob consulta).
 *
 * Teto duro de 200 seats no slider: acima disso a lógica de feed não
 * comporta (mais gente no programa = cada um posta/engaja menos).
 */
export const PRICING_TIER_71_100_FULL = 300;
export const ENTERPRISE_SEATS_MIN = 101;
export const ENTERPRISE_FULL_RANGE = { min: 150, max: 200 } as const;
export const MAX_SEATS_PLAYBOOK = 200;

/**
 * Retorna o preço cheio por seat (valor único) baseado no número de
 * colaboradores. Para a faixa enterprise (101+), retorna o TETO do range
 * (R$ 200) como valor conservador para consumidores que precisam de número
 * único (ex: gráfico Ads vs ELG). O display em range fica em getFullPriceRange.
 */
export function getFullPricePerSeat(seats: number): number {
  for (const tier of PRICING_TIERS) {
    if (seats <= tier.maxSeats) return tier.fullPrice;
  }
  if (seats <= 100) return PRICING_TIER_71_100_FULL;
  // 101-200 → enterprise: teto do range como valor único conservador.
  return ENTERPRISE_FULL_RANGE.max;
}

/**
 * Retorna o preço cheio por seat como FAIXA {min, max}. Para ≤100 seats
 * min === max (valor único do tier). Para 101+ retorna o range enterprise
 * (R$ 150-200). Usado pelo simulador do playbook pra exibir "R$ X a R$ Y".
 */
export function getFullPriceRange(seats: number): { min: number; max: number } {
  if (seats < ENTERPRISE_SEATS_MIN) {
    const p = getFullPricePerSeat(seats);
    return { min: p, max: p };
  }
  return { min: ENTERPRISE_FULL_RANGE.min, max: ENTERPRISE_FULL_RANGE.max };
}

/**
 * Retorna o preço beta por seat (preço cheio com 30% de desconto, arredondado).
 * Quando BETA_PRICING_ENABLED = false, retorna o próprio preço cheio.
 */
export function getBetaPricePerSeat(seats: number): number {
  const full = getFullPricePerSeat(seats);
  if (!BETA_PRICING_ENABLED) return full;
  return Math.round(full * (1 - BETA_DISCOUNT));
}

/**
 * Versão em faixa do preço beta. Aplica o desconto beta nas duas pontas do
 * range cheio. Com BETA_PRICING_ENABLED = false retorna o range cheio.
 */
export function getBetaPriceRange(seats: number): { min: number; max: number } {
  const full = getFullPriceRange(seats);
  if (!BETA_PRICING_ENABLED) return full;
  return {
    min: Math.round(full.min * (1 - BETA_DISCOUNT)),
    max: Math.round(full.max * (1 - BETA_DISCOUNT)),
  };
}

/** True quando o nº de seats cai na faixa enterprise (range de preço). */
export function isEnterpriseSeats(seats: number): boolean {
  return seats >= ENTERPRISE_SEATS_MIN;
}

// ─── Beta program ─────────────────────────────────────────────

/** Data limite (DD/MM) da oferta atual de beta com 1º mês grátis */
export const BETA_OFFER_DEADLINE = '15/05';

/** Duração do contrato beta em meses */
export const BETA_CONTRACT_MONTHS = 6;

/** Quantos meses são gratuitos no contrato beta */
export const BETA_FREE_MONTHS = 1;
