/**
 * Filtro de período pros gráficos (estilo Search Console).
 *
 * Usa URL search params (`?period=7|28|90|180`) pra persistir entre reloads e
 * permitir compartilhamento de link. Default = 28d.
 */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { PERIODS } from './period-utils';

// parsePeriod foi MOVIDO pra ./period-utils.ts pra poder ser importado de
// Server Components sem o 'use client' contaminar o bundle.

export function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get('period') ?? '28';

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '28') params.delete('period');
    else params.set('period', value);
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  }

  return (
    <div className="dash-period-filter" data-pending={isPending ? 'true' : undefined}>
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`dash-period-btn ${current === p.value ? 'active' : ''}`}
          onClick={() => setPeriod(p.value)}
          disabled={isPending}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
