/**
 * <SankeyFunnel> — sankey simplificado pra funil.
 */

'use client';

import { useState } from 'react';
import { BOLDFY_PALETTE, formatBR } from './_shared';

/**
 * Sankey simplificado: N stages verticais, com bandas grossas conectando.
 * Stages: [{ key, label, count }]. Stages com count 0 viram traço fino indicativo.
 */
export function SankeyFunnel({ stages, colors }: {
  stages: { key: string; label: string; count: number }[];
  colors?: string[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (stages.length < 2) return null;

  const W = 900;
  const H = 280;
  const padL = 12;
  const padR = 12;
  const padT = 30;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const stageW = 14;
  const gap = (innerW - stages.length * stageW) / (stages.length - 1);
  const palette = colors ?? BOLDFY_PALETTE;

  const max = Math.max(...stages.map((s) => s.count), 1);
  const minH = 6;

  const nodes = stages.map((s, i) => {
    const x = padL + i * (stageW + gap);
    const h = Math.max((s.count / max) * innerH, minH);
    const y = padT + (innerH - h) / 2;
    return { ...s, x, y, h, color: palette[i % palette.length] };
  });

  // Connectors: cubic bezier entre node[i].x+stageW e node[i+1].x
  const connectors = nodes.slice(0, -1).map((n, i) => {
    const next = nodes[i + 1];
    const x1 = n.x + stageW;
    const x2 = next.x;
    const mx = (x1 + x2) / 2;
    const path = `
      M${x1},${n.y}
      C${mx},${n.y} ${mx},${next.y} ${x2},${next.y}
      L${x2},${next.y + next.h}
      C${mx},${next.y + next.h} ${mx},${n.y + n.h} ${x1},${n.y + n.h}
      Z`;
    return { path, color: n.color };
  });

  return (
    <div className="dash-chart">
      <div className="dash-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block' }}>
          {/* Connectors */}
          {connectors.map((c, i) => (
            <path key={i} d={c.path} fill={c.color} opacity={hoverIdx === null || hoverIdx === i || hoverIdx === i + 1 ? 0.35 : 0.15} />
          ))}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={n.key} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: 'pointer' }}>
              <rect x={n.x} y={n.y} width={stageW} height={n.h} fill={n.color} rx={2} />
              <text x={n.x + stageW / 2} y={padT - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="#5E2A67" fontFamily="system-ui">{n.label}</text>
              <text x={n.x + stageW / 2} y={H - 8} textAnchor="middle" fontSize={13} fontWeight={900} fill="#5E2A67" fontFamily="system-ui">{formatBR(n.count)}</text>
              {/* Conv % vs previous */}
              {i > 0 && stages[i - 1].count > 0 ? (
                <text x={n.x + stageW / 2} y={H + 8} textAnchor="middle" fontSize={9} fill="#9D85B3" fontFamily="system-ui">{((n.count / stages[i - 1].count) * 100).toFixed(1)}%</text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
