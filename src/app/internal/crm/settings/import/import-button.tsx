'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importFromAC } from './actions';

type Result =
  | { ok: true; imported: number; updated: number; skippedNotB2B: number; errors: number; activitiesCreated: number }
  | { ok: false; error: string }
  | null;

// Estimativa: ~6s por lead (4 calls de API + sleep). Pra 150 leads = ~15 min.
const ESTIMATED_SECONDS = 900;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function ImportButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  // Timer enquanto pending — setState no effect é necessário (UX de contagem
  // de segundos em tempo real). Não tem como modelar isso sem o sync setState.
  useEffect(() => {
    if (!pending) {
      startedAt.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset do timer
      setElapsed(0);
      return;
    }
    startedAt.current = Date.now();
    const interval = setInterval(() => {
      if (startedAt.current) {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pending]);

  // Aviso pra não fechar a aba durante o import
  useEffect(() => {
    if (!pending) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pending]);

  function handleImport() {
    if (!confirm('Importar todos os contatos do AC pro nosso CRM? Pode demorar ~15 min pra 150 leads. NÃO feche a aba durante.')) return;
    setResult(null);
    startTransition(async () => {
      const r = await importFromAC();
      setResult(r);
      router.refresh();
    });
  }

  const progress = Math.min((elapsed / ESTIMATED_SECONDS) * 100, 99);
  const remaining = Math.max(ESTIMATED_SECONDS - elapsed, 0);

  return (
    <div>
      <button onClick={handleImport} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Importando…' : '↓ Importar tudo do AC'}
      </button>

      {pending ? (
        <div style={{ marginTop: 16, padding: 16, background: '#FAF7FF', border: '1px solid #E4D8ED', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="loader-spinner" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#5E2A67' }}>
                Importando do AC… NÃO feche a aba.
              </div>
              <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 2 }}>
                Decorrido: <strong>{formatElapsed(elapsed)}</strong>
                {' · '}
                Estimativa total: ~{formatElapsed(ESTIMATED_SECONDS)}
                {' · '}
                Restante aprox.: {formatElapsed(remaining)}
              </div>
            </div>
          </div>
          <div style={{ height: 6, background: '#E4D8ED', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #CD50F1, #E875FF)',
                transition: 'width 1s linear',
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 8, lineHeight: 1.5 }}>
            Pra cada lead B2B: puxa custom fields, tags, email events (opens/clicks),
            page views (VGO) e cria activities datadas. Score se reconstrói automático
            a partir das activities importadas.
          </div>

          <style>{`
            .loader-spinner {
              width: 28px;
              height: 28px;
              border: 3px solid #E4D8ED;
              border-top-color: #CD50F1;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              flex-shrink: 0;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : null}

      {result && result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13 }}>
          <strong>✓ Importação enriquecida concluída.</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            <li><strong>{result.imported}</strong> líderes B2B novos no CRM</li>
            <li><strong>{result.updated}</strong> atualizados (já existiam, refresh com dados novos)</li>
            <li><strong>{result.skippedNotB2B}</strong> não-B2B pulados (continuam só no AC)</li>
            <li><strong>{result.activitiesCreated}</strong> activities criadas (forms + emails + page views = timeline reconstruída)</li>
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
