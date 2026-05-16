/**
 * Layout do /internal/dashboard — sub-nav comum a todas as abas.
 *
 * 9 abas (sec 3 do SPEC):
 *   Visão geral · Tráfego · Forms · Funil · SEO · LinkedIn · Mídia & PR · Shortlinks · Web Summit
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import './dashboard.css';

const TABS = [
  { href: '/internal/dashboard', label: 'Visão geral' },
  { href: '/internal/dashboard/trafego', label: 'Tráfego' },
  { href: '/internal/dashboard/forms', label: 'Forms' },
  { href: '/internal/dashboard/funil', label: 'Funil B2B' },
  { href: '/internal/dashboard/seo', label: 'SEO' },
  { href: '/internal/dashboard/linkedin', label: 'LinkedIn' },
  { href: '/internal/dashboard/midia', label: 'Mídia & PR' },
  { href: '/internal/dashboard/shortlinks', label: 'Shortlinks' },
  { href: '/internal/dashboard/web-summit', label: 'Web Summit Rio' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';

  return (
    <div>
      <nav className="dash-subnav" aria-label="Sub-navegação do Dashboard">
        {TABS.map((tab) => {
          const isActive = tab.href === '/internal/dashboard'
            ? pathname === '/internal/dashboard'
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`dash-subnav-link ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
