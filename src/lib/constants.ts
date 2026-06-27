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
 * Faixa 71-100 — usada só onde o slider passa de 70 (simulador do playbook +
 * gráfico Ads vs TLG). NÃO aparece nos tiles públicos.
 *
 * - 71-100 seats → R$ 300/seat cheio (valor fechado). A 100 seats a empresa
 *   paga no máximo R$ 30k/mês cheio (R$ 21k beta), o que ainda fecha conta.
 *
 * Teto do programa = 100 ativos (MAX_SEATS_PROGRAMA). Acima disso vira
 * enterprise sob consulta/negociação — fora do simulador. Dois motivos:
 *   1. Pricing: de 101 pra cima o preço/seat teria que cair muito (degrau
 *      esquisito de R$ 30k → ~R$ 15k), então a gente negocia caso a caso.
 *   2. Feed: programa com >100 pessoas da mesma empresa floda o feed do
 *      LinkedIn — mais gente = cada um posta/engaja menos.
 */
export const PRICING_TIER_71_100_FULL = 300;
export const MAX_SEATS_PROGRAMA = 100;

/**
 * Retorna o preço cheio por seat baseado no número de colaboradores.
 * Faixas: ≤70 pelos tiers públicos; 71-100 = R$ 300. O programa não passa de
 * 100 ativos (acima é enterprise sob consulta, fora do cálculo), mas a função
 * retorna R$ 300 defensivamente pra qualquer valor >70.
 */
export function getFullPricePerSeat(seats: number): number {
  for (const tier of PRICING_TIERS) {
    if (seats <= tier.maxSeats) return tier.fullPrice;
  }
  // 71+ → faixa grande (programa fecha em 100; acima é enterprise sob consulta).
  return PRICING_TIER_71_100_FULL;
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
