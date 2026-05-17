/**
 * Wrapper client que dá filtro de período próprio pra um gráfico.
 *
 * Server passa os dados de 180 dias (max). Wrapper filtra client-side
 * conforme o usuário escolhe 7/30/90/180. Zero round-trip ao servidor.
 *
 * Funciona com qualquer gráfico que receba `data: { date: string, ... }[]`.
 * Se um dia não tem dado, é preenchido com 0 — linha reta no range pra dar
 * noção de tempo (pedido da Clara).
 */

'use client';

import { useMemo, useState } from 'react';

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
  const [days, setDays] = useState<number>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`chart-period:${storageKey}`);
      if (saved && PERIOD_OPTIONS.some((p) => String(p.value) === saved)) {
        return parseInt(saved, 10);
      }
    }
    return defaultDays;
  });

  function selectDays(value: number) {
    setDays(value);
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`chart-period:${storageKey}`, String(value));
    }
  }

  const filtered = useMemo(() => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString().split('T')[0];

    // Indexa dados por data pra preencher dias faltantes
    const byDate = new Map(fullData.map((d) => [d.date, d]));

    if (!fillMissing) {
      return fullData.filter((d) => d.date >= sinceIso);
    }

    // Constrói range completo, fill missing com cópia do primeiro point zerada
    const sample = fullData[0];
    if (!sample) return [];
    const zeroPoint: Record<string, unknown> = {};
    for (const k of Object.keys(sample)) {
      zeroPoint[k] = typeof (sample as Record<string, unknown>)[k] === 'number' ? 0 : '';
    }

    const out: T[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      const found = byDate.get(iso);
      if (found) {
        out.push(found);
      } else {
        out.push({ ...zeroPoint, date: iso } as T);
      }
    }
    return out;
  }, [fullData, days, fillMissing]);

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
