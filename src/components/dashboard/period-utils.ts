/**
 * Helpers PUROS de período (server-safe).
 *
 * IMPORTANTE: não tem 'use client'. O parsePeriod é chamado de Server Components
 * (aquisicao/page.tsx, conversao/page.tsx). Se ficasse no mesmo arquivo do
 * <PeriodFilter> ('use client'), Next 16 trataria a função como client-only e
 * o server render quebraria com erro genérico.
 */

export type Period = '7' | '28' | '90' | '180';

export function parsePeriod(raw: string | undefined): number {
  const n = parseInt(raw ?? '28', 10);
  return [7, 28, 90, 180].includes(n) ? n : 28;
}

export const PERIODS = [
  { value: '7', label: '7 dias' },
  { value: '28', label: '28 dias' },
  { value: '90', label: '3 meses' },
  { value: '180', label: '6 meses' },
] as const;
