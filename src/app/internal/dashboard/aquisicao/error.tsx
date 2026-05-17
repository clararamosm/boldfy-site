/**
 * Error boundary específico de /aquisicao. Em production o Next só mostra
 * mensagem genérica + digest hash — mas o digest correlaciona com logs do
 * Vercel runtime. Aqui exibimos pra debug.
 *
 * Em dev, `error.message` mostra a real exception.
 */

'use client';

import { useEffect } from 'react';

export default function AquisicaoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[aquisicao] render error:', error);
  }, [error]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Aquisição — erro no render</h1>
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
