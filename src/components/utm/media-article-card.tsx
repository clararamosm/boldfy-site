/**
 * <MediaArticleCard /> — card pra um artigo de Mídia & RP cadastrado.
 *
 * Mesma estética do UtmLinkCard (3 boxes + chart expandable) reusando
 * <MetricsBlock />. Header próprio: título do artigo + outlet + data + link
 * pra matéria publicada.
 *
 * As métricas vêm do utm_campaign que o user vincula ao cadastrar o artigo
 * (mesma lógica de matching do UtmLinkCard, batched no GA4).
 */

'use client';

import { ExternalLink, Pencil, Newspaper } from 'lucide-react';
import type { UtmAnalytics } from '@/lib/ga4-utm-analytics';
import { MetricsBlock, Pill, ActionBtn } from './metrics-block';

export type MediaArticleData = {
  id: string;
  title: string;
  publishedAt: Date | string;
  articleUrl: string | null;
  outlet: string | null;
  utmCampaign: string | null;
  shortlinkCode: string | null;
};

export type MediaArticleCardActions = {
  onEdit?: (article: MediaArticleData) => void;
};

export function MediaArticleCard({
  article,
  analytics,
  actions,
}: {
  article: MediaArticleData;
  analytics: UtmAnalytics | null;
  actions?: MediaArticleCardActions;
}) {
  const date = typeof article.publishedAt === 'string' ? new Date(article.publishedAt) : article.publishedAt;
  const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <li className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Newspaper size={14} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-sm font-semibold text-accent-foreground">{article.title}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {article.outlet ? <Pill kind="source">📰 {article.outlet}</Pill> : null}
            <Pill kind="muted">📅 {dateLabel}</Pill>
            {article.utmCampaign ? <Pill kind="campaign">campaign:{article.utmCampaign}</Pill> : null}
          </div>
        </div>
      </div>

      {/* Link externo da matéria */}
      {article.articleUrl ? (
        <a
          href={article.articleUrl} target="_blank" rel="noopener noreferrer"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <ExternalLink size={12} />
          Ver matéria publicada
        </a>
      ) : (
        <div className="mb-3 text-xs text-muted-foreground italic">URL da matéria não cadastrada.</div>
      )}

      {/* Métricas — só se tem utm_campaign vinculado */}
      {article.utmCampaign ? (
        <MetricsBlock analytics={analytics} />
      ) : (
        <div className="mb-2 rounded-md bg-secondary/40 p-3 text-center text-[11px] text-muted-foreground">
          Cadastre o <code className="rounded bg-white/60 px-1 py-0.5">utm_campaign</code> pra ver as métricas.
        </div>
      )}

      {/* Ações */}
      {actions?.onEdit ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ActionBtn onClick={() => actions.onEdit!(article)} variant="ghost" title="Editar artigo">
            <Pencil size={11} style={{ verticalAlign: -1, marginRight: 4 }} /> Editar
          </ActionBtn>
        </div>
      ) : null}
    </li>
  );
}
