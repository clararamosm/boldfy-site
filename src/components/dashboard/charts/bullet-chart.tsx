/**
 * <BulletChart> — barra horizontal com target/threshold.
 */

'use client';

import { formatBR } from './_shared';

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
