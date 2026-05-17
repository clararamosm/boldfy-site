/**
 * Error boundary compartilhado entre as pages do dashboard.
 * Usado pelas `error.tsx` de /aquisicao e /conversao.
 */

'use client';

import { useEffect } from 'react';

export function DashboardError({
  scope,
  error,
  reset,
}: {
  scope: string;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(`[${scope}] render error:`, error);
  }, [scope, error]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{scope} — erro no render</h1>
          <p className="dash-subtitle">Algo quebrou ao montar a página</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title" style={{ color: '#EE5A52' }}>❌ Erro server-side</div>
        <div style={{ padding: 14, background: 'rgba(238, 90, 82, 0.06)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#5E2A67' }}>
          <div><strong>Message:</strong> {error.message}</div>
          {error.digest ? (
            <div style={{ marginTop: 8 }}>
              <strong>Digest:</strong> <code>{error.digest}</code>
              <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 4 }}>
                Procura esse digest nos logs do Vercel pra ver stack trace completo.
              </div>
            </div>
          ) : null}
          {error.stack ? (
            <pre style={{ marginTop: 10, fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#9D85B3' }}>
              {error.stack}
            </pre>
          ) : null}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button onClick={reset} className="crm-btn crm-btn-primary">Tentar de novo</button>
          <a href="/internal/dashboard/debug/queries" className="crm-btn">Ver debug de queries</a>
        </div>
      </div>
    </div>
  );
}
