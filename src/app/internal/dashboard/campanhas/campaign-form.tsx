/**
 * Form de campanha (modal). Compartilhado entre criar e editar.
 *
 * Schema rico: cada canal tem N touchpoints (URL + label opcional).
 * Sempre on = checkbox que desabilita a data de fim.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Trash2, Link as LinkIcon } from 'lucide-react';
import type { Campaign, CampaignInput, ChannelEntry } from '@/lib/campaigns';
import { createCampaignAction, updateCampaignAction } from './actions';

const CHANNEL_OPTIONS = ['SEO', 'LinkedIn', 'Eventos', 'PR', 'Email', 'Ads', 'Indicação', 'Outros'];

type Mode = { kind: 'create' } | { kind: 'edit'; campaign: Campaign };

export function CampaignFormModal({
  mode,
  open,
  onClose,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = mode.kind === 'edit' ? mode.campaign : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [alwaysOn, setAlwaysOn] = useState(initial?.alwaysOn ?? false);
  const [channels, setChannels] = useState<ChannelEntry[]>(initial?.channels ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function autoSlug(value: string) {
    setName(value);
    if (mode.kind === 'create' && !slug) {
      const auto = value.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setSlug(auto);
    }
  }

  function addChannel(name: string) {
    if (channels.some((c) => c.name === name)) return; // já existe
    setChannels([...channels, { name, touchpoints: [{ url: '', label: '' }] }]);
  }

  function removeChannel(idx: number) {
    setChannels(channels.filter((_, i) => i !== idx));
  }

  function addTouchpoint(channelIdx: number) {
    setChannels(channels.map((c, i) =>
      i === channelIdx ? { ...c, touchpoints: [...c.touchpoints, { url: '', label: '' }] } : c
    ));
  }

  function updateTouchpoint(channelIdx: number, tpIdx: number, field: 'url' | 'label', value: string) {
    setChannels(channels.map((c, i) =>
      i === channelIdx
        ? { ...c, touchpoints: c.touchpoints.map((t, ti) => ti === tpIdx ? { ...t, [field]: value } : t) }
        : c
    ));
  }

  function removeTouchpoint(channelIdx: number, tpIdx: number) {
    setChannels(channels.map((c, i) =>
      i === channelIdx
        ? { ...c, touchpoints: c.touchpoints.filter((_, ti) => ti !== tpIdx) }
        : c
    ));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: CampaignInput = {
      slug: slug.trim(),
      name: name.trim(),
      objective: objective.trim(),
      startDate,
      endDate: alwaysOn ? null : (endDate || null),
      alwaysOn,
      channels,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      const result = mode.kind === 'create'
        ? await createCampaignAction(input)
        : await updateCampaignAction(mode.campaign.id, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  if (!open) return null;

  return (
    <div className="campanha-modal-backdrop" onClick={() => !isPending && onClose()}>
      <div className="campanha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="campanha-modal-header">
          <h2>{mode.kind === 'create' ? 'Nova campanha' : `Editar: ${initial?.name}`}</h2>
          <button type="button" onClick={() => !isPending && onClose()} className="campanha-modal-close" aria-label="Fechar">
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
            <small>kebab-case · vai pro utm_campaign de todos os links da campanha</small>
          </label>

          <label>
            <span>Objetivo</span>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} required placeholder="O que essa campanha precisa entregar?" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: alwaysOn ? '1fr' : '1fr 1fr', gap: 12, alignItems: 'flex-end' }}>
            <label>
              <span>Início</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            {!alwaysOn ? (
              <label>
                <span>Fim</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required={!alwaysOn} />
              </label>
            ) : null}
          </div>

          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={alwaysOn} onChange={(e) => setAlwaysOn(e.target.checked)} style={{ width: 'auto' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#45336B' }}>Always-on (sem data de fim)</span>
          </label>

          {/* Canais + touchpoints */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#45336B' }}>Canais e touchpoints</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {CHANNEL_OPTIONS.map((c) => {
                const already = channels.some((x) => x.name === c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addChannel(c)}
                    className={`channel-chip ${already ? 'active' : ''}`}
                    disabled={already}
                  >
                    {already ? '✓ ' : '+ '}{c}
                  </button>
                );
              })}
            </div>

            {channels.length === 0 ? (
              <div style={{ padding: 14, background: '#FAF7FF', borderRadius: 8, fontSize: 12, color: '#9D85B3', textAlign: 'center' }}>
                Clica num canal acima pra adicionar
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {channels.map((c, ci) => (
                  <div key={ci} style={{ border: '1px solid #E4D8ED', borderRadius: 10, padding: 12, background: '#FAF7FF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: 13, color: '#5E2A67' }}>{c.name}</strong>
                      <button type="button" onClick={() => removeChannel(ci)} className="touchpoint-remove" aria-label="Remover canal" title="Remover canal">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {c.touchpoints.map((tp, ti) => (
                      <div key={ti} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                        <LinkIcon size={13} color="#9D85B3" />
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4 }}>
                          <input
                            type="url"
                            value={tp.url}
                            onChange={(e) => updateTouchpoint(ci, ti, 'url', e.target.value)}
                            placeholder="https://... ou /l/shortlink"
                            style={{ padding: '6px 8px', fontSize: 12 }}
                          />
                          <input
                            type="text"
                            value={tp.label ?? ''}
                            onChange={(e) => updateTouchpoint(ci, ti, 'label', e.target.value)}
                            placeholder="label (opc)"
                            style={{ padding: '6px 8px', fontSize: 12 }}
                          />
                        </div>
                        <button type="button" onClick={() => removeTouchpoint(ci, ti)} className="touchpoint-remove" aria-label="Remover touchpoint">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTouchpoint(ci)}
                      style={{ marginTop: 4, padding: '5px 10px', fontSize: 11, color: '#CD50F1', background: 'transparent', border: '1px dashed #CD50F1', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                    >
                      <Plus size={11} style={{ verticalAlign: -2 }} /> Touchpoint
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
            <button type="button" onClick={() => !isPending && onClose()} className="crm-btn" disabled={isPending}>Cancelar</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={isPending}>
              {isPending ? 'Salvando...' : (mode.kind === 'create' ? 'Criar campanha' : 'Salvar mudanças')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
