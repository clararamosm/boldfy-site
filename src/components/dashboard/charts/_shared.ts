/**
 * Helpers compartilhados entre os componentes de chart.
 *
 * Convenções:
 *  - Cores Boldfy: roxo principal #CD50F1, azul #3B82F6, verde #10B981, amber #F59E0B
 *  - Tooltip: <div absoluto> sobre o SVG, posicionado pelo state
 *  - Hit areas: <rect transparent> com onMouseEnter/Leave
 */

export const BOLDFY_PALETTE = [
  '#CD50F1', // roxo Boldfy
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // amber
  '#F97316', // orange
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#06B6D4', // cyan
];

/**
 * Variações tonais de roxo — pra stacked area e demais charts que ficam mais
 * coesos quando todas séries são da mesma família de cor.
 */
export const BOLDFY_PURPLES = [
  '#5E2A67', // roxo escuro Boldfy
  '#7E3FA6',
  '#9D5FCC',
  '#B57AE0',
  '#CD50F1', // roxo principal
  '#E875FF',
  '#F0A8FF',
  '#F7D0FF',
];

export function formatBR(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
