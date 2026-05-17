/**
 * <TimelineMarkers> — linha (área) com marcadores verticais (eventos).
 */

'use client';

import { useState } from 'react';
import { formatBR, formatDateLong } from './_shared';

export function TimelineMarkers({
  dates,
  values,
  markers,
  label = 'Cliques',
  color = '#CD50F1',
  height = 200,
}: {
  dates: string[];
  values: number[];
  markers: { date: string; label: string }[];
  label?: string;
  color?: string;
  height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverMarker, setHoverMarker] = useState<number | null>(null);
  if (dates.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;

  const W = 800;
  const PAD = { top: 18, right: 12, bottom: 26, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const max = Math.max(...values, 1);
  const stepX = dates.length > 1 ? innerW / (dates.length - 1) : 0;

  const points = values.map((v, i) => `${(PAD.left + i * stepX).toFixed(1)},${(PAD.top + innerH - (v / max) * innerH).toFixed(1)}`).join(' ');
  const line = `M${points.replaceAll(' ', ' L')}`;
  const area = `${line} L${(PAD.left + innerW).toFixed(1)},${PAD.top + innerH} L${PAD.left.toFixed(1)},${PAD.top + innerH} Z`;

  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  return (
    <div className="dash-chart">
      <div className="dash-chart-legend">
        <div className="dash-chart-legend-item"><span className="dash-chart-dot" style={{ background: color }} />{label}</div>
        <div className="dash-chart-legend-item"><span style={{ width: 2, height: 12, background: '#EE5A52', display: 'inline-block' }} />Publicação</div>
      </div>
      <div className="dash-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
          <path d={area} fill={color} opacity={0.18} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          {markers.map((m, mi) => {
            const idx = dateIdx.get(m.date);
            if (idx === undefined) return null;
            const x = PAD.left + idx * stepX;
            return (
              <g key={mi} onMouseEnter={() => setHoverMarker(mi)} onMouseLeave={() => setHoverMarker(null)} style={{ cursor: 'pointer' }}>
                <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + innerH} stroke="#EE5A52" strokeWidth={2} strokeDasharray="4 3" />
                <circle cx={x} cy={PAD.top - 4} r={4} fill="#EE5A52" />
              </g>
            );
          })}
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
              />
            );
          })}
        </svg>
        {hoverIdx !== null && (
          <div className="dash-chart-tooltip" style={{ left: `${((PAD.left + hoverIdx * stepX) / W) * 100}%`, transform: hoverIdx > dates.length / 2 ? 'translate(-105%, 0)' : 'translate(12px, 0)' }}>
            <div className="dash-chart-tooltip-date">{formatDateLong(dates[hoverIdx])}</div>
            <div className="dash-chart-tooltip-row"><span className="dash-chart-dot" style={{ background: color }} /><span>{label}</span><strong>{formatBR(values[hoverIdx])}</strong></div>
          </div>
        )}
        {hoverMarker !== null && (
          <div className="dash-chart-tooltip" style={{ left: `${((PAD.left + (dateIdx.get(markers[hoverMarker].date) ?? 0) * stepX) / W) * 100}%`, top: 8, transform: 'translate(12px, 0)', borderColor: '#EE5A52' }}>
            <div className="dash-chart-tooltip-date" style={{ color: '#C0392B' }}>📰 {formatDateLong(markers[hoverMarker].date)}</div>
            <div style={{ fontSize: 12, color: '#45336B', maxWidth: 220 }}>{markers[hoverMarker].label}</div>
          </div>
        )}
      </div>
    </div>
  );
}
