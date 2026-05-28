/**
 * <StackedBarChart> — N canais empilhados em barras diárias.
 *
 * Substitui o StackedAreaChart pra visualização de "visitas por canal".
 * Mai/2026 (Clara): a versão area-chart confundia leitura quando um canal
 * domina o tráfego e os outros viram fatias finas no topo. Barras
 * empilhadas por dia mostram a contribuição mais clara, e o tooltip por
 * dia fica mais previsível.
 *
 * Cada coluna do eixo X é UM dia. Cada cor é um canal. Total da coluna =
 * sessões do dia.
 */

'use client';

import { useState } from 'react';
import { formatBR, formatDateLong, formatDateShort } from './_shared';

export function StackedBarChart({
  dates,
  series,
  height = 240,
}: {
  dates: string[];
  series: { key: string; label: string; color: string; data: number[] }[];
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 800;
  const PAD = { top: 18, right: 16, bottom: 26, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  if (dates.length === 0 || series.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
        Sem dados.
      </div>
    );
  }

  // Totais por dia (pra max do eixo Y e tooltip)
  const totals = dates.map((_, i) => series.reduce((a, s) => a + (s.data[i] ?? 0), 0));
  const maxTotal = Math.max(...totals, 1);

  // Largura de cada barra: usa 70% do step pra ter respiro entre dias
  const stepX = innerW / dates.length;
  const barW = stepX * 0.7;
  const barOffset = (stepX - barW) / 2;

  // Y-ticks arredondados
  const yTicks = (() => {
    const step = Math.ceil(maxTotal / 4);
    return [0, step, step * 2, step * 3, step * 4].filter((v) => v <= maxTotal * 1.1);
  })();
  const xTickStep = Math.max(1, Math.floor(dates.length / 6));

  return (
    <div className="dash-chart">
      <div className="dash-chart-legend">
        {series.map((s) => (
          <div key={s.key} className="dash-chart-legend-item">
            <span className="dash-chart-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <div className="dash-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height, display: 'block' }}
        >
          {/* Y-grid */}
          {yTicks.map((t, i) => {
            const y = PAD.top + innerH - (t / maxTotal) * innerH;
            return (
              <g key={`gy-${i}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#F0E6F7" strokeWidth={1} />
                <text x={PAD.left - 4} y={y + 3} fontSize={10} fill="#9D85B3" textAnchor="end" fontFamily="system-ui">
                  {formatBR(t)}
                </text>
              </g>
            );
          })}

          {/* X-ticks (datas) */}
          {dates.map((d, i) => (i % xTickStep === 0 || i === dates.length - 1) ? (
            <text
              key={`x-${d}`}
              x={PAD.left + barOffset + i * stepX + barW / 2}
              y={height - 6}
              fontSize={10}
              fill="#9D85B3"
              textAnchor="middle"
              fontFamily="system-ui"
            >
              {formatDateShort(d)}
            </text>
          ) : null)}

          {/* Barras empilhadas por dia */}
          {dates.map((d, di) => {
            let yCursor = PAD.top + innerH; // começa do chão
            const x = PAD.left + barOffset + di * stepX;
            return (
              <g key={`bar-${d}`} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.45} style={{ transition: 'opacity 0.15s' }}>
                {series.map((s, si) => {
                  const v = s.data[di] ?? 0;
                  if (v <= 0) return null;
                  const h = (v / maxTotal) * innerH;
                  yCursor -= h;
                  // Bordinha branca pra separar segmentos quando colados
                  return (
                    <rect
                      key={`seg-${s.key}`}
                      x={x}
                      y={yCursor}
                      width={barW}
                      height={h}
                      fill={s.color}
                      stroke="#FFFFFF"
                      strokeWidth={si === 0 ? 0 : 0.8}
                      rx={si === series.length - 1 ? 2 : 0}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Hover hit-areas (uma faixa por dia, full height pra capturar
              hover mesmo em colunas vazias/baixinhas) */}
          {dates.map((d, i) => (
            <rect
              key={`hit-${d}`}
              x={PAD.left + i * stepX}
              y={PAD.top}
              width={stepX}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'crosshair' }}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoverIdx !== null && (
          <div
            className="dash-chart-tooltip"
            style={{
              left: `${((PAD.left + barOffset + hoverIdx * stepX + barW / 2) / W) * 100}%`,
              transform: hoverIdx > dates.length / 2 ? 'translate(-105%, 0)' : 'translate(12px, 0)',
            }}
          >
            <div className="dash-chart-tooltip-date">{formatDateLong(dates[hoverIdx])}</div>
            {series.map((s) => {
              const v = s.data[hoverIdx] ?? 0;
              if (v === 0) return null;
              return (
                <div key={s.key} className="dash-chart-tooltip-row">
                  <span className="dash-chart-dot" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <strong>{formatBR(v)}</strong>
                </div>
              );
            })}
            <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid #F0E6F7', fontSize: 11, color: '#9D85B3' }}>
              Total: <strong>{formatBR(totals[hoverIdx])}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
