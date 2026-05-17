/**
 * <DonutChart> — origem dos leads.
 */

'use client';

import { useState } from 'react';
import { BOLDFY_PALETTE, formatBR } from './_shared';

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
