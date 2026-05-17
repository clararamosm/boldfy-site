'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importFromAC } from './actions';

type Result =
  | {
      ok: true;
      imported: number;
      updated: number;
      errors: number;
      activitiesCreated: number;
      bySegment: {
        liderB2B: number;
        parceiro: number;
        profissionalIndividual: number;
        newsletterOnly: number;
        semSegmento: number;
      };
    }
  | { ok: false; error: string }
  | null;

// Estimativa: ~10s por lead (4 calls de API + sleep). Pra 160 leads = ~27 min.
const ESTIMATED_SECONDS = 1600;

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
    if (!confirm('Importar TODOS os contatos do AC pro nosso CRM (sem filtro de segmento)? Pode demorar ~25 min pra 160 leads. NÃO feche a aba durante.')) return;
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
            Pra cada lead: puxa custom fields, tags, email events (opens/clicks),
            page views (VGO) e cria activities datadas (1 por form preenchido).
            Score se reconstrói automático. Kanban filtra só Líderes B2B; aba
            Formulários mostra todos os segmentos.
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
            <li><strong>{result.imported}</strong> contatos novos no CRM</li>
            <li><strong>{result.updated}</strong> atualizados (já existiam, refresh com dados novos)</li>
            <li><strong>{result.activitiesCreated}</strong> activities criadas (forms + emails + page views = timeline reconstruída)</li>
            {result.errors > 0 ? <li><strong>{result.errors}</strong> erros (ver logs Vercel)</li> : null}
          </ul>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(6, 107, 77, 0.15)' }}>
            <strong style={{ fontSize: 12 }}>Por segmento:</strong>
            <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 12 }}>
              <li>Líder B2B: <strong>{result.bySegment.liderB2B}</strong> (vão pro kanban)</li>
              <li>Parceiro: <strong>{result.bySegment.parceiro}</strong></li>
              <li>Profissional Individual: <strong>{result.bySegment.profissionalIndividual}</strong></li>
              <li>Só newsletter: <strong>{result.bySegment.newsletterOnly}</strong></li>
              <li>Sem segmento: <strong>{result.bySegment.semSegmento}</strong></li>
            </ul>
          </div>
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
