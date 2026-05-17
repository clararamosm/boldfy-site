/**
 * Componentes de chart SVG custom pro dashboard.
 *
 * Tudo SVG puro — sem Recharts/Chart.js — porque:
 *  - Identidade visual Boldfy total controle
 *  - Bundle leve (sem 80kb gz de lib)
 *  - Tooltip simples via state local
 *  - Responsive via viewBox + preserveAspectRatio
 *
 * Convenções:
 *  - Cores Boldfy: roxo principal #CD50F1, azul #3B82F6, verde #10B981, amber #F59E0B
 *  - Tooltip: <div absoluto> sobre o SVG, posicionado pelo state
 *  - Hit areas: <rect transparent> com onMouseEnter/Leave
 */

'use client';

import { useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  Helpers compartilhados                                                     */
/* -------------------------------------------------------------------------- */

export const BOLDFY_PALETTE = [
  '#CD50F1', // roxo Boldfy
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // amber
  '#F97316', // orange
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#06B6D4', // cyan
];

/**
 * Variações tonais de roxo — pra stacked area e demais charts que ficam mais
 * coesos quando todas séries são da mesma família de cor.
 */
export const BOLDFY_PURPLES = [
  '#5E2A67', // roxo escuro Boldfy
  '#7E3FA6',
  '#9D5FCC',
  '#B57AE0',
  '#CD50F1', // roxo principal
  '#E875FF',
  '#F0A8FF',
  '#F7D0FF',
];

function formatBR(n: number): string {
  return n.toLocaleString('pt-BR');
}

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* -------------------------------------------------------------------------- */
/*  <Sparkline> — mini-linha sem eixos (pra bento KPI cards)                  */
/* -------------------------------------------------------------------------- */

export function Sparkline({
  data,
  width = 100,
  height = 28,
  color = '#CD50F1',
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (data.length === 0) return <div style={{ width: '100%', height }} />;
  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(' ');
  const path = `M${points.replaceAll(' ', ' L')}`;
  const areaPath = `${path} L${width.toFixed(1)},${height} L0,${height} Z`;

  // viewBox + preserveAspectRatio="none" garante que o sparkline preenche a largura
  // do container (parent é flex/grid item de largura variável).
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height }}
    >
      {fill && <path d={areaPath} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  <MultiLineChart> — 3 séries (visitas / forms / reuniões)                  */
/* -------------------------------------------------------------------------- */

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
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
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

/* -------------------------------------------------------------------------- */
/*  <StackedAreaChart> — N canais empilhados                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  <DonutChart> — origem dos leads                                           */
/* -------------------------------------------------------------------------- */

export function DonutChart({
  data,
  labelMap,
  size = 200,
  thickness = 30,
}: {
  data: { key: string; value: number }[];
  labelMap?: Record<string, string>;
  size?: number;
  thickness?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const rInner = r - thickness;

  if (total === 0 || data.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  }

  // Pre-compute cumulative sums (sem let mutado — react/immutability rule)
  const cumSums = data.reduce<number[]>((acc, d) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(last + d.value);
    return acc;
  }, []);
  const arcs = data.map((d, i) => {
    const startSum = i === 0 ? 0 : cumSums[i - 1];
    const endSum = cumSums[i];
    const startAngle = (startSum / total) * 2 * Math.PI;
    const endAngle = (endSum / total) * 2 * Math.PI;
    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const xi1 = cx + rInner * Math.sin(startAngle);
    const yi1 = cy - rInner * Math.cos(startAngle);
    const xi2 = cx + rInner * Math.sin(endAngle);
    const yi2 = cy - rInner * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return {
      idx: i,
      key: d.key,
      value: d.value,
      color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
      path: `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${xi2.toFixed(1)},${yi2.toFixed(1)} A${rInner},${rInner} 0 ${largeArc} 0 ${xi1.toFixed(1)},${yi1.toFixed(1)} Z`,
    };
  });

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((a) => (
            <path
              key={a.key}
              d={a.path}
              fill={a.color}
              opacity={hoverIdx === null || hoverIdx === a.idx ? 1 : 0.4}
              onMouseEnter={() => setHoverIdx(a.idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={900} fill="#5E2A67" fontFamily="system-ui">{formatBR(total)}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#9D85B3" fontFamily="system-ui">{hoverIdx !== null ? (labelMap?.[data[hoverIdx].key] ?? data[hoverIdx].key) : 'total'}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {arcs.map((a, i) => (
          <div
            key={a.key}
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.45, cursor: 'pointer' }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
            <span style={{ color: '#45336B', fontWeight: 600 }}>{labelMap?.[a.key] ?? a.key}</span>
            <span style={{ color: '#9D85B3', marginLeft: 'auto' }}>{a.value} · {((a.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <HeatmapChart> — matriz 7×24 (dia × hora)                                 */
/* -------------------------------------------------------------------------- */

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

/* -------------------------------------------------------------------------- */
/*  <FunnelStages> — funil clássico horizontal com drop-off                   */
/* -------------------------------------------------------------------------- */

export function FunnelStages({ stages }: {
  stages: { label: string; count: number; color?: string }[];
}) {
  if (stages.length === 0) return null;
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stages.map((s, i) => {
        const widthPct = (s.count / max) * 100;
        const prev = i > 0 ? stages[i - 1].count : null;
        const dropPct = prev && prev > 0 ? ((prev - s.count) / prev) * 100 : null;
        const color = s.color ?? BOLDFY_PALETTE[i % BOLDFY_PALETTE.length];

        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '210px 1fr 100px', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FAF7FF', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5E2A67' }}>{s.label}</div>
              {dropPct !== null && dropPct > 0 ? (
                <div style={{ fontSize: 10, color: '#EE5A52', marginTop: 2 }}>↓ {dropPct.toFixed(0)}% drop-off</div>
              ) : null}
            </div>
            <div style={{ height: 28, background: '#FFFFFF', borderRadius: 8, overflow: 'hidden', border: '1px solid #E4D8ED', position: 'relative' }}>
              <div style={{ height: '100%', width: `${Math.max(widthPct, s.count > 0 ? 2 : 0)}%`, background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`, borderRadius: 8 }} />
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 20, color: '#5E2A67' }}>{formatBR(s.count)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <SankeyFunnel> — sankey simplificado pra funil                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  <SourcedFunnel> — origens (esquerda) → funil de stages (direita)          */
/* -------------------------------------------------------------------------- */

/**
 * Funil com múltiplas origens convergindo na primeira stage.
 * Layout:
 *   ┌─ Origem A ─╮
 *   ├─ Origem B ─┤
 *   ┝────────────┼──→ Stage 1 (Cliques) → Stage 2 → Stage 3 → ... → Stage N
 *   ├─ Origem C ─┤
 *   └─ Origem D ─╯
 */
export function SourcedFunnel({
  sources,
  stages,
}: {
  sources: { key: string; label: string; clicks: number; proxy?: boolean }[];
  stages: { key: string; label: string; help?: string; count: number }[];
}) {
  const [hover, setHover] = useState<{ kind: 'source' | 'stage'; idx: number; x: number; y: number } | null>(null);
  if (stages.length < 2) return null;

  // Viewbox maior: mais espaço pros números + sem corte de label
  const W = 1100;
  const H = 420;
  const padL = 16;
  const padR = 16;
  const padT = 50;
  const padB = 70;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Origens ocupam ~150px de width fixa; resto é funil
  const sourceBlockW = sources.length > 0 ? 130 : 0;
  const sourceConnectorW = sources.length > 0 ? 60 : 0;
  const funnelStartX = padL + sourceBlockW + sourceConnectorW;
  const funnelW = padL + innerW - funnelStartX;

  const totalClicks = sources.reduce((a, s) => a + s.clicks, 0) || 1;
  const stageW = 16;
  const stageGap = stages.length > 1 ? (funnelW - stages.length * stageW) / (stages.length - 1) : 0;
  const palette = BOLDFY_PALETTE;

  // Escala compartilhada: max é o MAIOR entre cliques totais e qualquer stage
  // (assim a barra "Cliques totais" tem a mesma escala visual que origens)
  const max = Math.max(totalClicks, ...stages.map((s) => s.count), 1);
  const minH = 4;

  const stageNodes = stages.map((s, i) => {
    const x = funnelStartX + i * (stageW + stageGap);
    const h = Math.max((s.count / max) * innerH, minH);
    const y = padT + (innerH - h) / 2;
    return { ...s, x, y, h, color: '#7E3FA6' };
  });

  // ALTURA TOTAL das origens = altura do stage cliques (todas convergem nele 100%)
  // Sem gap entre elas — bloco contínuo.
  const firstStage = stageNodes[0];
  const sourcesTotalH = firstStage.h;
  const sourcesStartY = firstStage.y;

  let sCursor = sourcesStartY;
  const sourceNodes = sources.map((s, i) => {
    const h = Math.max((s.clicks / totalClicks) * sourcesTotalH, minH);
    const node = {
      ...s,
      x: padL,
      y: sCursor,
      h,
      color: palette[i % palette.length],
      pct: (s.clicks / totalClicks) * 100,
    };
    sCursor += h;
    return node;
  });

  // Connectors origem → primeira stage (cor da origem) — converge 100% sem perda
  let firstStageCursor = firstStage.y;
  const sourceToFunnel = sourceNodes.map((src) => {
    const x1 = src.x + sourceBlockW;
    const y1Top = src.y;
    const y1Bot = src.y + src.h;
    const x2 = firstStage.x;
    const segH = src.h; // mesma altura que a origem (sem distorção)
    const y2Top = firstStageCursor;
    const y2Bot = y2Top + segH;
    firstStageCursor += segH;
    const mx = (x1 + x2) / 2;
    const path = `
      M${x1},${y1Top}
      C${mx},${y1Top} ${mx},${y2Top} ${x2},${y2Top}
      L${x2},${y2Bot}
      C${mx},${y2Bot} ${mx},${y1Bot} ${x1},${y1Bot}
      Z`;
    return { path, color: src.color, key: src.key };
  });

  // Connectors entre stages
  const stageConnectors = stageNodes.slice(0, -1).map((n, i) => {
    const next = stageNodes[i + 1];
    const x1 = n.x + stageW;
    const x2 = next.x;
    const mx = (x1 + x2) / 2;
    const path = `
      M${x1},${n.y}
      C${mx},${n.y} ${mx},${next.y} ${x2},${next.y}
      L${x2},${next.y + next.h}
      C${mx},${next.y + next.h} ${mx},${n.y + n.h} ${x1},${n.y + n.h}
      Z`;
    return { path };
  });

  function setHoverFromEvent(e: React.MouseEvent, kind: 'source' | 'stage', idx: number) {
    const wrap = (e.currentTarget as SVGElement).closest('.dash-chart-svg-wrap') as HTMLElement | null;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setHover({ kind, idx, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className="dash-chart" style={{ width: '100%', height: '100%' }}>
      <div className="dash-chart-svg-wrap" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', minHeight: 380 }}>
          {/* Header origens */}
          {sources.length > 0 ? (
            <text x={padL} y={padT - 22} fontSize={11} fontWeight={700} fill="#9D85B3" fontFamily="system-ui" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ORIGENS (CLIQUES)
            </text>
          ) : null}
          <text x={funnelStartX} y={padT - 22} fontSize={11} fontWeight={700} fill="#9D85B3" fontFamily="system-ui" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            FUNIL DE CONVERSÃO
          </text>

          {/* Connectors source → stage 1 */}
          {sourceToFunnel.map((c) => (
            <path key={c.key} d={c.path} fill={c.color} opacity={hover?.kind === 'source' && sourceNodes[hover.idx]?.key === c.key ? 0.7 : 0.35} />
          ))}

          {/* Source nodes — bloco contínuo SEM gap, label fora se altura < 36 */}
          {sourceNodes.map((s, i) => {
            const showInsideText = s.h >= 36;
            return (
              <g
                key={s.key}
                onMouseMove={(e) => setHoverFromEvent(e, 'source', i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect x={s.x} y={s.y} width={sourceBlockW} height={s.h} fill={s.color} opacity={hover?.kind === 'source' && hover.idx === i ? 1 : 0.9} />
                {showInsideText ? (
                  <>
                    <text x={s.x + 10} y={s.y + 18} fontSize={12} fontWeight={700} fill="#FFFFFF" fontFamily="system-ui">
                      {s.label}{s.proxy ? '*' : ''}
                    </text>
                    <text x={s.x + 10} y={s.y + s.h - 8} fontSize={11} fill="#FFFFFF" fontFamily="system-ui" opacity={0.9}>
                      {s.clicks.toLocaleString('pt-BR')} · {s.pct.toFixed(0)}%
                    </text>
                  </>
                ) : (
                  /* Altura pequena: label fora à direita */
                  <text x={s.x + sourceBlockW + 4} y={s.y + s.h / 2 + 4} fontSize={10} fontWeight={600} fill="#5E2A67" fontFamily="system-ui">
                    {s.label}{s.proxy ? '*' : ''} · {s.clicks}
                  </text>
                )}
              </g>
            );
          })}
          {sources.length === 0 ? (
            <text x={padL} y={padT + innerH / 2} fontSize={12} fill="#9D85B3" fontFamily="system-ui">
              (Conecta GA4 + SC pra ver origens)
            </text>
          ) : null}

          {/* Stage connectors */}
          {stageConnectors.map((c, i) => (
            <path key={i} d={c.path} fill="#7E3FA6" opacity={hover?.kind === 'stage' && (hover.idx === i || hover.idx === i + 1) ? 0.5 : 0.22} />
          ))}

          {/* Stage nodes */}
          {stageNodes.map((n, i) => {
            const prevCount = i === 0 ? totalClicks : stages[i - 1].count;
            const convPct = prevCount > 0 ? (n.count / prevCount) * 100 : 0;
            return (
              <g
                key={n.key}
                onMouseMove={(e) => setHoverFromEvent(e, 'stage', i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect x={n.x} y={n.y} width={stageW} height={n.h} fill={n.color} rx={2} opacity={hover?.kind === 'stage' && hover.idx === i ? 1 : 0.9} />
                {/* Label ACIMA do funil — title em duas linhas se houver help */}
                <text x={n.x + stageW / 2} y={padT - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#5E2A67" fontFamily="system-ui">
                  {n.label}
                </text>
                {n.help ? (
                  <text x={n.x + stageW / 2} y={padT + 4} textAnchor="middle" fontSize={9} fill="#9D85B3" fontFamily="system-ui">
                    {n.help}
                  </text>
                ) : null}
                {/* Número ABAIXO — espaço garantido por padB=70 */}
                <text x={n.x + stageW / 2} y={H - padB + 20} textAnchor="middle" fontSize={14} fontWeight={900} fill="#5E2A67" fontFamily="system-ui">
                  {n.count.toLocaleString('pt-BR')}
                </text>
                {i > 0 ? (
                  <text x={n.x + stageW / 2} y={H - padB + 36} textAnchor="middle" fontSize={10} fontWeight={600} fill={convPct < 20 ? '#EE5A52' : '#10B981'} fontFamily="system-ui">
                    {convPct.toFixed(1)}%
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Tooltip flutuante */}
        {hover ? (
          <div
            className="dash-chart-tooltip"
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
              pointerEvents: 'none',
              minWidth: 200,
            }}
          >
            {hover.kind === 'source' ? (() => {
              const s = sourceNodes[hover.idx];
              if (!s) return null;
              return (
                <>
                  <div className="dash-chart-tooltip-date">{s.label}{s.proxy ? ' (proxy)' : ''}</div>
                  <div className="dash-chart-tooltip-row">
                    <span className="dash-chart-dot" style={{ background: s.color }} />
                    <span>Cliques</span>
                    <strong>{s.clicks.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="dash-chart-tooltip-row">
                    <span style={{ width: 10 }} />
                    <span>% das origens</span>
                    <strong>{s.pct.toFixed(1)}%</strong>
                  </div>
                  {s.proxy ? (
                    <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 6 }}>
                      proxy via sessions GA4 (LinkedIn/Direct não expõe cliques reais)
                    </div>
                  ) : null}
                </>
              );
            })() : (() => {
              const n = stageNodes[hover.idx];
              if (!n) return null;
              const prevCount = hover.idx === 0 ? totalClicks : stages[hover.idx - 1].count;
              const convPct = prevCount > 0 ? (n.count / prevCount) * 100 : 0;
              const fromTopPct = totalClicks > 0 ? (n.count / totalClicks) * 100 : 0;
              return (
                <>
                  <div className="dash-chart-tooltip-date">{n.label}</div>
                  {n.help ? <div style={{ fontSize: 11, color: '#9D85B3', marginBottom: 6 }}>{n.help}</div> : null}
                  <div className="dash-chart-tooltip-row">
                    <span className="dash-chart-dot" style={{ background: '#7E3FA6' }} />
                    <span>Total</span>
                    <strong>{n.count.toLocaleString('pt-BR')}</strong>
                  </div>
                  {hover.idx > 0 ? (
                    <div className="dash-chart-tooltip-row">
                      <span style={{ width: 10 }} />
                      <span>vs anterior</span>
                      <strong style={{ color: convPct < 20 ? '#EE5A52' : '#10B981' }}>{convPct.toFixed(1)}%</strong>
                    </div>
                  ) : null}
                  {hover.idx > 0 ? (
                    <div className="dash-chart-tooltip-row">
                      <span style={{ width: 10 }} />
                      <span>vs cliques totais</span>
                      <strong>{fromTopPct.toFixed(1)}%</strong>
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        ) : null}

        {sources.some((s) => s.proxy) ? (
          <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 8, paddingLeft: 4 }}>
            * proxy via sessions (cliques exatos só pra SEO via Search Console)
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <SankeyFlow> — sankey "real" com múltiplos source → target                */
/* -------------------------------------------------------------------------- */

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

  const W = 800;
  const H = 360;
  const nodeW = 14;
  const padL = 110;
  const padR = 140;
  const padTB = 16;
  const innerH = H - padTB * 2;

  // Position sources on left
  let yCursor = padTB;
  const srcPos: Record<string, { y: number; h: number }> = {};
  for (const s of sources) {
    const h = (srcTotal[s] / totalW) * innerH;
    srcPos[s] = { y: yCursor, h };
    yCursor += h + 4;
  }

  // Position targets on right
  yCursor = padTB;
  const tgtPos: Record<string, { y: number; h: number }> = {};
  for (const t of targets) {
    const h = (tgtTotal[t] / totalW) * innerH;
    tgtPos[t] = { y: yCursor, h };
    yCursor += h + 4;
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

/* -------------------------------------------------------------------------- */
/*  <ScatterChart> — scatter com bolhas (size = 3a métrica)                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  <BulletChart> — barra horizontal com target/threshold                     */
/* -------------------------------------------------------------------------- */

export function BulletChart({
  items,
}: {
  items: { label: string; value: number; target: number; unit?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => {
        const max = Math.max(it.value, it.target) * 1.15;
        const valuePct = (it.value / max) * 100;
        const targetPct = (it.target / max) * 100;
        const ok = it.value >= it.target;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#45336B' }}>{it.label}</div>
            <div style={{ position: 'relative', height: 20, background: '#FAF7FF', borderRadius: 6 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${valuePct}%`, background: ok ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #CD50F1, #E875FF)', borderRadius: 6 }} />
              <div style={{ position: 'absolute', left: `${targetPct}%`, top: -2, bottom: -2, width: 2, background: '#5E2A67' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#5E2A67' }}>
              <strong>{formatBR(it.value)}</strong> / {formatBR(it.target)} {it.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <CohortMatrix> — matriz cohort com cores                                  */
/* -------------------------------------------------------------------------- */

export function CohortMatrix({
  rows,
}: {
  rows: { month: string; total: number; values: { label: string; value: number }[] }[];
}) {
  if (rows.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados.</div>;
  const headers = rows[0]?.values.map((v) => v.label) ?? [];
  const allPcts = rows.flatMap((r) => r.values.map((v) => (r.total > 0 ? (v.value / r.total) * 100 : 0)));
  const maxPct = Math.max(...allPcts, 1);

  function cellColor(pct: number) {
    const intensity = pct / maxPct;
    return `rgba(205, 80, 241, ${0.15 + intensity * 0.85})`;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: '#9D85B3', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Cohort</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#9D85B3', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Tamanho</th>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'center', padding: '8px 6px', color: '#9D85B3', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#5E2A67' }}>{r.month}</td>
              <td style={{ textAlign: 'right', padding: '8px 10px', color: '#45336B' }}>{r.total}</td>
              {r.values.map((v) => {
                const pct = r.total > 0 ? (v.value / r.total) * 100 : 0;
                return (
                  <td key={v.label} style={{ textAlign: 'center', padding: 4 }}>
                    <div style={{ background: cellColor(pct), borderRadius: 6, padding: '8px 4px', color: pct > maxPct * 0.55 ? '#FFFFFF' : '#5E2A67', fontWeight: 700 }}>
                      {pct.toFixed(0)}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <BarCompareChart> — bars horizontal lado a lado por categoria             */
/* -------------------------------------------------------------------------- */

export function BarCompareChart({
  data,
  series,
}: {
  data: { label: string }[];
  series: { key: string; label: string; color: string; values: number[] }[];
}) {
  if (data.length === 0) return null;
  const max = Math.max(...series.flatMap((s) => s.values), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d, di) => (
        <div key={di}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5E2A67', marginBottom: 4 }}>{d.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {series.map((s) => {
              const v = s.values[di] ?? 0;
              const widthPct = (v / max) * 100;
              return (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 60px', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9D85B3', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    {s.label}
                  </div>
                  <div style={{ height: 14, background: '#FAF7FF', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(widthPct, v > 0 ? 1 : 0)}%`, background: s.color, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#45336B', textAlign: 'right' }}>{formatBR(v)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <TimelineMarkers> — linha (área) com marcadores verticais (eventos)       */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  <BoxPlotByChannel> — score distribution                                   */
/* -------------------------------------------------------------------------- */

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
