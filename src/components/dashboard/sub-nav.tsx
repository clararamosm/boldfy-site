/**
 * Sub-nav do Dashboard (9 abas).
 *
 * Client component — usa usePathname() pra detectar aba ativa corretamente
 * em navegação client-side.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/internal/dashboard', label: 'Visão geral', match: 'exact' },
  { href: '/internal/dashboard/aquisicao', label: 'Aquisição', match: 'prefix' },
  { href: '/internal/dashboard/conversao', label: 'Conversão', match: 'prefix' },
  { href: '/internal/dashboard/campanhas', label: 'Campanhas', match: 'prefix' },
] as const;

export function DashboardSubNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="dash-subnav" aria-label="Sub-navegação do Dashboard">
      {TABS.map((tab) => {
        const isActive = tab.match === 'exact'
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`dash-subnav-link ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
