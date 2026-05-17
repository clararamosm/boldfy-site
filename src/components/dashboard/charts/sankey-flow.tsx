/**
 * <SankeyFlow> — sankey "real" com múltiplos source → target.
 */

'use client';

import { BOLDFY_PALETTE } from './_shared';

export function SankeyFlow({ edges, sourceLabels, targetLabels }: {
  edges: { from: string; to: string; weight: number }[];
  sourceLabels?: Record<string, string>;
  targetLabels?: Record<string, string>;
}) {
  if (edges.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  }

  // Build node lists
  const sources = Array.from(new Set(edges.map((e) => e.from)));
  const targets = Array.from(new Set(edges.map((e) => e.to)));

  // Total per source/target
  const srcTotal: Record<string, number> = {};
  const tgtTotal: Record<string, number> = {};
  for (const e of edges) {
    srcTotal[e.from] = (srcTotal[e.from] ?? 0) + e.weight;
    tgtTotal[e.to] = (tgtTotal[e.to] ?? 0) + e.weight;
  }
  const totalW = Object.values(srcTotal).reduce((a, b) => a + b, 0) || 1;

  // Compacto: H=260 (era 360, ficou monstrão). Mantém legibilidade pq pads diminuíram tbm.
  const W = 720;
  const H = 260;
  const nodeW = 12;
  const padL = 100;
  const padR = 120;
  const padTB = 12;
  const innerH = H - padTB * 2;

  // Position sources on left
  let yCursor = padTB;
  const srcPos: Record<string, { y: number; h: number }> = {};
  for (const s of sources) {
    const h = (srcTotal[s] / totalW) * innerH;
    srcPos[s] = { y: yCursor, h };
    yCursor += h + 3;
  }

  // Position targets on right
  yCursor = padTB;
  const tgtPos: Record<string, { y: number; h: number }> = {};
  for (const t of targets) {
    const h = (tgtTotal[t] / totalW) * innerH;
    tgtPos[t] = { y: yCursor, h };
    yCursor += h + 3;
  }

  // Build flows
  const srcOffset: Record<string, number> = {};
  const tgtOffset: Record<string, number> = {};
  for (const s of sources) srcOffset[s] = 0;
  for (const t of targets) tgtOffset[t] = 0;

  // [...edges] evita mutar o array que veio como prop (React Server Component
  // não permite mutar inputs — pode ser causa de erro genérico em runtime).
  const flows = [...edges]
    .sort((a, b) => b.weight - a.weight)
    .map((e, ei) => {
      const s = srcPos[e.from];
      const t = tgtPos[e.to];
      const h = (e.weight / totalW) * innerH;
      const y1 = s.y + srcOffset[e.from];
      const y2 = t.y + tgtOffset[e.to];
      srcOffset[e.from] += h;
      tgtOffset[e.to] += h;

      const x1 = padL + nodeW;
      const x2 = W - padR;
      const mx = (x1 + x2) / 2;
      const path = `
        M${x1},${y1}
        C${mx},${y1} ${mx},${y2} ${x2},${y2}
        L${x2},${y2 + h}
        C${mx},${y2 + h} ${mx},${y1 + h} ${x1},${y1 + h}
        Z`;
      const colorIdx = sources.indexOf(e.from);
      return { path, color: BOLDFY_PALETTE[colorIdx % BOLDFY_PALETTE.length], weight: e.weight, from: e.from, to: e.to, idx: ei };
    });

  return (
    <div className="dash-chart">
      <div className="dash-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block' }}>
          {/* Flows */}
          {flows.map((f) => (
            <path key={f.idx} d={f.path} fill={f.color} opacity={0.4}>
              <title>{(sourceLabels?.[f.from] ?? f.from)} → {(targetLabels?.[f.to] ?? f.to)}: {f.weight}</title>
            </path>
          ))}
          {/* Source nodes */}
          {sources.map((s, i) => {
            const p = srcPos[s];
            const color = BOLDFY_PALETTE[i % BOLDFY_PALETTE.length];
            return (
              <g key={s}>
                <rect x={padL} y={p.y} width={nodeW} height={p.h} fill={color} rx={2} />
                <text x={padL - 6} y={p.y + p.h / 2 + 4} textAnchor="end" fontSize={11} fontWeight={600} fill="#5E2A67" fontFamily="system-ui">
                  {sourceLabels?.[s] ?? s} ({srcTotal[s]})
                </text>
              </g>
            );
          })}
          {/* Target nodes */}
          {targets.map((t) => {
            const p = tgtPos[t];
            return (
              <g key={t}>
                <rect x={W - padR} y={p.y} width={nodeW} height={p.h} fill="#7E3FA6" rx={2} />
                <text x={W - padR + nodeW + 6} y={p.y + p.h / 2 + 4} textAnchor="start" fontSize={11} fontWeight={600} fill="#5E2A67" fontFamily="system-ui">
                  {targetLabels?.[t] ?? t} ({tgtTotal[t]})
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
