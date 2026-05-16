/**
 * Tag Manager interativo — usado no Lead Detail sidebar.
 *
 * Lista tags atuais (chips com X pra remover), input com autocomplete pra
 * adicionar. Tudo escreve diretamente no AC via server actions.
 *
 * Tags do AC = canal pra disparar automations (cadências, listas, emails).
 */

'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import {
  addTagToPerson,
  removeTagFromPerson,
  listAvailableTags,
  fetchPersonTags,
} from '@/app/internal/crm/people/[id]/tag-actions';

type Props = {
  personId: string;
  initialTags: string[];
};

export function TagManager({ personId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Lazy load lista completa de tags na primeira interação
  useEffect(() => {
    if (showSuggestions && allTags.length === 0) {
      listAvailableTags().then((res) => {
        if (res.ok && res.data) setAllTags(res.data);
      });
    }
  }, [showSuggestions, allTags.length]);

  // Fecha autocomplete ao clicar fora
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleAdd(tagName: string) {
    const trimmed = tagName.trim();
    if (trimmed.length === 0 || tags.includes(trimmed)) return;
    setError(null);
    setQuery('');
    setShowSuggestions(false);
    startTransition(async () => {
      const res = await addTagToPerson(personId, trimmed);
      if (res.ok && res.data) {
        setTags(res.data);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  function handleRemove(tagName: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeTagFromPerson(personId, tagName);
      if (res.ok && res.data) {
        setTags(res.data);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      const res = await fetchPersonTags(personId);
      if (res.ok && res.data) setTags(res.data);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim().length > 0) {
      e.preventDefault();
      handleAdd(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  const suggestions = query.trim().length > 0
    ? allTags
        .filter((t) => t.toLowerCase().includes(query.toLowerCase()) && !tags.includes(t))
        .slice(0, 6)
    : [];

  const exactMatch = allTags.some((t) => t.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={wrapRef}>
      <div className="tm-tags">
        {tags.length === 0 ? (
          <div className="tm-empty">Sem tags. Adicione abaixo pra disparar automations no AC.</div>
        ) : (
          tags.map((tag) => (
            <span key={tag} className="tm-chip">
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={pending}
                className="tm-chip-x"
                title="Remover tag"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="tm-input-wrap">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar ou criar tag…"
          disabled={pending}
          className="tm-input"
        />
        <button type="button" onClick={handleRefresh} disabled={pending} className="tm-refresh" title="Atualizar do AC">
          ↻
        </button>

        {showSuggestions && (suggestions.length > 0 || (query.trim() && !exactMatch)) ? (
          <div className="tm-suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => handleAdd(s)} className="tm-suggestion">
                {s}
              </button>
            ))}
            {query.trim() && !exactMatch ? (
              <button type="button" onClick={() => handleAdd(query)} className="tm-suggestion tm-create">
                + Criar &ldquo;{query.trim()}&rdquo;
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="tm-error">{error}</p> : null}

      <style>{`
        .tm-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
          min-height: 20px;
        }
        .tm-empty {
          font-size: 11px;
          color: #9D85B3;
          font-style: italic;
        }
        .tm-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 4px 4px 9px;
          font-size: 10px;
          font-weight: 600;
          background: #F7EEFC;
          color: #7E3FA6;
          border-radius: 999px;
        }
        .tm-chip-x {
          background: transparent;
          border: none;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          cursor: pointer;
          color: #9D85B3;
          font-size: 13px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }
        .tm-chip-x:hover {
          background: rgba(205, 80, 241, 0.15);
          color: #CD50F1;
        }
        .tm-input-wrap {
          position: relative;
          display: flex;
          gap: 6px;
        }
        .tm-input {
          flex: 1;
          padding: 7px 10px;
          border: 1px solid #E4D8ED;
          border-radius: 8px;
          font-family: inherit;
          font-size: 12px;
          color: #45336B;
          background: #FFFFFF;
        }
        .tm-input:focus {
          outline: none;
          border-color: #CD50F1;
        }
        .tm-refresh {
          background: transparent;
          border: 1px solid #E4D8ED;
          width: 30px;
          border-radius: 8px;
          cursor: pointer;
          color: #9D85B3;
          font-size: 14px;
        }
        .tm-refresh:hover { color: #CD50F1; border-color: #CD50F1; }
        .tm-suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 10px;
          box-shadow: 0 12px 32px rgba(93, 42, 103, 0.12);
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
        }
        .tm-suggestion {
          width: 100%;
          background: transparent;
          border: none;
          padding: 8px 12px;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          color: #45336B;
          cursor: pointer;
          border-bottom: 1px solid #F7EEFC;
        }
        .tm-suggestion:hover {
          background: #F7EEFC;
          color: #CD50F1;
        }
        .tm-suggestion.tm-create {
          color: #CD50F1;
          font-weight: 700;
        }
        .tm-error {
          color: #C0392B;
          font-size: 11px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
