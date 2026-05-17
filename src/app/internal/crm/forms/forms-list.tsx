/**
 * Lista de forms com toggle expand. Cada form tem schema de colunas próprio
 * pra mostrar TODOS os campos que aquele form captura.
 *
 * Mai/2026 ciclo 3: adicionado colunas Segmento e Opt-in newsletter (do AC
 * tags / form_data), sort por header clicável, paginação por form (URL
 * params). Counts vêm do server (total filtrado, não só a página atual).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { FormSubmission, FormType } from './page';
import { timeAgo } from '@/lib/crm-format';

type FormConfig = {
  type: FormType;
  emoji: string;
  label: string;
  description: string;
  columns: Array<{ key: string; label: string; from: 'person' | 'data' | 'company' | 'derived'; sortable?: boolean }>;
};

// Colunas "derived" (segmento, opt-in) são computadas em getCellValue
// a partir de acTags / metadata.
const COMMON_LEFT_COLS: FormConfig['columns'] = [
  { key: 'name', label: 'Nome', from: 'person', sortable: true },
  { key: 'email', label: 'Email', from: 'person', sortable: true },
];
const COMMON_RIGHT_COLS: FormConfig['columns'] = [
  { key: 'segmento', label: 'Segmento', from: 'derived' },
  { key: 'opt_in_newsletter', label: 'Opt-in', from: 'derived' },
  { key: 'status', label: 'Status', from: 'derived' },
  { key: 'canal', label: 'Canal', from: 'derived' },
];

const FORMS: FormConfig[] = [
  {
    type: 'form_submit_demo',
    emoji: '🎯',
    label: 'Demo',
    description: 'Agendamento de demo (B2B)',
    columns: [
      ...COMMON_LEFT_COLS,
      { key: 'jobTitle', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'porte', label: 'Porte', from: 'data' },
      ...COMMON_RIGHT_COLS,
    ],
  },
  {
    type: 'form_submit_beta',
    emoji: '🧪',
    label: 'Beta',
    description: 'Inscrição no Programa Beta (B2B)',
    columns: [
      ...COMMON_LEFT_COLS,
      { key: 'cargo', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'setor', label: 'Setor', from: 'data' },
      ...COMMON_RIGHT_COLS,
    ],
  },
  {
    type: 'form_submit_report',
    emoji: '📥',
    label: 'Report B2B',
    description: 'Download do Report (todos os segmentos)',
    columns: [
      ...COMMON_LEFT_COLS,
      { key: 'tipo_lead', label: 'Tipo lead', from: 'data' },
      { key: 'como_conheceu', label: 'Como conheceu', from: 'data' },
      ...COMMON_RIGHT_COLS,
    ],
  },
  {
    type: 'form_submit_proposta',
    emoji: '💼',
    label: 'Proposta',
    description: 'Simulador de proposta personalizada',
    columns: [
      ...COMMON_LEFT_COLS,
      { key: 'jobTitle', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'total_mensal', label: 'Total mensal', from: 'data' },
      ...COMMON_RIGHT_COLS,
    ],
  },
];

type Props = {
  submissions: Record<FormType, FormSubmission[]>;
  counts: Record<FormType, number>;
  pageSize: number;
  currentPage: number;
};

export function FormsList({ submissions, counts, pageSize, currentPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState<FormType | null>(null);

  const currentSortBy = searchParams.get('sortBy') ?? 'createdAt';
  const currentSortDir = searchParams.get('sortDir') ?? 'desc';

  function setSort(col: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === col) {
      // Toggle dir
      params.set('sortDir', currentSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', col);
      params.set('sortDir', 'asc');
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

  function formatValue(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'sim' : 'não';
    if (typeof v === 'number') return v.toLocaleString('pt-BR');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  /**
   * Detecta segmento principal de uma pessoa pelas tags AC. Hierarquia fixa:
   * Líder B2B > Parceiro > Profissional Individual > Newsletter > Beta tester.
   */
  function detectSegment(tags: string[] | null): string {
    if (!tags || tags.length === 0) return '—';
    if (tags.includes('Segmento: Líderes B2B')) return 'Líder B2B';
    if (tags.includes('Segmento: Parceiros estratégicos')) return 'Parceiro';
    if (tags.includes('Segmento: Profissionais Individuais')) return 'Profissional Individual';
    if (tags.includes('Segmento: Beta tester')) return 'Beta tester';
    if (tags.includes('Segmento: Newsletter Boldfy')) return 'Newsletter';
    return '—';
  }

  function getCellValue(sub: FormSubmission, col: FormConfig['columns'][number]): string {
    if (col.from === 'derived') {
      if (col.key === 'segmento') return detectSegment(sub.person?.acTags ?? null);
      if (col.key === 'opt_in_newsletter') {
        const tags = sub.person?.acTags ?? [];
        return tags.includes('Segmento: Newsletter Boldfy') ? 'Sim' : 'Não';
      }
      if (col.key === 'status') return sub.person?.statusLabel ?? '—';
      if (col.key === 'canal') return sub.person?.sourceChannel ?? '—';
      return '—';
    }
    if (col.from === 'person') {
      if (!sub.person) return '—';
      const personField = col.key as keyof typeof sub.person;
      return formatValue(sub.person[personField]);
    }
    if (col.from === 'company') {
      if (col.key === 'companyName') return sub.company?.name ?? '—';
      return '—';
    }

    // from === 'data'
    const direct = sub.data?.[col.key];
    if (direct !== undefined && direct !== null && direct !== '') return formatValue(direct);

    const meta = sub.personMetadata ?? {};
    const acFields = (meta as Record<string, unknown>)['ac_custom_fields'] as Record<string, unknown> | undefined;
    const formData = (meta as Record<string, unknown>)['form_data'] as Record<string, unknown> | undefined;
    const aliases: Record<string, string[]> = {
      tipo_lead: ['tipo_lead', 'tipo_de_lead'],
      cargo: ['cargo', 'job_title'],
      jobTitle: ['jobTitle', 'cargo', 'job_title'],
      porte: ['porte', 'colaboradores', 'funcionarios'],
      setor: ['setor', 'industry'],
      intencao_uso: ['intencao_uso', 'intencao'],
      como_conheceu: ['como_conheceu'],
      total_mensal: ['total_mensal', 'total_mensal_proposta'],
    };
    const tryKeys = aliases[col.key] ?? [col.key];
    for (const k of tryKeys) {
      if (acFields && acFields[k] !== undefined && acFields[k] !== '') return formatValue(acFields[k]);
      if (formData && formData[k] !== undefined && formData[k] !== '') return formatValue(formData[k]);
    }
    return '—';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {FORMS.map((form) => {
        const subs = submissions[form.type] ?? [];
        const totalCount = counts[form.type] ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const isOpen = open === form.type;
        return (
          <div key={form.type} style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(isOpen ? null : form.type)}
              style={{
                width: '100%', background: isOpen ? '#FAF7FF' : 'transparent', border: 'none', padding: 18,
                display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left', borderBottom: isOpen ? '1px solid #E4D8ED' : 'none',
              }}
            >
              <span style={{ fontSize: 28 }}>{form.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67' }}>
                  {form.label}
                </div>
                <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 2 }}>{form.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 22, color: '#CD50F1', lineHeight: 1 }}>
                  {totalCount}
                </div>
                <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 2 }}>
                  respondentes
                </div>
              </div>
              <span style={{ fontSize: 18, color: '#9D85B3', marginLeft: 8 }}>{isOpen ? '▼' : '▶'}</span>
            </button>

            {isOpen ? (
              subs.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
                  {totalCount === 0 ? 'Nenhuma resposta nesse form ainda.' : 'Nenhuma resposta nessa página/filtro.'}
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 800 }}>
                      <thead>
                        <tr style={{ background: '#FAF7FF' }}>
                          {form.columns.map((col) => {
                            const isSorted = col.sortable && currentSortBy === col.key;
                            return (
                              <th
                                key={col.key}
                                onClick={col.sortable ? () => setSort(col.key) : undefined}
                                style={{
                                  textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700,
                                  textTransform: 'uppercase', letterSpacing: '0.08em', color: isSorted ? '#5E2A67' : '#9D85B3',
                                  borderBottom: '1px solid #E4D8ED', whiteSpace: 'nowrap',
                                  cursor: col.sortable ? 'pointer' : 'default',
                                  userSelect: 'none',
                                }}
                              >
                                {col.label}
                                {col.sortable ? (
                                  <span style={{ marginLeft: 4, opacity: isSorted ? 1 : 0.3 }}>
                                    {isSorted ? (currentSortDir === 'asc' ? '↑' : '↓') : '↕'}
                                  </span>
                                ) : null}
                              </th>
                            );
                          })}
                          <th
                            onClick={() => setSort('createdAt')}
                            style={{
                              textAlign: 'right', padding: '10px 12px', fontSize: 10, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              color: currentSortBy === 'createdAt' ? '#5E2A67' : '#9D85B3',
                              borderBottom: '1px solid #E4D8ED', whiteSpace: 'nowrap',
                              cursor: 'pointer', userSelect: 'none',
                            }}
                          >
                            Quando
                            <span style={{ marginLeft: 4, opacity: currentSortBy === 'createdAt' ? 1 : 0.3 }}>
                              {currentSortBy === 'createdAt' ? (currentSortDir === 'asc' ? '↑' : '↓') : '↕'}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.map((sub) => (
                          <tr key={sub.activityId} style={{ borderBottom: '1px solid #F7EEFC' }}>
                            {form.columns.map((col, i) => {
                              const value = getCellValue(sub, col);
                              const isName = i === 0 && col.from === 'person' && col.key === 'name';
                              return (
                                <td key={col.key} style={{ padding: '10px 12px', color: '#45336B', verticalAlign: 'top' }}>
                                  {isName && sub.person ? (
                                    <Link href={`/internal/crm/people/${sub.person.id}`} style={{ color: '#5E2A67', fontWeight: 600, textDecoration: 'none' }}>
                                      {value}
                                    </Link>
                                  ) : col.key === 'opt_in_newsletter' ? (
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: value === 'Sim' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(157, 133, 179, 0.1)', color: value === 'Sim' ? '#10B981' : '#6B5B8A' }}>
                                      {value}
                                    </span>
                                  ) : col.key === 'segmento' && value !== '—' ? (
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(205, 80, 241, 0.1)', color: '#CD50F1' }}>
                                      {value}
                                    </span>
                                  ) : (
                                    <span style={{ display: 'inline-block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
                                      {value}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#9D85B3', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {timeAgo(sub.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação por form */}
                  {totalPages > 1 ? (
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0E5F8', background: '#FAF7FF', fontSize: 12, color: '#6B5B8A' }}>
                      <div>
                        Página {currentPage} de {totalPages} · {totalCount} total
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
                </>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
