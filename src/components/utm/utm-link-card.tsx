/**
 * <UtmLinkCard /> — card pra um link UTM gerado.
 *
 * Reusa <MetricsBlock /> (3 boxes + expandable chart). Header + URLs + actions
 * são específicos de "link UTM".
 *
 * Usado em /internal/utm e /dashboard/campanhas/[slug].
 */

'use client';

import { useState, useTransition } from 'react';
import type { UtmAnalytics } from '@/lib/ga4-utm-analytics';
import { MetricsBlock, Pill, ActionBtn, formatTime } from './metrics-block';

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
  compact?: boolean;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shortUrl = link.shortCode ? `${SHORT_DOMAIN}/l/${link.shortCode}` : null;

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

      {shortUrl ? <div className="mb-2 break-all font-mono text-xs font-semibold text-primary">🔗 {shortUrl}</div> : null}
      <div className="mb-3 break-all font-mono text-[11px] leading-snug text-muted-foreground">{link.fullUrl}</div>

      <MetricsBlock analytics={analytics} />

      {!compact && actions ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
    </li>
  );
}
