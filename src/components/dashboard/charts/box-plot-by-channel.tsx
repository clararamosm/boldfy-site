/**
 * <BoxPlotByChannel> — score distribution.
 */

'use client';

import { BOLDFY_PALETTE } from './_shared';

export function BoxPlotByChannel({
  rows,
  channelLabel,
}: {
  rows: { channel: string; min: number; q1: number; median: number; q3: number; max: number; n: number }[];
  channelLabel?: (c: string) => string;
}) {
  if (rows.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  const W = 720;
  const H = Math.max(80, rows.length * 38 + 40);
  const PAD = { top: 16, right: 16, bottom: 24, left: 110 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const globalMax = Math.max(...rows.map((r) => r.max), 1);

  function xPos(v: number) {
    return PAD.left + (v / globalMax) * innerW;
  }

  return (
    <div className="dash-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block' }}>
        {/* Eixo X */}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#E4D8ED" />
        {[0, globalMax / 2, globalMax].map((t, i) => (
          <text key={i} x={xPos(t)} y={H - 8} textAnchor="middle" fontSize={10} fill="#9D85B3" fontFamily="system-ui">{Math.round(t)}</text>
        ))}
        {rows.map((r, i) => {
          const y = PAD.top + i * 38 + 12;
          const color = BOLDFY_PALETTE[i % BOLDFY_PALETTE.length];
          return (
            <g key={r.channel}>
              <text x={PAD.left - 8} y={y + 8} textAnchor="end" fontSize={11} fontWeight={600} fill="#5E2A67" fontFamily="system-ui">{channelLabel?.(r.channel) ?? r.channel} ({r.n})</text>
              {/* Whisker */}
              <line x1={xPos(r.min)} y1={y + 8} x2={xPos(r.max)} y2={y + 8} stroke={color} strokeWidth={1.5} />
              <line x1={xPos(r.min)} y1={y + 3} x2={xPos(r.min)} y2={y + 13} stroke={color} strokeWidth={1.5} />
              <line x1={xPos(r.max)} y1={y + 3} x2={xPos(r.max)} y2={y + 13} stroke={color} strokeWidth={1.5} />
              {/* Box */}
              <rect x={xPos(r.q1)} y={y - 2} width={xPos(r.q3) - xPos(r.q1)} height={20} fill={color} opacity={0.4} stroke={color} strokeWidth={1.5} rx={3} />
              {/* Median */}
              <line x1={xPos(r.median)} y1={y - 2} x2={xPos(r.median)} y2={y + 18} stroke="#5E2A67" strokeWidth={2.5} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
