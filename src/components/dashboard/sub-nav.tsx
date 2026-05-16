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
  { href: '/internal/dashboard/trafego', label: 'Tráfego', match: 'prefix' },
  { href: '/internal/dashboard/forms', label: 'Forms', match: 'prefix' },
  { href: '/internal/dashboard/funil', label: 'Funil B2B', match: 'prefix' },
  { href: '/internal/dashboard/seo', label: 'SEO', match: 'prefix' },
  { href: '/internal/dashboard/linkedin', label: 'LinkedIn', match: 'prefix' },
  { href: '/internal/dashboard/midia', label: 'Mídia & PR', match: 'prefix' },
  { href: '/internal/dashboard/shortlinks', label: 'Shortlinks', match: 'prefix' },
  { href: '/internal/dashboard/web-summit', label: 'Web Summit Rio', match: 'prefix' },
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
