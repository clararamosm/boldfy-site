/**
 * StatusManager — UI de CRUD pra uma das kinds (person ou company).
 *
 * Features:
 *  - Lista os statuses ordenados, com cor, label, threshold (só person)
 *  - Drag-drop nativo pra reordenar (salva sort_order em batch)
 *  - Edit inline (label, cor, threshold, terminal)
 *  - Botões: marcar como default, deletar
 *  - Form pra criar novo no final da lista
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Status } from '@/db';
import {
  createStatus,
  updateStatus,
  deleteStatus,
  setStatusAsDefault,
  reorderStatuses,
} from './actions';

const COLOR_OPTIONS: Array<{ value: string; label: string; hex: string }> = [
  { value: 'neutral', label: 'Cinza claro', hex: '#6B5B8A' },
  { value: 'gray', label: 'Cinza', hex: '#9D85B3' },
  { value: 'blue', label: 'Azul', hex: '#3B82F6' },
  { value: 'purple', label: 'Roxo', hex: '#CD50F1' },
  { value: 'amber', label: 'Âmbar', hex: '#F59E0B' },
  { value: 'orange', label: 'Laranja', hex: '#F97316' },
  { value: 'green', label: 'Verde', hex: '#10B981' },
  { value: 'pink', label: 'Rosa', hex: '#EC4899' },
];

type Props = { kind: 'person' | 'company'; statuses: Status[] };

export function StatusManager({ kind, statuses: initial }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, idx: number) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'status-row', from: idx }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, toIdx: number) {
    e.preventDefault();
    setDragOverIdx(null);

    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    let payload: { kind: string; from: number };
    try { payload = JSON.parse(raw); } catch { return; }
    if (payload.kind !== 'status-row') return;
    if (payload.from === toIdx) return;

    // Reordena no estado local
    const newItems = [...items];
    const [moved] = newItems.splice(payload.from, 1);
    newItems.splice(toIdx, 0, moved);
    setItems(newItems);

    // Persiste em batch
    startTransition(async () => {
      const res = await reorderStatuses(kind, newItems.map((s) => s.id));
      if (!res.ok) {
        alert(`Erro ao reordenar: ${res.error}`);
        setItems(initial); // rollback
      }
      router.refresh();
    });
  }

  async function handleCreate(formData: FormData) {
    formData.set('kind', kind);
    const res = await createStatus(formData);
    if (!res.ok) {
      alert(`Erro: ${res.error}`);
      return;
    }
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    const res = await updateStatus(formData);
    if (!res.ok) {
      alert(`Erro: ${res.error}`);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Apagar status "${label}"?`)) return;
    const res = await deleteStatus(id);
    if (!res.ok) {
      alert(`Erro: ${res.error}`);
      return;
    }
    router.refresh();
  }

  async function handleSetDefault(id: string) {
    const res = await setStatusAsDefault(id);
    if (!res.ok) {
      alert(`Erro: ${res.error}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="crm-settings-section">
      <h2 className="crm-settings-h2">
        {kind === 'person' ? '👤 Pessoas' : '🏢 Empresas'}
        <span className="crm-settings-meta">{items.length} colunas</span>
      </h2>

      <div className="crm-settings-list">
        {items.map((s, idx) => {
          const isEditing = editingId === s.id;
          const isDragOver = dragOverIdx === idx;
          return (
            <div
              key={s.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={(e) => handleDrop(e, idx)}
              className={`crm-settings-row ${isDragOver ? 'dragover' : ''}`}
            >
              <span className="crm-settings-drag" aria-hidden>⋮⋮</span>

              {isEditing ? (
                <form action={handleUpdate} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                  <input type="hidden" name="id" value={s.id} />

                  <input
                    name="label"
                    defaultValue={s.label}
                    required
                    maxLength={60}
                    style={{ flex: 1, minWidth: 140, padding: '6px 10px', border: '1px solid #E4D8ED', borderRadius: 6, fontSize: 13 }}
                  />

                  <select
                    name="color"
                    defaultValue={s.color ?? 'neutral'}
                    style={{ padding: '6px 10px', border: '1px solid #E4D8ED', borderRadius: 6, fontSize: 12 }}
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  {kind === 'person' ? (
                    <input
                      name="scoreThresholdMin"
                      type="number"
                      min="0"
                      placeholder="threshold"
                      defaultValue={s.scoreThresholdMin ?? ''}
                      style={{ width: 90, padding: '6px 10px', border: '1px solid #E4D8ED', borderRadius: 6, fontSize: 12 }}
                    />
                  ) : null}

                  <label style={{ fontSize: 11, color: '#9D85B3', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="checkbox" name="isTerminal" defaultChecked={s.isTerminal} />
                    terminal
                  </label>

                  <button type="submit" className="crm-btn crm-btn-primary" style={{ padding: '6px 12px' }}>Salvar</button>
                  <button type="button" onClick={() => setEditingId(null)} className="crm-btn" style={{ padding: '6px 12px' }}>×</button>
                </form>
              ) : (
                <>
                  <span className={`crm-col-dot ${s.color ?? 'neutral'}`} style={{ width: 12, height: 12 }} />
                  <span style={{ fontWeight: 700, color: '#5E2A67', minWidth: 120 }}>{s.label}</span>

                  {kind === 'person' && s.scoreThresholdMin !== null ? (
                    <span style={{ fontSize: 11, color: '#9D85B3', background: '#FAF7FF', padding: '2px 8px', borderRadius: 4 }}>
                      score ≥ {s.scoreThresholdMin}
                    </span>
                  ) : null}

                  {s.isDefault ? (
                    <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Default
                    </span>
                  ) : null}

                  {s.isTerminal ? (
                    <span style={{ fontSize: 10, color: '#92580E', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Terminal
                    </span>
                  ) : null}

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {!s.isDefault ? (
                      <button onClick={() => handleSetDefault(s.id)} className="crm-btn" style={{ padding: '4px 10px', fontSize: 11 }}>
                        ★ default
                      </button>
                    ) : null}
                    <button onClick={() => setEditingId(s.id)} className="crm-btn" style={{ padding: '4px 10px', fontSize: 11 }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(s.id, s.label)} className="crm-btn" style={{ padding: '4px 10px', fontSize: 11, color: '#C0392B' }}>
                      Apagar
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Form criar novo */}
      <form action={handleCreate} className="crm-settings-create">
        <input
          name="label"
          placeholder="Nova coluna (ex: Cliente VIP, Reengajar)"
          required
          maxLength={60}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13 }}
        />
        <select name="color" defaultValue="neutral" style={{ padding: '8px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 12 }}>
          {COLOR_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {kind === 'person' ? (
          <input
            name="scoreThresholdMin"
            type="number"
            min="0"
            placeholder="threshold"
            style={{ width: 100, padding: '8px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 12 }}
          />
        ) : null}
        <label style={{ fontSize: 11, color: '#9D85B3', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" name="isTerminal" />
          terminal
        </label>
        <button type="submit" className="crm-btn crm-btn-primary">+ Adicionar</button>
      </form>

      <style>{`
        .crm-settings-section {
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(93, 42, 103, 0.06);
        }
        .crm-settings-h2 {
          font-family: var(--font-headline);
          font-weight: 900;
          font-size: 18px;
          color: #5E2A67;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .crm-settings-meta {
          font-size: 11px;
          color: #9D85B3;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .crm-settings-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .crm-settings-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #FAF7FF;
          border: 1px solid #E4D8ED;
          border-radius: 10px;
          cursor: grab;
          transition: background 0.15s, border-color 0.15s;
        }
        .crm-settings-row.dragover {
          background: rgba(205, 80, 241, 0.08);
          border-color: #CD50F1;
        }
        .crm-settings-row:active { cursor: grabbing; }
        .crm-settings-drag {
          color: #9D85B3;
          font-size: 14px;
          user-select: none;
          letter-spacing: -2px;
        }
        .crm-settings-create {
          display: flex;
          gap: 8px;
          padding: 14px;
          background: #FAF7FF;
          border-radius: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
