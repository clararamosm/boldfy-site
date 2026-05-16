/**
 * Tabela de Empresas — view alternativa ao Kanban.
 *
 * Mesmo padrão de PersonTable: search inline, filtro por status, sort.
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CompaniesByStatus, CompanyWithDetails } from '@/lib/crm-queries';
import { timeAgo } from '@/lib/crm-format';

type SortKey = 'name' | 'industry' | 'size' | 'status' | 'peopleCount' | 'topScore' | 'updatedAt' | 'createdAt';
type SortDir = 'asc' | 'desc';

export function CompanyTable({ data }: { data: CompaniesByStatus }) {
  const allCompanies = useMemo(() => {
    const flat: CompanyWithDetails[] = [];
    for (const group of data) flat.push(...group.companies);
    return flat;
  }, [data]);

  const statuses = useMemo(() => data.map((g) => g.status), [data]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let rows = allCompanies;
    if (s) {
      rows = rows.filter((c) => {
        const haystack = [c.name, c.industry, c.size, c.website, c.description].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(s);
      });
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((c) => c.statusId === statusFilter);
    }
    return rows;
  }, [allCompanies, search, statusFilter]);

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
      setSortDir(key === 'peopleCount' || key === 'topScore' || key === 'updatedAt' || key === 'createdAt' ? 'desc' : 'asc');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Buscar nome, setor, porte, website…"
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
          <option value="all">Todos os status ({allCompanies.length})</option>
          {statuses.map((s) => {
            const count = allCompanies.filter((c) => c.statusId === s.id).length;
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
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#FAF7FF' }}>
                <Th label="Nome" col="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Setor" col="industry" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Porte" col="size" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Leads" col="peopleCount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <Th label="Top score" col="topScore" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <Th label="Atualizada" col="updatedAt" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9D85B3' }}>
                    Nenhuma empresa bate com os filtros.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #F7EEFC' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/internal/crm/companies/${c.id}`} style={{ color: '#5E2A67', fontWeight: 600, textDecoration: 'none' }}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#45336B' }}>{c.industry ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#45336B' }}>{c.size ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.status ? <StatusPill label={c.status.label} color={c.status.color ?? 'gray'} /> : <span style={{ color: '#9D85B3' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#45336B', fontWeight: 600 }}>{c.peopleCount}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#45336B', fontWeight: 600 }}>{c.topScore}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#9D85B3', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {c.updatedAt ? timeAgo(c.updatedAt) : '—'}
                    </td>
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

function getSortValue(c: CompanyWithDetails, key: SortKey): string | number | null {
  switch (key) {
    case 'name':
      return c.name?.toLowerCase() ?? '';
    case 'industry':
      return c.industry?.toLowerCase() ?? null;
    case 'size':
      return c.size?.toLowerCase() ?? null;
    case 'status':
      return c.status?.sortOrder ?? -1;
    case 'peopleCount':
      return c.peopleCount ?? 0;
    case 'topScore':
      return c.topScore ?? 0;
    case 'updatedAt':
      return c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
    case 'createdAt':
      return c.createdAt ? new Date(c.createdAt).getTime() : 0;
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
      <span style={{ marginLeft: 4, opacity: isActive ? 1 : 0.2 }}>{isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
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
    <span style={{ display: 'inline-block', padding: '3px 10px', background: c.bg, color: c.fg, borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}
