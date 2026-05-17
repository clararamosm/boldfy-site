/**
 * Topbar fixo do /internal — logo + tag de área interna + menu de pages + busca + logout.
 *
 * Menu: simples lista de links (CRM / Dashboard / Catálogo), sem segmented control.
 * Tag "interno · não indexado" deixa claro pro próprio usuário que tudo dali
 * pra dentro é privado e fora dos robots/sitemap.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/internal/actions/auth';

const MENU = [
  { href: '/internal/crm', label: 'CRM', match: '/internal/crm' },
  { href: '/internal/dashboard', label: 'Dashboard', match: '/internal/dashboard' },
  { href: '/internal/catalogo', label: 'Catálogo', match: '/internal/catalogo' },
  { href: '/internal/utm', label: 'UTM', match: '/internal/utm' },
] as const;

export function InternalTopbar() {
  const pathname = usePathname() ?? '';

  function openCmdK() {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
    window.dispatchEvent(event);
  }

  return (
    <header className="internal-topbar">
      <div className="topbar-left">
        <Link href="/internal/dashboard" className="topbar-logo" aria-label="Boldfy — área interna">
          <Image src="/images/boldfy-logo.svg" alt="Boldfy" width={84} height={24} priority />
        </Link>

        <span className="topbar-private-tag" title="Todas as páginas abaixo desse caminho não vão pro Google (noindex)">
          interno · não indexado
        </span>

        <nav className="topbar-menu" aria-label="Áreas internas">
          {MENU.map((item) => {
            const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`topbar-menu-link ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="topbar-right">
        <button type="button" onClick={openCmdK} className="topbar-icon-btn" title="Buscar (⌘K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Buscar</span>
          <kbd>⌘K</kbd>
        </button>
        <form action={logout}>
          <button type="submit" className="topbar-icon-btn" title="Sair">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        .internal-topbar {
          background: #FFFFFF;
          border-bottom: 1px solid #E4D8ED;
          padding: 12px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
          gap: 16px;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .topbar-logo {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        /* Tag pequena indicando que toda essa área é privada e fora do índice do Google */
        .topbar-private-tag {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          background: rgba(157, 133, 179, 0.12);
          color: #6B5B8A;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 6px;
          border: 1px solid rgba(157, 133, 179, 0.2);
          white-space: nowrap;
          cursor: help;
        }

        /* Menu — lista limpa de links, sem segmented control */
        .topbar-menu {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 6px;
        }
        .topbar-menu-link {
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #9D85B3;
          text-decoration: none;
          transition: all 0.15s ease;
          border-radius: 8px;
          white-space: nowrap;
        }
        .topbar-menu-link:hover {
          color: #5E2A67;
          background: #FAF5FE;
        }
        .topbar-menu-link.active {
          color: #CD50F1;
          background: #F7EEFC;
        }

        /* === RIGHT side compacto === */
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .topbar-icon-btn {
          background: transparent;
          border: 1px solid #E4D8ED;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #9D85B3;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .topbar-icon-btn:hover {
          color: #CD50F1;
          border-color: #CD50F1;
        }
        .topbar-icon-btn kbd {
          background: #F7EEFC;
          color: #9D85B3;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-family: inherit;
        }

        @media (max-width: 900px) {
          .topbar-private-tag { display: none; }
        }
        @media (max-width: 720px) {
          .internal-topbar { padding: 10px 14px; gap: 10px; }
          .topbar-left { gap: 8px; }
          .topbar-icon-btn span { display: none; }
          .topbar-icon-btn kbd { display: none; }
          .topbar-menu-link { padding: 6px 10px; font-size: 12px; }
        }
      `}</style>
    </header>
  );
}
