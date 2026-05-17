/**
 * <Sparkline> — mini-linha sem eixos (pra bento KPI cards).
 */

'use client';

export function Sparkline({
  data,
  width = 100,
  height = 28,
  color = '#CD50F1',
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (data.length === 0) return <div style={{ width: '100%', height }} />;
  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(' ');
  const path = `M${points.replaceAll(' ', ' L')}`;
  const areaPath = `${path} L${width.toFixed(1)},${height} L0,${height} Z`;

  // viewBox + preserveAspectRatio="none" garante que o sparkline preenche a largura
  // do container (parent é flex/grid item de largura variável).
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height }}
    >
      {fill && <path d={areaPath} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
