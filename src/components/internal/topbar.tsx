/**
 * Topbar fixo do /internal — logo Boldfy + view switcher CRM | Dashboard + logout.
 *
 * Client component pra suportar interações (botão logout chama server action).
 */

'use client';

import Link from 'next/link';
import { logout } from '@/app/internal/actions/auth';

type View = 'crm' | 'dashboard' | null;

export function InternalTopbar({ activeView }: { activeView: View }) {
  return (
    <header className="internal-topbar">
      <div className="topbar-left">
        <Link href="/internal/dashboard" className="topbar-logo">
          <span className="logo-1">bold</span>
          <span className="logo-2">fy</span>
        </Link>
        <nav className="view-switcher" aria-label="Trocar entre CRM e Dashboard">
          <Link
            href="/internal/crm"
            className={`vs-btn ${activeView === 'crm' ? 'active' : ''}`}
            aria-current={activeView === 'crm' ? 'page' : undefined}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            CRM
          </Link>
          <Link
            href="/internal/dashboard"
            className={`vs-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            aria-current={activeView === 'dashboard' ? 'page' : undefined}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/>
              <path d="M7 12l4-4 4 4 6-6"/>
            </svg>
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="topbar-right">
        <form action={logout}>
          <button type="submit" className="topbar-logout" title="Sair">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </form>
      </div>

      <style jsx>{`
        .internal-topbar {
          background: #FFFFFF;
          border-bottom: 1px solid #E4D8ED;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
        }
        .topbar-left { display: flex; align-items: center; gap: 20px; }
        .topbar-logo {
          font-family: var(--font-headline);
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.03em;
          text-decoration: none;
        }
        .logo-1 { color: #572D63; }
        .logo-2 { color: #BD58E7; }
        .view-switcher {
          display: flex;
          background: #F7EEFC;
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .vs-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #9D85B3;
          text-decoration: none;
          transition: all 0.2s;
        }
        .vs-btn:hover { color: #5E2A67; }
        .vs-btn.active {
          background: #FFFFFF;
          color: #5E2A67;
          box-shadow: 0 1px 3px rgba(93, 42, 103, 0.08);
        }
        .topbar-logout {
          background: transparent;
          border: 1px solid #E4D8ED;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #9D85B3;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .topbar-logout:hover { color: #CD50F1; border-color: #CD50F1; }
        @media (max-width: 640px) {
          .internal-topbar { padding: 12px 16px; }
        }
      `}</style>
    </header>
  );
}
