/**
 * Layout do /internal — wrapper das views CRM e Dashboard.
 *
 * Render:
 *   - Topbar com logo Boldfy + view switcher CRM | Dashboard + botão logout
 *   - Children (cada rota renderiza sua sub-nav e conteúdo)
 *
 * Acesso: protegido por proxy.ts. Esse layout assume que usuário já tá logado.
 *
 * SEO: noindex/nofollow herdado de metadata aqui + bloqueio em robots.ts.
 */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { InternalTopbar } from '@/components/internal/topbar';
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
  // Pega o pathname dos headers (set pelo proxy/Next) pra destacar view ativa
  const h = await headers();
  const pathname = h.get('x-pathname') || '';
  const activeView = pathname.startsWith('/internal/crm')
    ? 'crm'
    : pathname.startsWith('/internal/dashboard')
      ? 'dashboard'
      : null;

  // Rota de login não renderiza topbar
  if (pathname.startsWith('/internal/login')) {
    return <div className="internal-root">{children}</div>;
  }

  return (
    <div className="internal-root">
      <InternalTopbar activeView={activeView} />
      <main className="internal-main">{children}</main>
    </div>
  );
}
