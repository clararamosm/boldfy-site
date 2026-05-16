'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importFromFolk } from './actions';

type Result = {
  ok: true;
  importedPeople: number;
  updatedPeople: number;
  importedCompanies: number;
  updatedCompanies: number;
  errors: number;
} | { ok: false; error: string } | null;

// ~3s por entidade. 150 Persons + 50 Companies = ~10 min.
const ESTIMATED_SECONDS = 600;

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}m ${(s % 60).toString().padStart(2, '0')}s`;
}

export function ImportFolkButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!pending) { startedAt.current = null; setElapsed(0); return; }
    startedAt.current = Date.now();
    const i = setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pending]);

  function handleImport() {
    if (!confirm('Importar Persons + Companies do Folk pro nosso CRM? Pode demorar ~10 min. NÃO feche a aba.')) return;
    setResult(null);
    startTransition(async () => {
      const r = await importFromFolk();
      setResult(r);
      router.refresh();
    });
  }

  const progress = Math.min((elapsed / ESTIMATED_SECONDS) * 100, 99);
  const remaining = Math.max(ESTIMATED_SECONDS - elapsed, 0);

  return (
    <div>
      <button onClick={handleImport} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Importando…' : '↓ Importar tudo do Folk'}
      </button>

      {pending ? (
        <div style={{ marginTop: 16, padding: 16, background: '#FAF7FF', border: '1px solid #E4D8ED', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="loader-spinner" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#5E2A67' }}>
                Importando do Folk… NÃO feche a aba.
              </div>
              <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 2 }}>
                Decorrido: <strong>{formatElapsed(elapsed)}</strong>
                {' · '}
                Estimativa: ~{formatElapsed(ESTIMATED_SECONDS)}
                {' · '}
                Restante aprox.: {formatElapsed(remaining)}
              </div>
            </div>
          </div>
          <div style={{ height: 6, background: '#E4D8ED', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #CD50F1, #E875FF)',
              transition: 'width 1s linear',
              borderRadius: 999,
            }} />
          </div>
          <style>{`
            .loader-spinner {
              width: 28px; height: 28px;
              border: 3px solid #E4D8ED;
              border-top-color: #CD50F1;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              flex-shrink: 0;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : null}

      {result && result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13 }}>
          <strong>✓ Importação do Folk concluída.</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            <li><strong>{result.importedPeople}</strong> Persons novos · <strong>{result.updatedPeople}</strong> atualizados</li>
            <li><strong>{result.importedCompanies}</strong> Companies novas · <strong>{result.updatedCompanies}</strong> atualizadas</li>
            {result.errors > 0 ? <li><strong>{result.errors}</strong> erros (ver logs Vercel)</li> : null}
          </ul>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 10, color: '#C0392B', fontSize: 13 }}>
          <strong>Erro:</strong> {result.error}
        </div>
      ) : null}
    </div>
  );
}
