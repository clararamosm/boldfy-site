/**
 * Wrapper client que dá filtro de período próprio pra um gráfico.
 *
 * SSR-safe: render inicial usa defaultDays + Date deterministic (último item do array
 * como "hoje"). localStorage e filter time-based só executam após mount, evitando
 * hydration mismatch / Server Component crash.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

const PERIOD_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '3m' },
  { value: 180, label: '6m' },
];

type WithDate = { date: string };

export function ChartWithPeriod<T extends WithDate>({
  fullData,
  defaultDays = 30,
  fillMissing = true,
  render,
  storageKey,
}: {
  fullData: T[];
  defaultDays?: number;
  fillMissing?: boolean;
  /** Recebe dados filtrados + filteredDays e renderiza o gráfico */
  render: (data: T[], days: number) => React.ReactNode;
  /** Se passado, salva escolha do filtro em localStorage por chave */
  storageKey?: string;
}) {
  // Initial state SEM ler localStorage (SSR-safe). Hidrata da preferência só
  // depois que mount roda no client (useEffect).
  const [days, setDays] = useState<number>(defaultDays);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (storageKey) {
      const saved = localStorage.getItem(`chart-period:${storageKey}`);
      if (saved) {
        const n = parseInt(saved, 10);
        if (PERIOD_OPTIONS.some((p) => p.value === n)) setDays(n);
      }
    }
  }, [storageKey]);

  function selectDays(value: number) {
    setDays(value);
    if (storageKey) {
      try { localStorage.setItem(`chart-period:${storageKey}`, String(value)); } catch { /* ignore quota errors */ }
    }
  }

  const filtered = useMemo(() => {
    if (fullData.length === 0) return [];

    // SSR-safe: usa a ÚLTIMA data do array como "hoje" (não Date.now()).
    // Após mount, useMemo re-roda com `mounted` dep e pode usar Date real.
    const todayIso = mounted
      ? new Date().toISOString().split('T')[0]
      : fullData[fullData.length - 1].date;
    const today = new Date(`${todayIso}T00:00:00`);

    if (!fillMissing) {
      const since = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      const sinceIso = since.toISOString().split('T')[0];
      return fullData.filter((d) => d.date >= sinceIso);
    }

    const byDate = new Map(fullData.map((d) => [d.date, d]));
    const sample = fullData[0];
    const zeroPoint: Record<string, unknown> = {};
    for (const k of Object.keys(sample)) {
      zeroPoint[k] = typeof (sample as Record<string, unknown>)[k] === 'number' ? 0 : '';
    }

    const out: T[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      const found = byDate.get(iso);
      if (found) out.push(found);
      else out.push({ ...zeroPoint, date: iso } as T);
    }
    return out;
  }, [fullData, days, fillMissing, mounted]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div className="chart-period-filter">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => selectDays(p.value)}
              className={`chart-period-btn ${days === p.value ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {render(filtered, days)}
    </div>
  );
}
