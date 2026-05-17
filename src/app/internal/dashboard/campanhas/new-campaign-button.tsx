/**
 * Botão "Nova campanha" + modal com form. Client component.
 * Chama server action createCampaignAction; em sucesso, fecha + dá refresh.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createCampaignAction } from './actions';

const CHANNEL_OPTIONS = ['SEO', 'LinkedIn', 'Eventos', 'PR', 'Email', 'Ads', 'Indicação', 'Outros'];

export function NewCampaignButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [objective, setObjective] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [shortlinks, setShortlinks] = useState('');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setName(''); setSlug(''); setObjective('');
    setStartDate(''); setEndDate('');
    setChannels([]); setShortlinks(''); setNotes('');
    setError(null);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!slug) {
      const auto = value.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setSlug(auto);
    }
  }

  function toggleChannel(c: string) {
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCampaignAction({
        slug: slug.trim(),
        name: name.trim(),
        objective: objective.trim(),
        startDate, endDate,
        channels,
        shortlinks: shortlinks.split(',').map((s) => s.trim()).filter(Boolean),
        notes: notes.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="crm-btn crm-btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        onClick={() => setOpen(true)}
      >
        <Plus size={14} /> Nova campanha
      </button>

      {open ? (
        <div className="campanha-modal-backdrop" onClick={() => !isPending && setOpen(false)}>
          <div className="campanha-modal" onClick={(e) => e.stopPropagation()}>
            <div className="campanha-modal-header">
              <h2>Nova campanha</h2>
              <button type="button" onClick={() => !isPending && setOpen(false)} className="campanha-modal-close" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="campanha-modal-form">
              <label>
                <span>Nome</span>
                <input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="ex: Lançamento Boldfy Q3" required />
              </label>

              <label>
                <span>Slug (= utm_campaign)</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: lancamento-boldfy-q3" required pattern="[a-z0-9-]+" />
                <small>Use kebab-case · esse valor vai pro utm_campaign dos links</small>
              </label>

              <label>
                <span>Objetivo (1-2 linhas)</span>
                <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} required placeholder="O que essa campanha precisa entregar?" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span>Início</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </label>
                <label>
                  <span>Fim</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </label>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#45336B', display: 'block', marginBottom: 6 }}>Canais</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CHANNEL_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`channel-chip ${channels.includes(c) ? 'active' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                <span>Shortlinks (separados por vírgula)</span>
                <input value={shortlinks} onChange={(e) => setShortlinks(e.target.value)} placeholder="ws-card, ws-keynote" />
                <small>Opcional · códigos /l/[code] vinculados à campanha</small>
              </label>

              <label>
                <span>Notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Opcional · contexto adicional" />
              </label>

              {error ? (
                <div style={{ padding: 10, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 8, color: '#C0392B', fontSize: 12 }}>
                  ❌ {error}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => !isPending && setOpen(false)} className="crm-btn" disabled={isPending}>Cancelar</button>
                <button type="submit" className="crm-btn crm-btn-primary" disabled={isPending}>
                  {isPending ? 'Criando...' : 'Criar campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
