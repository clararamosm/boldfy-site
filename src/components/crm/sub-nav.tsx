/**
 * Sub-nav do CRM (Pessoas / Empresas / Feed / Configurar).
 *
 * Client component — usa usePathname() que reage corretamente a navegações
 * client-side via Link (header HTTP pode ficar stale, hook nativo do Next
 * sempre tem o valor atual).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  totalPeople: number | null;
  totalCompanies: number | null;
};

export function CrmSubNav({ totalPeople, totalCompanies }: Props) {
  const pathname = usePathname() ?? '';

  // Match logic: exato pra Pessoas (root), prefix pros outros
  const isPessoas = pathname === '/internal/crm';
  const isEmpresas = pathname.startsWith('/internal/crm/empresas');
  const isFeed = pathname.startsWith('/internal/crm/feed');
  const isForms = pathname.startsWith('/internal/crm/forms');
  const isSettings = pathname.startsWith('/internal/crm/settings');

  return (
    <nav className="crm-subnav" aria-label="Sub-navegação do CRM">
      <Link
        href="/internal/crm"
        className={`crm-subnav-link ${isPessoas ? 'active' : ''}`}
        aria-current={isPessoas ? 'page' : undefined}
      >
        Pessoas
        {totalPeople !== null ? <span className="count">{totalPeople}</span> : null}
      </Link>
      <Link
        href="/internal/crm/empresas"
        className={`crm-subnav-link ${isEmpresas ? 'active' : ''}`}
        aria-current={isEmpresas ? 'page' : undefined}
      >
        Empresas
        {totalCompanies !== null ? <span className="count">{totalCompanies}</span> : null}
      </Link>
      <Link
        href="/internal/crm/feed"
        className={`crm-subnav-link ${isFeed ? 'active' : ''}`}
        aria-current={isFeed ? 'page' : undefined}
      >
        Feed
      </Link>
      <Link
        href="/internal/crm/forms"
        className={`crm-subnav-link ${isForms ? 'active' : ''}`}
        aria-current={isForms ? 'page' : undefined}
      >
        Formulários
      </Link>
      <Link
        href="/internal/crm/settings/statuses"
        className={`crm-subnav-link ${isSettings ? 'active' : ''}`}
        aria-current={isSettings ? 'page' : undefined}
        style={{ marginLeft: 'auto' }}
      >
        ⚙ Configurar
      </Link>
    </nav>
  );
}
