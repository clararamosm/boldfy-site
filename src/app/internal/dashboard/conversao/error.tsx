'use client';

import { useEffect } from 'react';

export default function ConversaoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[conversao] render error:', error); }, [error]);
  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Conversão — erro no render</h1>
        </div>
      </div>
      <div className="dash-card">
        <div className="dash-card-title" style={{ color: '#EE5A52' }}>❌ Erro server-side</div>
        <div style={{ padding: 14, background: 'rgba(238, 90, 82, 0.06)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#5E2A67' }}>
          <div><strong>Message:</strong> {error.message}</div>
          {error.digest ? <div style={{ marginTop: 8 }}><strong>Digest:</strong> <code>{error.digest}</code></div> : null}
          {error.stack ? <pre style={{ marginTop: 10, fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#9D85B3' }}>{error.stack}</pre> : null}
        </div>
        <div style={{ marginTop: 14 }}>
          <button onClick={reset} className="crm-btn crm-btn-primary">Tentar de novo</button>
        </div>
      </div>
    </div>
  );
}
