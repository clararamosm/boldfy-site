/**
 * <FunnelStages> — funil clássico horizontal com drop-off.
 */

'use client';

import { BOLDFY_PALETTE, formatBR } from './_shared';

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
