/**
 * Layout do /internal — wrapper das views CRM e Dashboard.
 *
 * Topbar e sub-navs são client components (usePathname) — assim a aba ativa
 * sempre reflete a URL atual mesmo em navegação client-side.
 *
 * SEO: noindex/nofollow herdado de metadata aqui + bloqueio em robots.ts.
 */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { InternalTopbar } from '@/components/internal/topbar';
import { CmdK } from '@/components/crm/cmd-k';
import './internal.css';

export const metadata: Metadata = {
  title: 'Boldfy interno',
  robots: { index: false, follow: false },
};

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detecta página de login só pra omitir topbar (não precisa pro highlight)
  const h = await headers();
  const pathname = h.get('x-pathname') || '';

  if (pathname.startsWith('/internal/login')) {
    return <div className="internal-root">{children}</div>;
  }

  return (
    <div className="internal-root">
      <InternalTopbar />
      <main className="internal-main">{children}</main>
      <CmdK />
    </div>
  );
}
