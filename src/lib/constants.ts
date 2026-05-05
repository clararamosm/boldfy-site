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

/** Tiers de preço cheio Boldfy por faixa de seats (R$/seat/mês) */
export const PRICING_TIERS = [
  { maxSeats: 10, fullPrice: 499 },
  { maxSeats: 20, fullPrice: 449 },
  { maxSeats: 40, fullPrice: 399 },
  { maxSeats: 70, fullPrice: 349 },
] as const;

/**
 * Retorna o preço cheio por seat baseado no número de colaboradores.
 * Faixas acima de 70 caem em enterprise (preço sob consulta).
 */
export function getFullPricePerSeat(seats: number): number {
  for (const tier of PRICING_TIERS) {
    if (seats <= tier.maxSeats) return tier.fullPrice;
  }
  // 70+ → mantém o último tier como base; UI deve tratar como enterprise
  return PRICING_TIERS[PRICING_TIERS.length - 1].fullPrice;
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

// ─── Beta program ─────────────────────────────────────────────

/** Data limite (DD/MM) da oferta atual de beta com 1º mês grátis */
export const BETA_OFFER_DEADLINE = '15/05';

/** Duração do contrato beta em meses */
export const BETA_CONTRACT_MONTHS = 6;

/** Quantos meses são gratuitos no contrato beta */
export const BETA_FREE_MONTHS = 1;
