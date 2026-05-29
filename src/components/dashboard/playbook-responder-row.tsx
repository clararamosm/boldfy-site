'use client';

/**
 * Linha da tabela "Respondentes do Playbook ELG" no dashboard de Forms.
 *
 * Mostra: pessoa, empresa, setor, template, sessões e usuários únicos da
 * página `/playbook/[slug]` no GA4. Tem chevron pra expandir e ver o
 * gráfico diário de acessos (sessões + usuários ao longo do tempo).
 *
 * Sinal comercial: se a linha mostra 1 sessão e 1 usuário único, foi só a
 * pessoa que abriu. Se mostra 5 sessões e 3 usuários únicos, a pessoa
 * compartilhou com o time — sinal de intenção comercial.
 *
 * Reutiliza o gráfico inline do MetricsBlock UTM (visual paridade) mas
 * adapta pra renderizar em <tr> com colspan no estado expanded.
 *
 * Spec: docs/cadencia-playbook-elg.md + spec do dashboard interno.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import type { UtmAnalytics, UtmDailyPoint } from '@/lib/ga4-utm-analytics';
import { timeAgo } from '@/lib/crm-format';

export type PlaybookResponderData = {
  /** ID da pessoa no CRM — vira link pro perfil em `/internal/crm/people/[id]`. */
  personId: string;
  personName: string;
  /** Email pode ser null em capturas via extensão LinkedIn que não pegam email. */
  personEmail: string | null;
  companyName: string | null;
  industry: string | null;
  templateKey: string;
  slug: string;
  createdAt: string | Date;
};

export function PlaybookResponderRow({
  row,
  analytics,
}: {
  row: PlaybookResponderData;
  /** Pode ser null se o GA4 não viu tráfego pra esse slug ainda. */
  analytics: UtmAnalytics | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDaily = !!(analytics && analytics.daily.length > 0);

  return (
    <>
      <tr>
        <td className="muted">{timeAgo(row.createdAt)}</td>
        <td>
          <Link
            href={`/internal/crm/people/${row.personId}`}
            className="strong"
            style={{ textDecoration: 'none', color: '#5E2A67' }}
          >
            {row.personName}
          </Link>
          <div className="muted" style={{ fontSize: 11 }}>
            {row.personEmail ?? '—'}
          </div>
        </td>
        <td>
          {row.companyName ?? <span className="muted">—</span>}
        </td>
        <td>
          {row.industry ?? <span className="muted">—</span>}
        </td>
        <td>
          <code
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: '#F4EEFB',
              color: '#5E2A67',
            }}
          >
            {row.templateKey}
          </code>
        </td>
        <td className="right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Activity size={12} style={{ color: '#9D85B3' }} />
            <strong>{analytics?.totals.sessions ?? 0}</strong>
          </span>
        </td>
        <td className="right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} style={{ color: '#9D85B3' }} />
            <strong>{analytics?.totals.users ?? 0}</strong>
          </span>
        </td>
        <td className="right">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            disabled={!hasDaily}
            title={hasDaily ? 'Ver gráfico de acessos por dia' : 'Sem acessos no período'}
            style={{
              border: 'none',
              background: hasDaily ? '#F4EEFB' : 'transparent',
              color: hasDaily ? '#5E2A67' : '#C8B4D5',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 6,
              cursor: hasDaily ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Gráfico
          </button>
        </td>
        <td className="right">
          <Link
            href={`/playbook/${row.slug}`}
            target="_blank"
            className="strong"
            style={{
              textDecoration: 'none',
              color: '#CD50F1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
            }}
          >
            Abrir
            <ArrowUpRight size={11} />
          </Link>
        </td>
      </tr>
      {expanded && analytics ? (
        <tr>
          <td colSpan={9} style={{ padding: 0, background: '#FBF7FE' }}>
            <div style={{ padding: '12px 16px' }}>
              <DailyBarChart daily={analytics.daily} />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  DailyBarChart — espelhado do MetricsBlock UTM pra paridade visual          */
/* -------------------------------------------------------------------------- */

function DailyBarChart({ daily }: { daily: UtmDailyPoint[] }) {
  if (daily.length === 0) {
    return (
      <p style={{ textAlign: 'center', fontSize: 11, color: '#9D85B3' }}>
        Sem acessos no período.
      </p>
    );
  }

  const W = 700;
  const H = 140;
  const PAD = { top: 8, right: 8, bottom: 24, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...daily.map((d) => Math.max(d.sessions, d.users)), 1);
  const barGroupW = innerW / daily.length;
  const barW = Math.max(2, Math.min(10, (barGroupW - 2) / 2));

  const ticks = [0, Math.ceil(max / 2), max];

  const xLabelIndices = new Set<number>();
  if (daily.length <= 7) {
    daily.forEach((_, i) => xLabelIndices.add(i));
  } else {
    xLabelIndices.add(0);
    xLabelIndices.add(daily.length - 1);
    const step = Math.floor(daily.length / 4);
    for (let i = step; i < daily.length - 1; i += step) xLabelIndices.add(i);
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 4,
          display: 'flex',
          gap: 12,
          fontSize: 10,
          fontWeight: 600,
          color: '#9D85B3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: 2,
              background: '#CD50F1',
            }}
          />{' '}
          Sessões
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: 2,
              background: '#60A5FA',
            }}
          />{' '}
          Usuários únicos
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: H, display: 'block' }}
      >
        {ticks.map((t, ti) => {
          const y = PAD.top + innerH - (t / max) * innerH;
          return (
            <g key={ti}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y}
                y2={y}
                stroke="#E4D8ED"
                strokeWidth={1}
              />
              <text x={PAD.left - 4} y={y + 3} fontSize="9" fill="#9D85B3" textAnchor="end">
                {t}
              </text>
            </g>
          );
        })}
        {daily.map((d, i) => {
          const groupX = PAD.left + i * barGroupW;
          const sessionsH = (d.sessions / max) * innerH;
          const usersH = (d.users / max) * innerH;
          return (
            <g key={d.date}>
              <rect
                x={groupX + 1}
                y={PAD.top + innerH - sessionsH}
                width={barW}
                height={sessionsH}
                fill="#CD50F1"
                rx={1}
              >
                <title>
                  {d.date}: {d.sessions} sessões
                </title>
              </rect>
              <rect
                x={groupX + 1 + barW + 1}
                y={PAD.top + innerH - usersH}
                width={barW}
                height={usersH}
                fill="#60A5FA"
                rx={1}
              >
                <title>
                  {d.date}: {d.users} usuários
                </title>
              </rect>
              {xLabelIndices.has(i) ? (
                <text
                  x={groupX + barGroupW / 2}
                  y={H - 6}
                  fontSize="9"
                  fill="#9D85B3"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
