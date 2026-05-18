/**
 * Modal pra cadastrar/editar artigo de Mídia & RP.
 *
 * Compartilhado entre criar e editar (Mode discriminator).
 * Reusa o mesmo padrão visual do CampaignFormModal (campanha-modal-*).
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import type { PrArticle } from '@/db';
import { createPrArticle, updatePrArticle, deletePrArticle, type ArticleInput } from './article-actions';

type Mode = { kind: 'create' } | { kind: 'edit'; article: PrArticle };

export function ArticleFormModal({
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

  const initial = mode.kind === 'edit' ? mode.article : null;
  const initialDate = initial?.publishedAt
    ? new Date(initial.publishedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(initial?.title ?? '');
  const [publishedAt, setPublishedAt] = useState(initialDate);
  const [articleUrl, setArticleUrl] = useState(initial?.articleUrl ?? '');
  const [outlet, setOutlet] = useState(initial?.outlet ?? '');
  const [utmCampaign, setUtmCampaign] = useState(initial?.utmCampaign ?? '');
  const [shortlinkCode, setShortlinkCode] = useState(initial?.shortlinkCode ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ArticleInput = {
      title: title.trim(),
      publishedAt,
      articleUrl: articleUrl.trim() || undefined,
      outlet: outlet.trim() || undefined,
      utmCampaign: utmCampaign.trim() || undefined,
      shortlinkCode: shortlinkCode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      const result = mode.kind === 'create'
        ? await createPrArticle(input)
        : await updatePrArticle(mode.article.id, input);
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
    if (!window.confirm(`Apagar artigo "${mode.article.title}"? Não pode desfazer.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePrArticle(mode.article.id);
      if (!result.ok) {
        setError(result.error ?? 'Falha ao apagar');
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
          <h2>{mode.kind === 'create' ? 'Novo artigo de PR' : `Editar: ${initial?.title}`}</h2>
          <button type="button" onClick={() => !isPending && onClose()} className="campanha-modal-close" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="campanha-modal-form">
          <label>
            <span>Título do artigo *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Boldfy lança plataforma de Employee Advocacy" required />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span>Veículo</span>
              <input value={outlet} onChange={(e) => setOutlet(e.target.value)} placeholder="ex: InfoMoney, Exame, Tech Crunch" />
            </label>
            <label>
              <span>Data de publicação *</span>
              <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} required />
            </label>
          </div>

          <label>
            <span>URL da matéria <span style={{ color: '#9D85B3', fontWeight: 400 }}>(no veículo)</span></span>
            <input type="url" value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} placeholder="https://infomoney.com.br/..." />
          </label>

          <label>
            <span>utm_campaign <span style={{ color: '#9D85B3', fontWeight: 400 }}>(do link que você passou pro jornalista)</span></span>
            <input
              value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="ex: artigo-employee-led-growth-mai26"
              pattern="[a-z0-9\-]*"
            />
            <small style={{ color: '#9D85B3', fontSize: 11, marginTop: 4, display: 'block' }}>
              Use o mesmo valor do utm_campaign que você gerou em /internal/utm. É por aqui que o GA4 cruza.
            </small>
          </label>

          <label>
            <span>Shortlink code <span style={{ color: '#9D85B3', fontWeight: 400 }}>(opcional)</span></span>
            <input value={shortlinkCode} onChange={(e) => setShortlinkCode(e.target.value)} placeholder="ex: HAXaCN (parte depois de /l/)" />
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
              >
                <Trash2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> Apagar
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => !isPending && onClose()} className="crm-btn" disabled={isPending}>Cancelar</button>
              <button type="submit" className="crm-btn crm-btn-primary" disabled={isPending}>
                {isPending ? 'Salvando...' : (mode.kind === 'create' ? 'Cadastrar' : 'Salvar')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
