/**
 * Tabela de Pessoas — view alternativa ao Kanban.
 *
 * Features:
 *  - Search inline (nome, email, empresa, cargo) — filtra client-side
 *  - Filtro por status (dropdown)
 *  - Sort por coluna (click no header)
 *  - Tags exibidas inline com truncate
 *  - Click no nome abre detail do lead
 *
 * Data flatten do PeopleByStatus — assume <500 leads totais (caso contrário,
 * paginar). Pra escala maior, migrar pra server-side sorting/filtering.
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PeopleByStatus, PersonWithDetails } from '@/lib/crm-queries';
import { timeAgo, formatDateTime, methodVia, channelLabel } from '@/lib/crm-format';
import { useColumnPicker, type ColumnDef } from './column-picker';

const PERSON_COLUMNS: readonly ColumnDef[] = [
  { key: 'name', label: 'Nome' },
  { key: 'company', label: 'Empresa' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'leadScore', label: 'Score' },
  { key: 'via', label: 'Via' },
  { key: 'lastTouchAt', label: 'Última atividade' },
];

type SortKey = 'name' | 'email' | 'company' | 'jobTitle' | 'status' | 'leadScore' | 'lastTouchAt' | 'createdAt';
type SortDir = 'asc' | 'desc';

export function PersonTable({
  data,
  inactivePeople = [],
}: {
  data: PeopleByStatus;
  inactivePeople?: PersonWithDetails[];
}) {
  // Task 2 (spec §8): toggle "Mostrar inativos" — default false (filtro
  // implícito unsubscribed=false). Quando true, concatena inactivePeople
  // no dataset visível.
  const [showInactive, setShowInactive] = useState(false);

  // Flatten ativos + inativos (se toggle ligado)
  const allPeople = useMemo(() => {
    const flat: PersonWithDetails[] = [];
    for (const group of data) flat.push(...group.people);
    if (showInactive) flat.push(...inactivePeople);
    return flat;
  }, [data, showInactive, inactivePeople]);

  const statuses = useMemo(() => data.map((g) => g.status), [data]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('lastTouchAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [visibleCols, ColumnPickerUI] = useColumnPicker('crm-table-cols-people', PERSON_COLUMNS);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let rows = allPeople;
    if (s) {
      rows = rows.filter((p) => {
        const haystack = [p.name, p.email, p.company?.name, p.jobTitle, p.headline]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(s);
      });
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((p) => p.statusId === statusFilter);
    }
    return rows;
  }, [allPeople, search, statusFilter]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'leadScore' || key === 'lastTouchAt' || key === 'createdAt' ? 'desc' : 'asc');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Buscar nome, email, empresa, cargo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 280px',
            minWidth: 220,
            padding: '10px 14px',
            border: '1px solid #E4D8ED',
            borderRadius: 10,
            fontSize: 13,
            background: '#FFFFFF',
            color: '#45336B',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #E4D8ED',
            borderRadius: 10,
            fontSize: 13,
            background: '#FFFFFF',
            color: '#45336B',
            cursor: 'pointer',
          }}
        >
          <option value="all">Todos os status ({allPeople.length})</option>
          {statuses.map((s) => {
            const count = allPeople.filter((p) => p.statusId === s.id).length;
            return (
              <option key={s.id} value={s.id}>
                {s.label} ({count})
              </option>
            );
          })}
        </select>
        <div style={{ fontSize: 12, color: '#9D85B3' }}>
          {sorted.length} {sorted.length === 1 ? 'resultado' : 'resultados'}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Toggle "Mostrar inativos" (spec §8) — só aparece se houver inativos */}
          {inactivePeople.length > 0 ? (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: showInactive ? 'rgba(157, 133, 179, 0.14)' : '#FFFFFF',
                border: '1px solid #E4D8ED',
                borderRadius: 8,
                fontSize: 11,
                color: '#6B5B8A',
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Inclui leads que deram unsubscribe no AC"
            >
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                style={{ margin: 0 }}
              />
              Mostrar inativos ({inactivePeople.length})
            </label>
          ) : null}
          {ColumnPickerUI}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 920 }}>
            <thead>
              <tr style={{ background: '#FAF7FF' }}>
                {visibleCols.has('name') ? <Th label="Nome" col="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('company') ? <Th label="Empresa" col="company" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('jobTitle') ? <Th label="Cargo" col="jobTitle" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('email') ? <Th label="Email" col="email" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('status') ? <Th label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('leadScore') ? <Th label="Score" col="leadScore" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" /> : null}
                {visibleCols.has('via') ? <Th label="Via" col="createdAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /> : null}
                {visibleCols.has('lastTouchAt') ? <Th label="Última atividade" col="lastTouchAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" /> : null}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size || 1} style={{ padding: 40, textAlign: 'center', color: '#9D85B3' }}>
                    Nenhum lead bate com os filtros.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F7EEFC' }}>
                    {visibleCols.has('name') ? (
                      <td style={{ padding: '10px 14px' }}>
                        <Link
                          href={`/internal/crm/people/${p.id}`}
                          style={{ color: '#5E2A67', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {p.name}
                        </Link>
                      </td>
                    ) : null}
                    {visibleCols.has('company') ? <td style={{ padding: '10px 14px', color: '#45336B' }}>{p.company?.name ?? '—'}</td> : null}
                    {visibleCols.has('jobTitle') ? <td style={{ padding: '10px 14px', color: '#45336B' }}>{p.jobTitle ?? '—'}</td> : null}
                    {visibleCols.has('email') ? <td style={{ padding: '10px 14px', color: '#9D85B3', fontSize: 12 }}>{p.email}</td> : null}
                    {visibleCols.has('status') ? (
                      <td style={{ padding: '10px 14px' }}>
                        {p.status ? <StatusPill label={p.status.label} color={p.status.color ?? 'gray'} /> : <span style={{ color: '#9D85B3' }}>—</span>}
                      </td>
                    ) : null}
                    {visibleCols.has('leadScore') ? <td style={{ padding: '10px 14px', textAlign: 'right', color: '#45336B', fontWeight: 600 }}>{p.leadScore}</td> : null}
                    {visibleCols.has('via') ? (
                      <td style={{ padding: '10px 14px', fontSize: 11, color: '#9D85B3' }}>
                        {methodVia(p.sourceMethod ?? 'manual')?.label ?? '—'}
                        {p.sourceChannel && p.sourceChannel !== 'unknown' ? ` · ${channelLabel(p.sourceChannel)}` : ''}
                      </td>
                    ) : null}
                    {visibleCols.has('lastTouchAt') ? (
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#9D85B3', fontSize: 11, whiteSpace: 'nowrap' }} title={p.lastTouchAt ? timeAgo(p.lastTouchAt) : ''}>
                        {p.lastTouchAt ? formatDateTime(p.lastTouchAt) : '—'}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getSortValue(p: PersonWithDetails, key: SortKey): string | number | null {
  switch (key) {
    case 'name':
      return p.name?.toLowerCase() ?? '';
    case 'email':
      return p.email?.toLowerCase() ?? '';
    case 'company':
      return p.company?.name?.toLowerCase() ?? null;
    case 'jobTitle':
      return p.jobTitle?.toLowerCase() ?? null;
    case 'status':
      return p.status?.sortOrder ?? -1;
    case 'leadScore':
      return p.leadScore ?? 0;
    case 'lastTouchAt':
      return p.lastTouchAt ? new Date(p.lastTouchAt).getTime() : null;
    case 'createdAt':
      return p.createdAt ? new Date(p.createdAt).getTime() : 0;
  }
}

function Th({
  label,
  col,
  sortKey,
  sortDir,
  onClick,
  align,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = sortKey === col;
  return (
    <th
      onClick={() => onClick(col)}
      style={{
        textAlign: align ?? 'left',
        padding: '12px 14px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: isActive ? '#5E2A67' : '#9D85B3',
        borderBottom: '1px solid #E4D8ED',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {label}
      <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.2 }}>
        {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: '#F0E8F8', fg: '#5E2A67' },
    gray: { bg: '#F0E8F8', fg: '#5E2A67' },
    blue: { bg: '#DBEAFE', fg: '#1E40AF' },
    amber: { bg: '#FEF3C7', fg: '#92400E' },
    purple: { bg: '#F3E8FF', fg: '#6B21A8' },
    green: { bg: '#D1FAE5', fg: '#065F46' },
  };
  const c = palette[color] ?? palette.gray;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
