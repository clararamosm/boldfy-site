/**
 * <BarCompareChart> — bars horizontal lado a lado por categoria.
 */

'use client';

import { formatBR } from './_shared';

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
