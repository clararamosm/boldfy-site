/**
 * <CohortMatrix> — matriz cohort com cores.
 */

'use client';

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
