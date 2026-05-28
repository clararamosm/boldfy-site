/**
 * <MetricsBlock /> — 3 stat boxes (sessões/users/engaj) + toggle expandable
 * que abre um bar chart diário inline.
 *
 * Reutilizado por <UtmLinkCard /> e <MediaArticleCard />. Não conhece o
 * conceito de "link" ou "artigo" — só recebe analytics.
 */

'use client';

import { useState } from 'react';
import { Activity, Users, Sparkles, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import type { UtmAnalytics, UtmDailyPoint } from '@/lib/ga4-utm-analytics';

export function MetricsBlock({
  analytics,
  leads = null,
}: {
  analytics: UtmAnalytics | null;
  /**
   * Leads atribuídos a esse UTM (first-touch DENTRO da campanha — primeira
   * submissão da pessoa cujo `data.utms` casa com a chave do link). null =
   * sem dado / não computado (ex: tela `/internal/utm` onde não há campanha
   * pra atribuir).
   */
  leads?: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDaily = !!(analytics && analytics.daily.length > 0);
  const showLeads = leads !== null;

  return (
    <>
      <div className={`mb-3 grid gap-2 ${showLeads ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        <StatBox
          icon={<Activity size={14} />}
          label="Sessões"
          value={analytics ? analytics.totals.sessions : null}
        />
        <StatBox
          icon={<Users size={14} />}
          label="Usuários únicos"
          value={analytics ? analytics.totals.users : null}
        />
        <StatBox
          icon={<Sparkles size={14} />}
          label="Engajamento"
          value={analytics ? `${Math.round(analytics.totals.engagementRate * 100)}%` : null}
        />
        {showLeads ? (
          <StatBox
            icon={<UserPlus size={14} />}
            label="Leads"
            value={leads}
          />
        ) : null}
      </div>

      {hasDaily ? (
        <>
          <button
            type="button" onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-transparent bg-secondary/40 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Esconder gráfico
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Ver acessos por dia
              </>
            )}
          </button>
          {expanded && analytics ? (
            <div className="mt-3 rounded-md bg-secondary/30 p-3">
              <DailyBarChart daily={analytics.daily} />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- internals */

export function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string | null }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-headline text-lg font-black text-accent-foreground">
        {value === null ? '—' : typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
    </div>
  );
}

export function Pill({ kind, children }: { kind: 'source' | 'medium' | 'campaign' | 'muted'; children: React.ReactNode }) {
  const styles: Record<typeof kind, string> = {
    source: 'bg-blue-500/[0.12] text-blue-700',
    medium: 'bg-amber-500/[0.12] text-amber-700',
    campaign: 'bg-primary/[0.12] text-primary',
    muted: 'bg-secondary text-muted-foreground',
  } as Record<'source' | 'medium' | 'campaign' | 'muted', string>;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[kind]}`}>{children}</span>;
}

export function ActionBtn({
  onClick, children, variant, disabled, title,
}: {
  onClick: () => void; children: React.ReactNode;
  variant: 'solid' | 'ghost' | 'danger'; disabled?: boolean; title?: string;
}) {
  const cls = {
    solid: 'border-border bg-white text-accent-foreground hover:bg-secondary',
    ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-secondary',
    danger: 'border-transparent bg-transparent text-error hover:bg-error/[0.08]',
  }[variant];
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ---------------------------------------------------- DailyBarChart inline */

function DailyBarChart({ daily }: { daily: UtmDailyPoint[] }) {
  if (daily.length === 0) {
    return <p className="text-center text-xs text-muted-foreground">Sem acessos no período.</p>;
  }

  const W = 600;
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
      <div className="mb-1 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary" /> Sessões
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue-400" /> Usuários
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        {ticks.map((t, ti) => {
          const y = PAD.top + innerH - (t / max) * innerH;
          return (
            <g key={ti}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="#E4D8ED" strokeWidth={1} />
              <text x={PAD.left - 4} y={y + 3} fontSize="9" fill="#9D85B3" textAnchor="end">{t}</text>
            </g>
          );
        })}
        {daily.map((d, i) => {
          const groupX = PAD.left + i * barGroupW;
          const sessionsH = (d.sessions / max) * innerH;
          const usersH = (d.users / max) * innerH;
          return (
            <g key={d.date}>
              <rect x={groupX + 1} y={PAD.top + innerH - sessionsH} width={barW} height={sessionsH} fill="#CD50F1" rx={1}>
                <title>{d.date}: {d.sessions} sessões</title>
              </rect>
              <rect x={groupX + 1 + barW + 1} y={PAD.top + innerH - usersH} width={barW} height={usersH} fill="#60A5FA" rx={1}>
                <title>{d.date}: {d.users} usuários</title>
              </rect>
              {xLabelIndices.has(i) ? (
                <text x={groupX + barGroupW / 2} y={H - 6} fontSize="9" fill="#9D85B3" textAnchor="middle">
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
