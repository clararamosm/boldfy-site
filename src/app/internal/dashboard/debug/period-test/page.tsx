/**
 * Teste mínimo do PeriodFilter + Suspense — sem queries, sem componentes
 * complexos. Se essa rota carregar mas /aquisicao quebra, o problema NÃO é
 * o PeriodFilter, é alguma section da page.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { parsePeriod } from '@/components/dashboard/period-utils';

export const metadata: Metadata = { title: 'Debug · Period Filter', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ period?: string }>;

export default async function PeriodFilterTestPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const days = parsePeriod(params.period);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Period filter — teste mínimo</h1>
          <p className="dash-subtitle">Sem queries, sem componentes. Carregando? PeriodFilter funciona. Quebrou? PeriodFilter é a causa.</p>
        </div>
        <Suspense fallback={<div style={{ width: 220, height: 32 }} />}>
          <PeriodFilter />
        </Suspense>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">✓ Page carregada</div>
        <div style={{ padding: 14 }}>
          <p>Param <code>period</code> = <strong>{params.period ?? '(none)'}</strong></p>
          <p>Days parseado = <strong>{days}</strong></p>
        </div>
      </div>
    </div>
  );
}
