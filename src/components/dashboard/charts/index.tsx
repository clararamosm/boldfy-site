/**
 * Componentes de chart SVG custom pro dashboard.
 *
 * Tudo SVG puro — sem Recharts/Chart.js — porque:
 *  - Identidade visual Boldfy total controle
 *  - Bundle leve (sem 80kb gz de lib)
 *  - Tooltip simples via state local
 *  - Responsive via viewBox + preserveAspectRatio
 *
 * Convenções:
 *  - Cores Boldfy: roxo principal #CD50F1, azul #3B82F6, verde #10B981, amber #F59E0B
 *  - Tooltip: <div absoluto> sobre o SVG, posicionado pelo state
 *  - Hit areas: <rect transparent> com onMouseEnter/Leave
 *
 * Este barrel re-exporta cada componente individual + as constantes
 * compartilhadas. Imports continuam funcionando como
 * `from '@/components/dashboard/charts'`.
 */

export { BOLDFY_PALETTE, BOLDFY_PURPLES } from './_shared';
export { Sparkline } from './sparkline';
export { MultiLineChart } from './multi-line-chart';
export { StackedAreaChart } from './stacked-area-chart';
export { DonutChart } from './donut-chart';
export { HeatmapChart } from './heatmap-chart';
export { FunnelStages } from './funnel-stages';
export { SankeyFunnel } from './sankey-funnel';
export { SourcedFunnel } from './sourced-funnel';
export { ScatterChart } from './scatter-chart';
export { BulletChart } from './bullet-chart';
export { TimelineMarkers } from './timeline-markers';
// Removidos junto com /funil: SankeyFlow, CohortMatrix, BarCompareChart, BoxPlotByChannel.
