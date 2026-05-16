/**
 * Dashboard interno — placeholder Sprint 1.
 *
 * Em Sprint 3, esse arquivo é substituído pelo dashboard completo com as 9 abas
 * (Visão geral, Tráfego, Forms, Funil, SEO, LinkedIn, Mídia & PR, Shortlinks,
 * Web Summit). Por enquanto só confirma que auth funciona e o switcher tá no
 * lugar.
 *
 * Ver: docs/SPEC-dashboard-metricas-organicas.md
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <div className="placeholder">
      <span className="tag">Sprint 1 · scaffold</span>
      <h1 className="title">Dashboard</h1>
      <p className="copy">
        Estrutura básica funcionando. As 9 abas (Visão geral, Tráfego,
        Formulários, Funil B2B, SEO, LinkedIn, Mídia & PR, Shortlinks e Web
        Summit Rio) entram no Sprint 3.
      </p>
      <p className="copy small">
        Veja como vai ficar:{' '}
        <a href="/docs/dashboard-preview.html" target="_blank" rel="noopener">
          docs/dashboard-preview.html
        </a>
      </p>

      <style>{`
        .placeholder {
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 18px;
          padding: 36px;
          box-shadow: 0 8px 32px rgba(93, 42, 103, 0.06);
          max-width: 680px;
        }
        .tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #CD50F1;
          background: rgba(205, 80, 241, 0.08);
          border: 1px solid rgba(205, 80, 241, 0.25);
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
        }
        .title {
          font-family: var(--font-headline);
          font-weight: 900;
          font-size: 32px;
          color: #5E2A67;
          margin-bottom: 10px;
        }
        .copy {
          color: #45336B;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .copy.small { font-size: 12px; color: #9D85B3; }
        .copy a { color: #CD50F1; font-weight: 600; }
      `}</style>
    </div>
  );
}
