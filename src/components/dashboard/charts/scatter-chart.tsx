/**
 * <ScatterChart> — scatter com bolhas (size = 3a métrica).
 */

'use client';

import { useState } from 'react';
import { formatBR } from './_shared';

export function ScatterChart({
  points,
  xLabel,
  yLabel,
  invertX = false,
  width = 700,
  height = 320,
}: {
  points: { x: number; y: number; size: number; label: string }[];
  xLabel: string;
  yLabel: string;
  invertX?: boolean;
  width?: number;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;

  const PAD = { top: 18, right: 14, bottom: 36, left: 50 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const sizes = points.map((p) => p.size);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMax = Math.max(...ys, 1);
  const sizeMax = Math.max(...sizes, 1);

  function xPos(x: number) {
    const ratio = (x - xMin) / (xMax - xMin || 1);
    return PAD.left + (invertX ? 1 - ratio : ratio) * innerW;
  }
  function yPos(y: number) {
    return PAD.top + innerH - (y / yMax) * innerH;
  }
  function rPos(s: number) {
    return 3 + (s / sizeMax) * 18;
  }

  return (
    <div className="dash-chart">
      <div className="dash-chart-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block' }}>
          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#E4D8ED" />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="#E4D8ED" />
          <text x={PAD.left + innerW / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="#9D85B3" fontFamily="system-ui">{xLabel}</text>
          <text x={PAD.left - 36} y={PAD.top + innerH / 2} textAnchor="middle" fontSize={11} fill="#9D85B3" fontFamily="system-ui" transform={`rotate(-90, ${PAD.left - 36}, ${PAD.top + innerH / 2})`}>{yLabel}</text>

          {/* Y ticks */}
          {[0, yMax / 2, yMax].map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={yPos(t)} x2={PAD.left + innerW} y2={yPos(t)} stroke="#F0E6F7" strokeWidth={0.6} />
              <text x={PAD.left - 4} y={yPos(t) + 3} fontSize={10} fill="#9D85B3" textAnchor="end" fontFamily="system-ui">{formatBR(Math.round(t))}</text>
            </g>
          ))}

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={xPos(p.x)}
              cy={yPos(p.y)}
              r={rPos(p.size)}
              fill="#CD50F1"
              opacity={hover === null || hover === i ? 0.6 : 0.2}
              stroke="#FFFFFF"
              strokeWidth={1}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>
        {hover !== null && (
          <div className="dash-chart-tooltip" style={{ left: `${(xPos(points[hover].x) / width) * 100}%`, top: yPos(points[hover].y) - 60, transform: 'translate(8px, 0)' }}>
            <div className="dash-chart-tooltip-date" style={{ maxWidth: 220, whiteSpace: 'normal' }}>{points[hover].label}</div>
            <div className="dash-chart-tooltip-row"><span>{xLabel}</span><strong>{formatBR(points[hover].x)}</strong></div>
            <div className="dash-chart-tooltip-row"><span>{yLabel}</span><strong>{formatBR(points[hover].y)}</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
