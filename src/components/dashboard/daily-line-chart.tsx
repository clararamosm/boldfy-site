/**
 * Gráfico de linha diário — estilo Search Console.
 *
 * SVG custom (sem lib) porque:
 *   - 2 séries só, escala simples → não precisa Recharts/Chart.js (~80kb gz)
 *   - Controle total da identidade visual Boldfy
 *   - Tooltip nativo via hover do <rect> invisível por dia
 *
 * Props:
 *   data: array de pontos { date: 'YYYY-MM-DD', metricA, metricB }
 *   labels: { a: 'Sessões', b: 'Usuários' } — usado no tooltip e legenda
 *   colors: { a: '#CD50F1', b: '#3B82F6' } — opcional, default purple+blue
 */

'use client';

import { useMemo, useState } from 'react';

type Point = {
  date: string;
  a: number;
  b: number;
};

type Props = {
  data: Point[];
  labels: { a: string; b: string };
  colors?: { a: string; b: string };
  height?: number;
};

const DEFAULT_COLORS = { a: '#CD50F1', b: '#3B82F6' };

function formatDate(iso: string): string {
  // 'YYYY-MM-DD' → 'DD/MM'
  const [, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${d}/${m}`;
}

function formatDateLong(iso: string): string {
  // 'YYYY-MM-DD' → 'DD de mmm, YYYY'
  const d = new Date(`${iso}T12:00:00`); // 12h evita timezone fuckery
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DailyLineChart({ data, labels, colors = DEFAULT_COLORS, height = 260 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Viewbox fixo + escala SVG faz o gráfico ser responsivo sem JS de resize
  const W = 800;
  const H = height;
  // Padding lateral menor agora que só temos um eixo Y (esquerda).
  const PAD = { top: 22, right: 16, bottom: 28, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const { maxY, ticksY, ticksX, pathA, pathB } = useMemo(() => {
    if (data.length === 0) {
      return { maxY: 0, ticksY: [], ticksX: [], pathA: '', pathB: '' };
    }

    // Mai/2026 (Clara): unificou pra UMA régua só. Antes tinha eixo Y duplo
    // (escala separada pra cada série) — fazia as linhas parecerem coladas
    // mesmo quando havia diferença real. Agora maxY = max global → a
    // diferença entre sessões e usuários fica visível.
    const maxY = Math.max(...data.map((d) => Math.max(d.a, d.b)), 1);

    // Step entre pontos (dist horizontal)
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    function buildPath(values: number[]): string {
      return values
        .map((v, i) => {
          const x = PAD.left + i * stepX;
          const y = PAD.top + innerH - (v / maxY) * innerH;
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    }

    const pathA = buildPath(data.map((d) => d.a));
    const pathB = buildPath(data.map((d) => d.b));

    // Y-ticks: 5 níveis arredondados (max em cima, 0 embaixo)
    function niceTicks(max: number) {
      const step = Math.ceil(max / 4);
      return [0, step, step * 2, step * 3, step * 4].filter((v) => v <= max * 1.1);
    }

    // X-ticks: ~6 datas distribuídas
    const xTickCount = Math.min(6, data.length);
    const xTickStep = Math.max(1, Math.floor(data.length / xTickCount));
    const ticksX = data
      .map((d, i) => ({ idx: i, date: d.date }))
      .filter((_, i) => i % xTickStep === 0 || i === data.length - 1);

    return {
      maxY,
      ticksY: niceTicks(maxY),
      ticksX,
      pathA,
      pathB,
    };
  }, [data, innerW, innerH, PAD.left, PAD.top]);

  if (data.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
        Sem dados no período selecionado.
      </div>
    );
  }

  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="dash-chart">
      <div className="dash-chart-legend">
        <div className="dash-chart-legend-item">
          <span className="dash-chart-dot" style={{ background: colors.a }} />
          {labels.a}
        </div>
        <div className="dash-chart-legend-item">
          <span className="dash-chart-dot" style={{ background: colors.b }} />
          {labels.b}
        </div>
      </div>

      <div className="dash-chart-svg-wrap">
        {/* preserveAspectRatio="xMidYMid meet" — antes era "none" e esticava
            texto/linhas em containers mais largos que 800px. Agora SVG
            mantém proporção e fica responsivo via width:100% sem distorção. */}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: H, display: 'block' }}>
          {/* Y-grid (linhas horizontais) + labels neutras (uma régua só) */}
          {ticksY.map((t, i) => {
            const y = PAD.top + innerH - (t / maxY) * innerH;
            return (
              <g key={`gy-${i}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#F0E6F7" strokeWidth={1} />
                <text x={PAD.left - 6} y={y + 3} fontSize={10} fill="#9D85B3" textAnchor="end" fontFamily="system-ui, sans-serif" fontWeight={600}>
                  {t.toLocaleString('pt-BR')}
                </text>
              </g>
            );
          })}

          {/* X-ticks (datas) */}
          {ticksX.map((t) => {
            const x = PAD.left + t.idx * stepX;
            return (
              <text key={`x-${t.idx}`} x={x} y={H - 8} fontSize={10} fill="#9D85B3" textAnchor="middle" fontFamily="system-ui, sans-serif">
                {formatDate(t.date)}
              </text>
            );
          })}

          {/* Linhas */}
          <path d={pathA} fill="none" stroke={colors.a} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathB} fill="none" stroke={colors.b} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Pontos no item em hover (highlight) */}
          {hoverIdx !== null && (
            <g>
              <line
                x1={PAD.left + hoverIdx * stepX}
                y1={PAD.top}
                x2={PAD.left + hoverIdx * stepX}
                y2={PAD.top + innerH}
                stroke="#CD50F1"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
              />
              <circle
                cx={PAD.left + hoverIdx * stepX}
                cy={PAD.top + innerH - (data[hoverIdx].a / maxY) * innerH}
                r={4}
                fill={colors.a}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <circle
                cx={PAD.left + hoverIdx * stepX}
                cy={PAD.top + innerH - (data[hoverIdx].b / maxY) * innerH}
                r={4}
                fill={colors.b}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Hover hit-areas (uma faixa por dia) */}
          {data.map((d, i) => {
            const bandW = stepX || innerW;
            return (
              <rect
                key={`hit-${d.date}`}
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

        {/* Tooltip absoluto baseado no hoverIdx */}
        {hovered && hoverIdx !== null && (
          <div
            className="dash-chart-tooltip"
            style={{
              left: `${((PAD.left + hoverIdx * stepX) / W) * 100}%`,
              transform: hoverIdx > data.length / 2 ? 'translate(-105%, 0)' : 'translate(12px, 0)',
            }}
          >
            <div className="dash-chart-tooltip-date">{formatDateLong(hovered.date)}</div>
            <div className="dash-chart-tooltip-row">
              <span className="dash-chart-dot" style={{ background: colors.a }} />
              <span>{labels.a}</span>
              <strong>{hovered.a.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="dash-chart-tooltip-row">
              <span className="dash-chart-dot" style={{ background: colors.b }} />
              <span>{labels.b}</span>
              <strong>{hovered.b.toLocaleString('pt-BR')}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
