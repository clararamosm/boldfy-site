/**
 * Lista única de pessoas que preencheram pelo menos 1 form.
 *
 * Mai/2026 ciclo 3.1: refatorado de "4 sublistas por form" pra "1 tabela por
 * pessoa com badges de forms preenchidos". Filtro de form vira chip clicável
 * (no FormsFilters). Sort por header clicável (Nome, Email, Quando — último
 * form preenchido).
 */

'use client';

import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import type { PersonRow } from './shared';
import { FORM_LABELS } from './shared';
import { timeAgo, formatDateTime, channelLabel } from '@/lib/crm-format';
import { useColumnPicker, type ColumnDef } from '@/components/crm/column-picker';
import { FormTagIcon, iconKeyForFormType } from '@/components/crm/form-tag-icon';
import { deleteRespondents, type DeleteRespondentsResult } from './actions';

// Spec §2: "default fields visíveis: name, email, phone, jobTitle. Campos
// opcionais ativáveis na visualização (column picker)". Defaults abaixo
// alinhados — resto começa OCULTO e user habilita via picker.
const FORMS_COLUMNS: readonly ColumnDef[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'formularios', label: 'Formulários' },
  { key: 'segmento', label: 'Segmento' },
  // 'optin' = checkbox de newsletter no form (campo `newsletter_opt_in` no DB).
  // Label diz "Newsletter" pra explicitar o que a coluna representa — outros
  // opt-ins (cadência do form etc.) são implícitos pela submissão e não
  // entram aqui. Key continua 'optin' pra não invalidar preferências do
  // column-picker salvas em localStorage.
  { key: 'optin', label: 'Newsletter' },
  { key: 'status', label: 'Status' },
  { key: 'canal', label: 'Canal' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'lastFormAt', label: 'Último form' },
];

// Spec §2 explícita: defaults = name, email, phone, jobTitle (cargo). Esses
// 4 são as colunas canônicas do CRM. Demais são opt-in via picker — útil pra
// não inundar a tabela com info que nem todo lead tem populada.
const FORMS_COLUMNS_DEFAULT: readonly string[] = ['name', 'email', 'phone', 'cargo'];

type Props = {
  rows: PersonRow[];
  totalPeople: number;
  totalPages: number;
  currentPage: number;
};

/**
 * Mapping segment slug → label + cor. Task 1 (mai/2026): lê direto de
 * people.segment (não mais derivado de acTags — bug fix da Patricia/Heloisa).
 */
function segmentDisplay(segment: string | null): { label: string; color: string } | null {
  if (!segment) return null;
  if (segment === 'lider_b2b') return { label: 'Líder B2B', color: '#CD50F1' };
  if (segment === 'parceiro') return { label: 'Parceiro', color: '#3B82F6' };
  if (segment === 'profissional_individual') return { label: 'Prof. Individual', color: '#F59E0B' };
  return null;
}

export function FormsList({ rows, totalPeople, totalPages, currentPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visibleCols, ColumnPickerUI] = useColumnPicker(
    'crm-table-cols-forms',
    FORMS_COLUMNS,
    FORMS_COLUMNS_DEFAULT,
  );

  const currentSortBy = searchParams.get('sortBy') ?? 'lastFormAt';
  const currentSortDir = searchParams.get('sortDir') ?? 'desc';

  /* ---- Seleção + exclusão em massa (Clara, mai/2026) ---- */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pageIds = rows.map((r) => r.person.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function runDelete() {
    setErrorMsg(null);
    setResultMsg(null);
    const ids = Array.from(selected);
    startDelete(async () => {
      const res: DeleteRespondentsResult = await deleteRespondents(ids);
      if (res.ok) {
        const acPart = res.ac.deleted > 0 || res.ac.failed > 0
          ? ` · AC: ${res.ac.deleted} removido${res.ac.deleted === 1 ? '' : 's'}${res.ac.failed > 0 ? `, ${res.ac.failed} falhou` : ''}`
          : '';
        const coPart = res.deleted.companies > 0 ? ` · ${res.deleted.companies} empresa(s) órfã(s)` : '';
        setResultMsg(`✓ ${res.deleted.people} pessoa(s) excluída(s)${acPart}${coPart}.`);
        setConfirmOpen(false);
        clearSelection();
        router.refresh();
      } else {
        setErrorMsg(res.error);
        setConfirmOpen(false);
      }
    });
  }

  function setSort(col: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === col) {
      params.set('sortDir', currentSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', col);
      params.set('sortDir', col === 'lastFormAt' ? 'desc' : 'asc');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const isEmpty = rows.length === 0;

  const SortHeader = ({ colKey, label, align = 'left' }: { colKey: string; label: string; align?: 'left' | 'right' }) => {
    const isSorted = currentSortBy === colKey;
    return (
      <th
        onClick={() => setSort(colKey)}
        style={{
          textAlign: align,
          padding: '10px 12px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: isSorted ? '#5E2A67' : '#9D85B3',
          borderBottom: '1px solid #E4D8ED',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {label}
        <span style={{ marginLeft: 4, opacity: isSorted ? 1 : 0.3 }}>
          {isSorted ? (currentSortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </th>
    );
  };

  // Estilo padrão de TH (não-sortable)
  const thBase: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9D85B3',
    borderBottom: '1px solid #E4D8ED',
    whiteSpace: 'nowrap',
  };

  const selectedCount = selected.size;

  return (
    <div>
      {/* Banners de resultado/erro da exclusão */}
      {resultMsg ? (
        <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#0F7A5A', fontSize: 13, fontWeight: 600 }}>
          {resultMsg}
        </div>
      ) : null}
      {errorMsg ? (
        <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(238, 90, 82, 0.1)', border: '1px solid rgba(238, 90, 82, 0.35)', color: '#C0392B', fontSize: 13, fontWeight: 600 }}>
          Erro ao excluir: {errorMsg}
        </div>
      ) : null}

      {/* Toolbar: barra de ações em massa (esquerda) + column picker (direita) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div>
          {selectedCount > 0 ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 10px 6px 14px', background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 999 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5E2A67' }}>
                {selectedCount} selecionado{selectedCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={{ fontSize: 12, color: '#9D85B3', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                limpar
              </button>
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setConfirmOpen(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#EE5A52', color: '#FFFFFF', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Trash2 size={13} strokeWidth={2} aria-hidden />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
        {ColumnPickerUI}
      </div>

      {isEmpty ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, padding: 48, textAlign: 'center', color: '#9D85B3', fontSize: 14 }}>
          Nenhuma pessoa encontrada com esses filtros.
        </div>
      ) : (
      <div style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#FAF7FF' }}>
              <th style={{ ...thBase, width: 36, padding: '10px 8px 10px 12px' }}>
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Selecionar todos da página"
                  style={{ cursor: 'pointer', accentColor: '#CD50F1', width: 15, height: 15 }}
                />
              </th>
              {visibleCols.has('name') ? <SortHeader colKey="name" label="Nome" /> : null}
              {visibleCols.has('email') ? <SortHeader colKey="email" label="Email" /> : null}
              {visibleCols.has('phone') ? <th style={thBase}>Telefone</th> : null}
              {visibleCols.has('cargo') ? <th style={thBase}>Cargo</th> : null}
              {visibleCols.has('formularios') ? <th style={thBase}>Formulários</th> : null}
              {visibleCols.has('segmento') ? <th style={thBase}>Segmento</th> : null}
              {visibleCols.has('optin') ? <th style={thBase}>Newsletter</th> : null}
              {visibleCols.has('status') ? <th style={thBase}>Status</th> : null}
              {visibleCols.has('canal') ? <th style={thBase}>Canal</th> : null}
              {visibleCols.has('empresa') ? <th style={thBase}>Empresa</th> : null}
              {visibleCols.has('lastFormAt') ? <SortHeader colKey="lastFormAt" label="Último form" align="right" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const segment = segmentDisplay(row.person.segment);
              const optIn = row.person.newsletterOptIn;
              const isUnsub = row.person.unsubscribed;
              const isSelected = selected.has(row.person.id);
              const canalLabel = row.person.sourceChannel && row.person.sourceChannel !== 'unknown'
                ? channelLabel(row.person.sourceChannel) : '—';
              return (
                <tr key={row.person.id} style={{ borderBottom: '1px solid #F7EEFC', opacity: isUnsub ? 0.55 : 1, background: isSelected ? 'rgba(205, 80, 241, 0.06)' : undefined }}>
                  <td style={{ padding: '10px 8px 10px 12px', verticalAlign: 'middle', width: 36 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(row.person.id)}
                      aria-label={`Selecionar ${row.person.name || 'pessoa'}`}
                      style={{ cursor: 'pointer', accentColor: '#CD50F1', width: 15, height: 15 }}
                    />
                  </td>
                  {visibleCols.has('name') ? (
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <Link href={`/internal/crm/people/${row.person.id}`} style={{ color: '#5E2A67', fontWeight: 600, textDecoration: 'none' }}>
                        {row.person.name || '—'}
                      </Link>
                      {isUnsub ? (
                        <span
                          title={row.person.unsubscribedAt ? `Saiu em ${new Date(row.person.unsubscribedAt).toLocaleDateString('pt-BR')}` : 'Unsubscribed'}
                          style={{ display: 'inline-block', marginLeft: 6, padding: '1px 6px', background: '#E5E5E5', color: '#6B5B8A', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'middle' }}
                        >
                          Unsub
                        </span>
                      ) : null}
                      {/* jobTitle como subtitle só se coluna Cargo NÃO está visível
                          (evita duplicar) */}
                      {row.person.jobTitle && !visibleCols.has('cargo') ? (
                        <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 2 }}>{row.person.jobTitle}</div>
                      ) : null}
                    </td>
                  ) : null}
                  {visibleCols.has('email') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle' }}>
                      {row.person.email ? (
                        <span style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.person.email ?? undefined}>
                          {row.person.email}
                        </span>
                      ) : (
                        <span style={{ color: '#9D85B3', fontStyle: 'italic', fontSize: 12 }}>— sem email</span>
                      )}
                    </td>
                  ) : null}
                  {visibleCols.has('phone') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle', fontSize: 12 }}>
                      {row.person.phone ?? <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                  ) : null}
                  {visibleCols.has('cargo') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle', fontSize: 12 }}>
                      {row.person.jobTitle ?? <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                  ) : null}
                  {visibleCols.has('formularios') ? (
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {row.forms.map((f) => (
                          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(205, 80, 241, 0.1)', color: '#CD50F1', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            <FormTagIcon name={iconKeyForFormType(f)} size={12} />
                            {FORM_LABELS[f]}
                          </span>
                        ))}
                        {row.forms.length === 0 && row.person.sourceMethod === 'manual' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(157, 133, 179, 0.12)', color: '#6B5B8A', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            Inserção manual
                          </span>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  {visibleCols.has('segmento') ? (
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      {segment ? (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${segment.color}1A`, color: segment.color }}>
                          {segment.label}
                        </span>
                      ) : <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                  ) : null}
                  {visibleCols.has('optin') ? (
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: optIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(157, 133, 179, 0.1)', color: optIn ? '#10B981' : '#6B5B8A' }}>
                        {optIn ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  ) : null}
                  {visibleCols.has('status') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle', fontSize: 12 }}>
                      {row.person.statusLabel ?? <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                  ) : null}
                  {visibleCols.has('canal') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle', fontSize: 12 }}>
                      {canalLabel}
                    </td>
                  ) : null}
                  {visibleCols.has('empresa') ? (
                    <td style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'middle' }}>
                      {row.company ? (
                        <Link href={`/internal/crm/companies/${row.company.id}`} style={{ color: '#5E2A67', textDecoration: 'none' }}>
                          {row.company.name}
                        </Link>
                      ) : <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                  ) : null}
                  {visibleCols.has('lastFormAt') ? (
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#9D85B3', fontSize: 11, whiteSpace: 'nowrap', verticalAlign: 'middle' }} title={timeAgo(row.lastFormAt)}>
                      {formatDateTime(row.lastFormAt)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0E5F8', background: '#FAF7FF', fontSize: 12, color: '#6B5B8A' }}>
          <div>
            Página {currentPage} de {totalPages} · {totalPeople} pessoas
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="crm-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
              ← Anterior
            </button>
            <button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="crm-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
              Próxima →
            </button>
          </div>
        </div>
      ) : null}
      </div>
      )}

      {/* Modal de confirmação da exclusão (destrutivo + irreversível) */}
      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 10, 24, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => { if (!deleting) setConfirmOpen(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 20px 50px rgba(93, 42, 103, 0.25)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(238, 90, 82, 0.12)', color: '#EE5A52' }}>
                <Trash2 size={18} strokeWidth={2} aria-hidden />
              </span>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#5E2A67' }}>
                Excluir {selectedCount} pessoa{selectedCount === 1 ? '' : 's'}?
              </h2>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: '#45336B' }}>
              Isso remove cada pessoa <strong>de todos os lugares, em definitivo</strong>: do CRM
              (incluindo formulários, reuniões, propostas e playbooks), do ActiveCampaign, e a
              empresa vinculada se ela ficar sem nenhuma pessoa.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#9D85B3' }}>
              Ação irreversível. Use para limpar contatos de teste.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="crm-btn"
                style={{ fontSize: 13, padding: '8px 16px', cursor: deleting ? 'progress' : 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={runDelete}
                disabled={deleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#EE5A52', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: deleting ? 'progress' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden />
                {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
