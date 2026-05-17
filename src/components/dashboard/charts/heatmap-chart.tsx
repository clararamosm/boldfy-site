/**
 * <HeatmapChart> — matriz 7×24 (dia × hora).
 */

'use client';

import { useState } from 'react';
import { DAYS_PT } from './_shared';

export function HeatmapChart({ matrix }: { matrix: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(...matrix.flat(), 1);
  const cellW = 26;
  const cellH = 22;
  const padL = 36;
  const padT = 18;
  const W = padL + 24 * cellW + 4;
  const H = padT + 7 * cellH + 16;

  return (
    <div className="dash-chart">
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMin meet" style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }}>
          {/* Hour labels (eixo X) */}
          {Array.from({ length: 24 }).map((_, h) => h % 3 === 0 ? (
            <text key={h} x={padL + h * cellW + cellW / 2} y={padT - 4} fontSize={9} fill="#9D85B3" textAnchor="middle" fontFamily="system-ui">{h}h</text>
          ) : null)}
          {/* Day labels + cells */}
          {DAYS_PT.map((day, d) => (
            <g key={day}>
              <text x={padL - 6} y={padT + d * cellH + cellH / 2 + 3} fontSize={10} fill="#9D85B3" textAnchor="end" fontFamily="system-ui">{day}</text>
              {Array.from({ length: 24 }).map((_, h) => {
                const v = matrix[d]?.[h] ?? 0;
                const intensity = v / max;
                const fill = v === 0 ? '#F7EEFC' : `rgba(205, 80, 241, ${0.15 + intensity * 0.85})`;
                return (
                  <rect
                    key={`${d}-${h}`}
                    x={padL + h * cellW + 1}
                    y={padT + d * cellH + 1}
                    width={cellW - 2}
                    height={cellH - 2}
                    rx={3}
                    fill={fill}
                    stroke={hover?.d === d && hover?.h === h ? '#5E2A67' : 'transparent'}
                    strokeWidth={1.5}
                    onMouseEnter={() => setHover({ d, h })}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        {hover && (
          <div className="dash-chart-tooltip" style={{ left: `${((padL + hover.h * cellW + cellW / 2) / W) * 100}%`, top: padT + hover.d * cellH - 40, transform: hover.h > 18 ? 'translate(-100%, 0)' : 'translate(8px, 0)' }}>
            <div className="dash-chart-tooltip-date">{DAYS_PT[hover.d]} · {hover.h}h</div>
            <div className="dash-chart-tooltip-row">
              <span className="dash-chart-dot" style={{ background: '#CD50F1' }} />
              <span>conversões</span>
              <strong>{matrix[hover.d]?.[hover.h] ?? 0}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
