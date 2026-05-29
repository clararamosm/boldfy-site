/**
 * Cmd+K busca global do CRM.
 *
 * Atalhos:
 *   ⌘K (Mac) / Ctrl+K (Win) — abre/fecha
 *   ESC — fecha
 *   ↑↓ — navega resultados
 *   Enter — abre o lead/empresa selecionado
 *
 * Debounce 150ms na query.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchCrm, type SearchHit } from '@/app/internal/crm/search-action';

export function CmdK() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHits([]);
    setSelectedIdx(0);
  }, []);

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  // Foca input quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      // Defer state updates pra próximo tick — evita "set state in effect" lint
      const t = setTimeout(() => {
        setHits([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    const loadingT = setTimeout(() => setLoading(true), 0);

    debounceRef.current = setTimeout(async () => {
      const results = await searchCrm(query);
      setHits(results);
      setSelectedIdx(0);
      setLoading(false);
    }, 150);

    return () => {
      clearTimeout(loadingT);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && hits[selectedIdx]) {
      e.preventDefault();
      navigateTo(hits[selectedIdx]);
    }
  }

  function navigateTo(hit: SearchHit) {
    const href = hit.kind === 'person'
      ? `/internal/crm/people/${hit.id}`
      : `/internal/crm/companies/${hit.id}`;
    handleClose();
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={handleClose}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-wrap">
          <span className="cmdk-icon">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar pessoas e empresas…"
            className="cmdk-input"
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>

        <div className="cmdk-results">
          {loading ? (
            <div className="cmdk-empty">buscando…</div>
          ) : query.trim().length < 2 ? (
            <div className="cmdk-empty">digite ao menos 2 caracteres</div>
          ) : hits.length === 0 ? (
            <div className="cmdk-empty">nenhum resultado pra &ldquo;{query}&rdquo;</div>
          ) : (
            hits.map((hit, idx) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                onClick={() => navigateTo(hit)}
                onMouseEnter={() => setSelectedIdx(idx)}
                className={`cmdk-hit ${idx === selectedIdx ? 'selected' : ''}`}
              >
                <span className="cmdk-hit-kind">{hit.kind === 'person' ? '👤' : '🏢'}</span>
                <div className="cmdk-hit-info">
                  <div className="cmdk-hit-title">{hit.name}</div>
                  <div className="cmdk-hit-meta">
                    {hit.kind === 'person' ? (
                      <>
                        {hit.email ?? <span style={{ opacity: 0.5 }}>sem email</span>}
                        {hit.jobTitle ? ` · ${hit.jobTitle}` : ''}
                        {hit.companyName ? ` · ${hit.companyName}` : ''}
                      </>
                    ) : (
                      hit.industry ?? 'empresa'
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="cmdk-footer">
          <span>↑↓ navega · Enter abre · ⌘K fecha</span>
        </div>
      </div>

      <style>{`
        .cmdk-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 10, 24, 0.5);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 12vh;
          animation: cmdk-fade 0.15s ease;
        }
        @keyframes cmdk-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cmdk-modal {
          width: 100%;
          max-width: 560px;
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(15, 10, 24, 0.25);
          overflow: hidden;
          margin: 0 16px;
        }
        .cmdk-input-wrap {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #E4D8ED;
          gap: 12px;
        }
        .cmdk-icon { font-size: 16px; }
        .cmdk-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 15px;
          color: #45336B;
          background: transparent;
        }
        .cmdk-input::placeholder { color: #9D85B3; }
        .cmdk-esc {
          background: #F7EEFC;
          color: #9D85B3;
          font-size: 10px;
          padding: 3px 7px;
          border-radius: 4px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .cmdk-results {
          max-height: 50vh;
          overflow-y: auto;
        }
        .cmdk-empty {
          padding: 24px;
          text-align: center;
          color: #9D85B3;
          font-size: 13px;
        }
        .cmdk-hit {
          width: 100%;
          background: transparent;
          border: none;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          border-bottom: 1px solid #F7EEFC;
        }
        .cmdk-hit.selected {
          background: #F7EEFC;
        }
        .cmdk-hit-kind {
          font-size: 18px;
          flex-shrink: 0;
        }
        .cmdk-hit-info { flex: 1; min-width: 0; }
        .cmdk-hit-title {
          font-weight: 700;
          color: #5E2A67;
          font-size: 14px;
        }
        .cmdk-hit-meta {
          font-size: 11px;
          color: #9D85B3;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cmdk-footer {
          padding: 10px 18px;
          background: #FAF7FF;
          font-size: 10px;
          color: #9D85B3;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
