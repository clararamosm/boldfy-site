/**
 * Topbar fixo do /internal — logo + toggler CRM/Dashboard + busca + logout.
 *
 * Toggler: segmented control com indicator deslizante (estilo Apple).
 * Layout: tudo numa linha só, compacto.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/internal/actions/auth';

export function InternalTopbar() {
  const pathname = usePathname() ?? '';
  const activeView: 'crm' | 'dashboard' = pathname.startsWith('/internal/crm') ? 'crm' : 'dashboard';

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

        <nav className="view-toggler" aria-label="Trocar entre CRM e Dashboard">
          <Link
            href="/internal/crm"
            className={`toggler-btn ${activeView === 'crm' ? 'active' : ''}`}
            aria-current={activeView === 'crm' ? 'page' : undefined}
          >
            CRM
          </Link>
          <Link
            href="/internal/dashboard"
            className={`toggler-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            aria-current={activeView === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </Link>
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
          gap: 18px;
          min-width: 0;
        }
        .topbar-logo {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        /* === TOGGLER segmented (abordagem simples sem indicator absoluto) === */
        .view-toggler {
          display: inline-flex;
          background: #F7EEFC;
          border-radius: 999px;
          padding: 4px;
          gap: 2px;
        }
        .toggler-btn {
          padding: 7px 22px;
          font-size: 13px;
          font-weight: 600;
          color: #9D85B3;
          text-decoration: none;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          border-radius: 999px;
          text-align: center;
          white-space: nowrap;
          background: transparent;
        }
        .toggler-btn:hover { color: #5E2A67; }
        .toggler-btn.active {
          background: #FFFFFF;
          color: #CD50F1;
          box-shadow: 0 1px 3px rgba(93, 42, 103, 0.08), 0 0 0 1px rgba(205, 80, 241, 0.08);
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

        @media (max-width: 720px) {
          .internal-topbar { padding: 10px 14px; gap: 10px; }
          .topbar-left { gap: 10px; }
          .topbar-icon-btn span { display: none; }
          .topbar-icon-btn kbd { display: none; }
          .toggler-btn { min-width: 64px; padding: 6px 12px; }
        }
      `}</style>
    </header>
  );
}
