/**
 * Lista de forms com toggle expand. Cada form tem schema de colunas próprio
 * pra mostrar TODOS os campos que aquele form captura.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FormSubmission, FormType } from './page';
import { timeAgo } from '@/lib/crm-format';

type FormConfig = {
  type: FormType;
  emoji: string;
  label: string;
  description: string;
  columns: Array<{ key: string; label: string; from: 'person' | 'data' | 'company' }>;
};

const FORMS: FormConfig[] = [
  {
    type: 'form_submit_demo',
    emoji: '🎯',
    label: 'Demo',
    description: 'Agendamento de demo (B2B, 100% pro CRM)',
    columns: [
      { key: 'name', label: 'Nome', from: 'person' },
      { key: 'email', label: 'Email', from: 'person' },
      { key: 'jobTitle', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'porte', label: 'Porte', from: 'data' },
      { key: 'origem', label: 'Origem', from: 'data' },
      { key: 'utm_source', label: 'utm_source', from: 'data' },
      { key: 'utm_campaign', label: 'utm_campaign', from: 'data' },
    ],
  },
  {
    type: 'form_submit_beta',
    emoji: '🧪',
    label: 'Beta',
    description: 'Inscrição no Programa Beta (B2B)',
    columns: [
      { key: 'name', label: 'Nome', from: 'person' },
      { key: 'email', label: 'Email', from: 'person' },
      { key: 'cargo', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'setor', label: 'Setor', from: 'data' },
      { key: 'colaboradores', label: 'Colaboradores', from: 'data' },
      { key: 'objetivo_principal', label: 'Objetivo', from: 'data' },
      { key: 'como_conheceu', label: 'Como conheceu', from: 'data' },
      { key: 'observacoes', label: 'Observações', from: 'data' },
    ],
  },
  {
    type: 'form_submit_report',
    emoji: '📥',
    label: 'Report B2B',
    description: 'Download do Report (todos os tipos, só B2B vai pro CRM)',
    columns: [
      { key: 'name', label: 'Nome', from: 'person' },
      { key: 'email', label: 'Email', from: 'person' },
      { key: 'intencao_uso', label: 'Intenção de uso', from: 'data' },
      { key: 'tipo_lead', label: 'Tipo lead', from: 'data' },
      { key: 'newsletter_opt_in', label: 'Newsletter', from: 'data' },
      { key: 'utm_source', label: 'utm_source', from: 'data' },
      { key: 'utm_campaign', label: 'utm_campaign', from: 'data' },
    ],
  },
  {
    type: 'form_submit_proposta',
    emoji: '💼',
    label: 'Proposta',
    description: 'Simulador de proposta personalizada (deep B2B intent)',
    columns: [
      { key: 'name', label: 'Nome', from: 'person' },
      { key: 'email', label: 'Email', from: 'person' },
      { key: 'jobTitle', label: 'Cargo', from: 'data' },
      { key: 'companyName', label: 'Empresa', from: 'company' },
      { key: 'total_mensal', label: 'Total mensal', from: 'data' },
      { key: 'total_full', label: 'Total full', from: 'data' },
      { key: 'savings', label: 'Savings', from: 'data' },
      { key: 'utm_campaign', label: 'utm_campaign', from: 'data' },
    ],
  },
];

export function FormsList({ submissions }: { submissions: Record<FormType, FormSubmission[]> }) {
  const [open, setOpen] = useState<FormType | null>(null);

  function formatValue(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'sim' : 'não';
    if (typeof v === 'number') return v.toLocaleString('pt-BR');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  function getCellValue(sub: FormSubmission, col: FormConfig['columns'][number]): string {
    if (col.from === 'person') {
      if (!sub.person) return '—';
      const personField = col.key as keyof typeof sub.person;
      return formatValue(sub.person[personField]);
    }
    if (col.from === 'company') {
      if (col.key === 'companyName') return sub.company?.name ?? '—';
      return '—';
    }
    return formatValue(sub.data?.[col.key]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {FORMS.map((form) => {
        const subs = submissions[form.type] ?? [];
        const isOpen = open === form.type;
        return (
          <div key={form.type} style={{ background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(isOpen ? null : form.type)}
              style={{
                width: '100%',
                background: isOpen ? '#FAF7FF' : 'transparent',
                border: 'none',
                padding: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                borderBottom: isOpen ? '1px solid #E4D8ED' : 'none',
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
                  {subs.length}
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
                  Nenhuma resposta nesse form ainda.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: '#FAF7FF' }}>
                        {form.columns.map((col) => (
                          <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3', borderBottom: '1px solid #E4D8ED', whiteSpace: 'nowrap' }}>
                            {col.label}
                          </th>
                        ))}
                        <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3', borderBottom: '1px solid #E4D8ED', whiteSpace: 'nowrap' }}>
                          Quando
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
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
