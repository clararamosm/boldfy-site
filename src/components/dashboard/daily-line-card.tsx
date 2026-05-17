/**
 * Wrapper client all-in-one: DailyLineChart + filtro de período próprio.
 *
 * Por que NÃO usar <ChartWithPeriod render={...} />: passar function como prop
 * de Server Component pra Client Component quebra ("functions are not
 * serializable"). Em vez disso, criamos wrappers fechados que recebem só
 * dados serializáveis.
 */

'use client';

import { ChartWithPeriod } from './chart-with-period';
import { DailyLineChart } from './daily-line-chart';

export function DailyLineCard({
  fullData,
  labels,
  defaultDays = 28,
  storageKey,
}: {
  fullData: { date: string; a: number; b: number }[];
  labels: { a: string; b: string };
  defaultDays?: number;
  storageKey?: string;
}) {
  return (
    <ChartWithPeriod
      fullData={fullData}
      defaultDays={defaultDays}
      storageKey={storageKey}
      render={(filtered) => <DailyLineChart data={filtered} labels={labels} />}
    />
  );
}
