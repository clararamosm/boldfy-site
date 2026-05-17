/**
 * <SourcedFunnel> — origens (esquerda) → funil de stages (direita).
 */

'use client';

import { useState } from 'react';
import { BOLDFY_PALETTE } from './_shared';

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

  // Pré-calcula cumulative heights (sem let mutado — React Compiler proíbe
  // reassign de variáveis após render em React 19).
  const sourceHeights = sources.map((s) => Math.max((s.clicks / totalClicks) * sourcesTotalH, minH));
  const sourceCumY = sourceHeights.reduce<number[]>((acc, h, i) => {
    const prev = i === 0 ? sourcesStartY : acc[i - 1] + sourceHeights[i - 1];
    acc.push(prev);
    return acc;
  }, []);

  const sourceNodes = sources.map((s, i) => ({
    ...s,
    x: padL,
    y: sourceCumY[i],
    h: sourceHeights[i],
    color: palette[i % palette.length],
    pct: (s.clicks / totalClicks) * 100,
  }));

  // Connectors origem → primeira stage (cor da origem) — converge 100% sem perda
  const firstStageCursors = sourceNodes.reduce<number[]>((acc, src, i) => {
    const prev = i === 0 ? firstStage.y : acc[i - 1] + sourceNodes[i - 1].h;
    acc.push(prev);
    return acc;
  }, []);

  const sourceToFunnel = sourceNodes.map((src, i) => {
    const x1 = src.x + sourceBlockW;
    const y1Top = src.y;
    const y1Bot = src.y + src.h;
    const x2 = firstStage.x;
    const segH = src.h;
    const y2Top = firstStageCursors[i];
    const y2Bot = y2Top + segH;
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
