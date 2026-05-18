/**
 * Lista de artigos Mídia & RP (client wrapper).
 *
 * Renderiza:
 *   - Botão "+ Novo artigo" (abre modal create)
 *   - Lista de <MediaArticleCard /> (botão Editar abre modal edit)
 *   - <ArticleFormModal /> em ambos modos
 *
 * Recebe analyticsByUtmCampaign vindo do server (já fetched no batch GA4).
 */

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MediaArticleCard, type MediaArticleData } from '@/components/utm/media-article-card';
import type { UtmAnalytics } from '@/lib/ga4-utm-analytics';
import { ArticleFormModal } from './article-form';
import type { PrArticle } from '@/db';

export function ArticlesList({
  articles,
  analyticsByUtmCampaign,
}: {
  articles: PrArticle[];
  /** key = utm_campaign, value = analytics agregado */
  analyticsByUtmCampaign: Record<string, UtmAnalytics>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PrArticle | null>(null);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button" onClick={() => setCreateOpen(true)}
          className="crm-btn crm-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={14} /> Novo artigo
        </button>
      </div>

      {articles.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
          Sem artigos cadastrados ainda. Clique em &ldquo;Novo artigo&rdquo; pra começar.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => {
            const data: MediaArticleData = {
              id: article.id,
              title: article.title,
              publishedAt: article.publishedAt,
              articleUrl: article.articleUrl ?? null,
              outlet: article.outlet ?? null,
              utmCampaign: article.utmCampaign ?? null,
              shortlinkCode: article.shortlinkCode ?? null,
            };
            const analytics = article.utmCampaign ? (analyticsByUtmCampaign[article.utmCampaign] ?? null) : null;
            return (
              <MediaArticleCard
                key={article.id}
                article={data}
                analytics={analytics}
                actions={{ onEdit: () => setEditing(article) }}
              />
            );
          })}
        </ul>
      )}

      <ArticleFormModal mode={{ kind: 'create' }} open={createOpen} onClose={() => setCreateOpen(false)} />
      {editing ? (
        <ArticleFormModal mode={{ kind: 'edit', article: editing }} open={!!editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}
