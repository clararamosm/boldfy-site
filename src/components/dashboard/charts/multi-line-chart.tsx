/**
 * <MultiLineChart> — 3 séries (visitas / forms / reuniões).
 */

'use client';

import { useState } from 'react';
import { formatBR, formatDateLong, formatDateShort } from './_shared';

type MultiSeries = { key: string; label: string; color: string; data: number[] };

export function MultiLineChart({
  dates,
  series,
  height = 240,
}: {
  dates: string[];
  series: MultiSeries[];
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 800;
  const PAD = { top: 18, right: 12, bottom: 26, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const maxValue = Math.max(...series.flatMap((s) => s.data), 1);
  const stepX = dates.length > 1 ? innerW / (dates.length - 1) : 0;

  const paths = series.map((s) =>
    s.data
      .map((v, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + innerH - (v / maxValue) * innerH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' '),
  );

  const yTicks = [0, Math.ceil(maxValue / 2), maxValue];
  const xTickStep = Math.max(1, Math.floor(dates.length / 6));

  if (dates.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  }

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
        {/* preserveAspectRatio="xMidYMid meet" mantém proporção (texto não
            distorce). Antes "none" esticava o viewBox horizontalmente e os
            <text> ficavam achatados. Pode aparecer pequena margem lateral
            em containers muito estreitos — preferível a texto distorcido. */}
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height, display: 'block' }}>
          {yTicks.map((t, i) => {
            const y = PAD.top + innerH - (t / maxValue) * innerH;
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#F0E6F7" strokeWidth={1} />
                <text x={PAD.left - 4} y={y + 3} fontSize={10} fill="#9D85B3" textAnchor="end" fontFamily="system-ui">{formatBR(t)}</text>
              </g>
            );
          })}
          {dates.map((d, i) => i % xTickStep === 0 || i === dates.length - 1 ? (
            <text key={d} x={PAD.left + i * stepX} y={height - 6} fontSize={10} fill="#9D85B3" textAnchor="middle" fontFamily="system-ui">{formatDateShort(d)}</text>
          ) : null)}
          {series.map((s, si) => (
            <path key={s.key} d={paths[si]} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hoverIdx !== null && (
            <g>
              <line x1={PAD.left + hoverIdx * stepX} y1={PAD.top} x2={PAD.left + hoverIdx * stepX} y2={PAD.top + innerH} stroke="#CD50F1" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
              {series.map((s) => (
                <circle key={s.key} cx={PAD.left + hoverIdx * stepX} cy={PAD.top + innerH - (s.data[hoverIdx] / maxValue) * innerH} r={4} fill={s.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </g>
          )}
          {dates.map((d, i) => {
            const bandW = stepX || innerW;
            return (
              <rect
                key={`hit-${d}`}
                x={PAD.left + i * stepX - bandW / 2}
                y={PAD.top}
                width={bandW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'crosshair' }}
              />
            );
          })}
        </svg>
        {hoverIdx !== null && (
          <div className="dash-chart-tooltip" style={{ left: `${((PAD.left + hoverIdx * stepX) / W) * 100}%`, transform: hoverIdx > dates.length / 2 ? 'translate(-105%, 0)' : 'translate(12px, 0)' }}>
            <div className="dash-chart-tooltip-date">{formatDateLong(dates[hoverIdx])}</div>
            {series.map((s) => (
              <div key={s.key} className="dash-chart-tooltip-row">
                <span className="dash-chart-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
                <strong>{formatBR(s.data[hoverIdx])}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
