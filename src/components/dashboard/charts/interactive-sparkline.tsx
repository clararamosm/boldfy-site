/**
 * <InteractiveSparkline> — sparkline com hover dia-a-dia.
 *
 * Diferente do Sparkline server-side (apenas valores numéricos), este recebe
 * pontos `{date, value}` e renderiza tooltip ao passar o mouse mostrando
 * data + valor. Usado nos KPI cards da Visão Geral (Visitas / Forms / Reuniões 7d).
 *
 * Implementação:
 *   - SVG com viewBox 100×30, preserveAspectRatio="none" (chart pequeno sem
 *     texto interno — não tem distorção a se preocupar).
 *   - Hit-area `<rect>` invisível dividida em bandas verticais (uma por ponto).
 *   - Tooltip absoluto posicionado pelo state.
 *
 * Tooltip usa formatDateBR pra mostrar data legível em horário de SP.
 */

'use client';

import { useState } from 'react';

export type SparkPoint = { date: string; value: number };

export function InteractiveSparkline({
  data,
  color = '#CD50F1',
  fill = true,
  height = 32,
}: {
  data: SparkPoint[];
  color?: string;
  fill?: boolean;
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return <div style={{ width: '100%', height }} />;
  }

  const W = 100;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? W / (data.length - 1) : 0;
  const points = data
    .map((d, i) => `${(i * stepX).toFixed(2)},${(height - (d.value / max) * height).toFixed(2)}`)
    .join(' ');
  const linePath = `M${points.replaceAll(' ', ' L')}`;
  const areaPath = `${linePath} L${W.toFixed(2)},${height} L0,${height} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height }}
      >
        {fill && <path d={areaPath} fill={color} opacity={0.12} />}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
        {hoverIdx !== null ? (
          <circle
            cx={hoverIdx * stepX}
            cy={height - (data[hoverIdx].value / max) * height}
            r={2.5}
            fill={color}
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        ) : null}
        {data.map((d, i) => {
          const bandW = stepX || W;
          return (
            <rect
              key={d.date}
              x={i * stepX - bandW / 2}
              y={0}
              width={bandW}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'crosshair' }}
            />
          );
        })}
      </svg>
      {hoverIdx !== null ? (
        <div
          style={{
            position: 'absolute',
            // Posiciona tooltip relativo ao % do hover no eixo X.
            // Inverte direção quando passa do meio pra não cortar na borda.
            left: hoverIdx > data.length / 2 ? 'auto' : `${(hoverIdx / Math.max(data.length - 1, 1)) * 100}%`,
            right: hoverIdx > data.length / 2 ? `${(1 - hoverIdx / Math.max(data.length - 1, 1)) * 100}%` : 'auto',
            bottom: '100%',
            marginBottom: 4,
            background: '#FFFFFF',
            border: '1px solid #E4D8ED',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: '#5E2A67',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(94, 42, 103, 0.12)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ color: '#9D85B3', fontSize: 10 }}>{formatDateShort(data[hoverIdx].date)}</div>
          <div style={{ fontWeight: 700 }}>{data[hoverIdx].value.toLocaleString('pt-BR')}</div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * "26 mai" — formato curto em SP. Inline aqui pra evitar dep cross-component;
 * crm-format.formatDateBR é mais verboso ("26 de maio de 2026") e não cabe
 * no tooltip pequeno.
 */
function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  }).replace('.', '');
}
