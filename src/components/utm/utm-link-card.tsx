/**
 * <UtmLinkCard /> — card reutilizável que mostra um link UTM.
 *
 * Usado em:
 *   - /internal/utm (histórico)
 *   - /internal/dashboard/campanhas/[slug] (UTMs filtrados por campaign)
 *   - Editor de campanha (futuro)
 *
 * Estrutura:
 *   - Header: title (label || campaign) + meta time + pills (source/medium/campaign)
 *   - Short URL (se houver)
 *   - Full URL (mono)
 *   - 3 boxes: sessões, usuários únicos, % engajamento
 *   - Botões: Copiar longo / Copiar curto (ou Encurtar) / QR Code / Reusar / Remover
 *   - Toggle expandable → bar chart por dia desde criação
 *
 * Actions são opcionais — quando não passadas, botão correspondente fica oculto.
 */

'use client';

import { useState, useTransition } from 'react';
import { Activity, Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { UtmAnalytics, UtmDailyPoint } from '@/lib/ga4-utm-analytics';

export type UtmLinkData = {
  id: string;
  label: string | null;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  utmTerm: string | null;
  fullUrl: string;
  shortCode: string | null;
  createdAt: Date | string;
};

export type UtmLinkCardActions = {
  onShorten?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void;
  onReuse?: (link: UtmLinkData) => void;
  onQrOpen?: (url: string) => void;
};

const SHORT_DOMAIN = 'https://boldfy.com.br';

export function UtmLinkCard({
  link,
  analytics,
  actions,
  compact = false,
}: {
  link: UtmLinkData;
  analytics: UtmAnalytics | null;
  actions?: UtmLinkCardActions;
  /** Se true, sem botões de ação (usado em listas read-only) */
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shortUrl = link.shortCode ? `${SHORT_DOMAIN}/l/${link.shortCode}` : null;
  const hasDaily = !!(analytics && analytics.daily.length > 0);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // no-op
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-accent-foreground">
            {link.label ?? link.utmCampaign}
            {link.utmContent ? <span className="ml-1 font-normal text-muted-foreground">· {link.utmContent}</span> : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Pill kind="source">source:{link.utmSource}</Pill>
            <Pill kind="medium">medium:{link.utmMedium}</Pill>
            <Pill kind="campaign">campaign:{link.utmCampaign}</Pill>
            {link.utmContent ? <Pill kind="muted">content:{link.utmContent}</Pill> : null}
            {link.utmTerm ? <Pill kind="muted">term:{link.utmTerm}</Pill> : null}
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(link.createdAt)}</span>
      </div>

      {/* Short URL */}
      {shortUrl ? <div className="mb-2 break-all font-mono text-xs font-semibold text-primary">🔗 {shortUrl}</div> : null}

      {/* Full URL */}
      <div className="mb-3 break-all font-mono text-[11px] leading-snug text-muted-foreground">{link.fullUrl}</div>

      {/* 3 stat boxes */}
      <div className="mb-3 grid grid-cols-3 gap-2">
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
      </div>

      {/* Actions */}
      {!compact && actions ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <ActionBtn onClick={() => copy(`${link.id}:long`, link.fullUrl)} variant="solid">
            {copiedKey === `${link.id}:long` ? '✓ Copiado' : 'Copiar longo'}
          </ActionBtn>
          {shortUrl ? (
            <ActionBtn onClick={() => copy(`${link.id}:short`, shortUrl)} variant="solid">
              {copiedKey === `${link.id}:short` ? '✓ Copiado' : 'Copiar curto'}
            </ActionBtn>
          ) : actions.onShorten ? (
            <ActionBtn
              onClick={() => actions.onShorten && startTransition(() => { void actions.onShorten!(link.id); })}
              variant="solid" disabled={pending}
            >
              Encurtar
            </ActionBtn>
          ) : null}
          {actions.onQrOpen ? (
            <ActionBtn onClick={() => actions.onQrOpen!(shortUrl ?? link.fullUrl)} variant="solid">
              QR Code
            </ActionBtn>
          ) : null}
          {actions.onReuse ? (
            <ActionBtn onClick={() => actions.onReuse!(link)} variant="ghost">
              Reusar
            </ActionBtn>
          ) : null}
          {actions.onDelete ? (
            <ActionBtn onClick={() => actions.onDelete!(link.id)} variant="danger" disabled={pending}>
              Remover
            </ActionBtn>
          ) : null}
        </div>
      ) : null}

      {/* Expand toggle + chart */}
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
    </li>
  );
}

/* ----------------------------------------------------------------- helpers */

function Pill({ kind, children }: { kind: 'source' | 'medium' | 'campaign' | 'muted'; children: React.ReactNode }) {
  const styles: Record<typeof kind, string> = {
    source: 'bg-blue-500/[0.12] text-blue-700',
    medium: 'bg-amber-500/[0.12] text-amber-700',
    campaign: 'bg-primary/[0.12] text-primary',
    muted: 'bg-secondary text-muted-foreground',
  } as Record<'source' | 'medium' | 'campaign' | 'muted', string>;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[kind]}`}>{children}</span>;
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string | null }) {
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

function ActionBtn({
  onClick, children, variant, disabled,
}: { onClick: () => void; children: React.ReactNode; variant: 'solid' | 'ghost' | 'danger'; disabled?: boolean }) {
  const cls = {
    solid: 'border-border bg-white text-accent-foreground hover:bg-secondary',
    ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-secondary',
    danger: 'border-transparent bg-transparent text-error hover:bg-error/[0.08]',
  }[variant];
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ---------------------------------------------------- DailyBarChart inline */
/**
 * Gráfico de barras simples (SVG inline, sem libs). Mostra sessões + users
 * por dia, eixo Y compartilhado. Compacto pra caber em cards.
 */
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

  // Ticks Y (3 níveis)
  const ticks = [0, Math.ceil(max / 2), max];

  // Label X — mostra primeiro, último e ~3 do meio
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
        {/* Y axis ticks */}
        {ticks.map((t, ti) => {
          const y = PAD.top + innerH - (t / max) * innerH;
          return (
            <g key={ti}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="#E4D8ED" strokeWidth={1} />
              <text x={PAD.left - 4} y={y + 3} fontSize="9" fill="#9D85B3" textAnchor="end">{t}</text>
            </g>
          );
        })}

        {/* Bars */}
        {daily.map((d, i) => {
          const groupX = PAD.left + i * barGroupW;
          const sessionsH = (d.sessions / max) * innerH;
          const usersH = (d.users / max) * innerH;
          return (
            <g key={d.date}>
              <rect
                x={groupX + 1} y={PAD.top + innerH - sessionsH}
                width={barW} height={sessionsH}
                fill="#CD50F1" rx={1}
              >
                <title>{d.date}: {d.sessions} sessões</title>
              </rect>
              <rect
                x={groupX + 1 + barW + 1} y={PAD.top + innerH - usersH}
                width={barW} height={usersH}
                fill="#60A5FA" rx={1}
              >
                <title>{d.date}: {d.users} usuários</title>
              </rect>
              {xLabelIndices.has(i) ? (
                <text
                  x={groupX + barGroupW / 2} y={H - 6}
                  fontSize="9" fill="#9D85B3" textAnchor="middle"
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
