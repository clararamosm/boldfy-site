/**
 * Layout do /internal/crm — wraps as sub-views (Pessoas, Empresas, Feed) com
 * uma sub-nav comum.
 *
 * Renderiza counts em real-time pra cada aba (Pessoas N, Empresas N).
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { getCrmCounts } from '@/lib/crm-queries';
import './crm.css';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';

  // Counts são opcionais — se DB não estiver conectado, ignora silenciosamente
  let counts: { totalPeople: number; totalCompanies: number; totalActivities: number } | null = null;
  try {
    counts = await getCrmCounts();
  } catch {
    counts = null;
  }

  const isActive = (path: string): boolean =>
    pathname === path || (path !== '/internal/crm' && pathname.startsWith(path));

  return (
    <div>
      <nav className="crm-subnav" aria-label="Sub-navegação do CRM">
        <Link
          href="/internal/crm"
          className={`crm-subnav-link ${pathname === '/internal/crm' ? 'active' : ''}`}
        >
          Pessoas
          {counts ? <span className="count">{counts.totalPeople}</span> : null}
        </Link>
        <Link
          href="/internal/crm/empresas"
          className={`crm-subnav-link ${isActive('/internal/crm/empresas') ? 'active' : ''}`}
        >
          Empresas
          {counts ? <span className="count">{counts.totalCompanies}</span> : null}
        </Link>
        <Link
          href="/internal/crm/feed"
          className={`crm-subnav-link ${isActive('/internal/crm/feed') ? 'active' : ''}`}
        >
          Feed
        </Link>
      </nav>

      {children}
    </div>
  );
}
