/**
 * Wrapper client all-in-one: MultiLineChart + filtro de período próprio.
 * Veja DailyLineCard pra explicação do pattern.
 */

'use client';

import { ChartWithPeriod } from './chart-with-period';
import { MultiLineChart } from './charts/multi-line-chart';

type Series = { key: string; label: string; color: string };
type SeriesData = { date: string } & Record<string, number | string>;

export function MultiLineCard({
  fullData,
  series,
  defaultDays = 28,
  height = 240,
  storageKey,
}: {
  fullData: SeriesData[];
  /** Definição das séries (key, label, color) — values vêm de fullData[i][key] */
  series: Series[];
  defaultDays?: number;
  height?: number;
  storageKey?: string;
}) {
  return (
    <ChartWithPeriod
      fullData={fullData}
      defaultDays={defaultDays}
      storageKey={storageKey}
      render={(filtered) => (
        <MultiLineChart
          dates={filtered.map((d) => d.date)}
          series={series.map((s) => ({
            ...s,
            data: filtered.map((d) => Number(d[s.key] ?? 0)),
          }))}
          height={height}
        />
      )}
    />
  );
}
