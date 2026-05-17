/**
 * <StackedAreaChart> — N canais empilhados.
 */

'use client';

import { useState } from 'react';
import { formatBR, formatDateLong, formatDateShort } from './_shared';

export function StackedAreaChart({
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
  const PAD = { top: 18, right: 12, bottom: 26, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  if (dates.length === 0 || series.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  }

  // Calcula totais por dia pra normalizar (e descobrir max stack)
  const totals = dates.map((_, i) => series.reduce((a, s) => a + (s.data[i] ?? 0), 0));
  const maxTotal = Math.max(...totals, 1);
  const stepX = dates.length > 1 ? innerW / (dates.length - 1) : 0;

  // Build cumulative paths (bottom→top)
  const cumulative: number[][] = dates.map(() => []);
  series.forEach((s, si) => {
    dates.forEach((_, di) => {
      const prev = si === 0 ? 0 : cumulative[di][si - 1];
      cumulative[di][si] = prev + (s.data[di] ?? 0);
    });
  });

  const areaPaths = series.map((s, si) => {
    const top = dates.map((_, di) => {
      const x = PAD.left + di * stepX;
      const y = PAD.top + innerH - (cumulative[di][si] / maxTotal) * innerH;
      return `${di === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const bottom = dates.map((_, di) => {
      const x = PAD.left + (dates.length - 1 - di) * stepX;
      const prev = si === 0 ? 0 : cumulative[dates.length - 1 - di][si - 1];
      const y = PAD.top + innerH - (prev / maxTotal) * innerH;
      return `L${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `${top} ${bottom} Z`;
  });

  const yTicks = [0, Math.ceil(maxTotal / 2), maxTotal];
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
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
          {yTicks.map((t, i) => {
            const y = PAD.top + innerH - (t / maxTotal) * innerH;
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
          {areaPaths.map((p, i) => (
            <path key={series[i].key} d={p} fill={series[i].color} opacity={0.85} stroke="#FFFFFF" strokeWidth={0.8} />
          ))}
          {hoverIdx !== null && (
            <line x1={PAD.left + hoverIdx * stepX} y1={PAD.top} x2={PAD.left + hoverIdx * stepX} y2={PAD.top + innerH} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.85} />
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
                <strong>{formatBR(s.data[hoverIdx] ?? 0)}</strong>
              </div>
            ))}
            <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid #F0E6F7', fontSize: 11, color: '#9D85B3' }}>
              Total: <strong>{formatBR(totals[hoverIdx])}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
