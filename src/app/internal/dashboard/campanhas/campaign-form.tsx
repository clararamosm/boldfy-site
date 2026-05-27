/**
 * Form de campanha (modal). Compartilhado entre criar e editar.
 *
 * Sempre-on = checkbox que desabilita a data de fim.
 *
 * Mai/2026 (Clara): removido o setup manual de canais e touchpoints. Antes
 * a Clara cadastrava na mão "LinkedIn → 2 touchpoints", "Email → 1", etc.
 * Agora os canais aparecem automaticamente na visualização da campanha,
 * agrupados pelo utm_source dos UTMs criados em /internal/utm. Editor
 * cuida só dos campos editoriais (nome, slug, objetivo, janela, notas).
 * Coluna campaigns.channels (jsonb) mantida pra back-compat com dados
 * antigos — sempre escrita como [] daqui pra frente.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import type { Campaign, CampaignInput } from '@/lib/campaigns';
import { createCampaignAction, updateCampaignAction, deleteCampaignAction } from './actions';

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
      // channels é coluna legada — daqui pra frente sempre [] (canais vêm
      // dos utm_links automaticamente na visualização da campanha).
      channels: [],
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

  function handleDelete() {
    if (mode.kind !== 'edit') return;
    const confirmed = window.confirm(
      `Apagar campanha "${mode.campaign.name}"?\n\n` +
      `Os leads e UTMs que apontam pra ela NÃO são apagados — só o registro da campanha.\n\n` +
      `Essa ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCampaignAction(mode.campaign.id);
      if (!result.ok) {
        setError(result.error ?? 'Falha ao apagar');
        return;
      }
      onClose();
      // Volta pra lista (sai do drill-down se estiver nele)
      router.push('/internal/dashboard/campanhas');
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

          {/* Canais e touchpoints removidos (mai/2026 — Clara): agora vêm
              automaticamente do utm_source dos UTMs criados em /internal/utm.
              Editor cuida só dos campos editoriais. */}

          <label>
            <span>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Opcional · contexto adicional" />
          </label>

          {error ? (
            <div style={{ padding: 10, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 8, color: '#C0392B', fontSize: 12 }}>
              ❌ {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {mode.kind === 'edit' ? (
              <button
                type="button" onClick={handleDelete} disabled={isPending}
                style={{
                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  color: '#C0392B', background: 'transparent',
                  border: '1px solid rgba(192, 57, 43, 0.25)', borderRadius: 8,
                  cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
                title="Apagar campanha"
              >
                <Trash2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Apagar campanha
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => !isPending && onClose()} className="crm-btn" disabled={isPending}>Cancelar</button>
              <button type="submit" className="crm-btn crm-btn-primary" disabled={isPending}>
                {isPending ? 'Salvando...' : (mode.kind === 'create' ? 'Criar campanha' : 'Salvar mudanças')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
