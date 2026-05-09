/**
 * Callout de material pra embedar dentro de blog posts.
 *
 * Renderizado quando o NotionRenderer detecta um bloco `embed` apontando
 * pra https://boldfy.com.br/embed/material/<slug>?source=<post-slug>.
 *
 * Tracking:
 *   - UTMs anexados automaticamente ao link do CTA
 *   - source vira utm_content (qual post originou o clique)
 *
 * Server Component — zero hidratacao, zero JS no client. O Link do Next
 * cuida da navegacao.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getMaterial, buildMaterialCtaUrl } from '@/lib/materiais';

interface MaterialCalloutProps {
  /** Slug do material (deve existir em MATERIAIS). */
  slug: string;
  /**
   * Slug do post que ta embedando esse callout. Usado pra UTM tracking
   * no CTA. Null = sem source (ainda funciona, so nao rastreia origem).
   */
  source: string | null;
}

export function MaterialCallout({ slug, source }: MaterialCalloutProps) {
  const material = getMaterial(slug);

  // Slug invalido — renderiza vazio em vez de quebrar a pagina.
  // Em dev, console.warn pra dev ver que tem typo.
  if (!material) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[MaterialCallout] Slug nao encontrado: "${slug}"`);
    }
    return null;
  }

  const ctaUrl = buildMaterialCtaUrl(material, source);

  return (
    <aside
      className="my-8 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6"
      aria-labelledby={`material-callout-${material.slug}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        {/* Capa — esconde em mobile portrait pra dar espaco pro texto */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:h-[120px] sm:w-[160px]">
          <Image
            src={material.cover}
            alt={`Capa do material ${material.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 160px"
          />
        </div>

        {/* Conteudo */}
        <div className="flex-1">
          <span className="mb-2 inline-flex items-center rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            {material.tag}
          </span>
          <h3
            id={`material-callout-${material.slug}`}
            className="mb-1.5 font-headline text-lg font-black leading-tight text-accent-foreground sm:text-xl"
          >
            {material.title}
          </h3>
          <p className="mb-4 text-sm leading-snug text-muted-foreground">
            {material.description}
          </p>
          <Link
            href={ctaUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(205,80,241,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_8px_22px_rgba(205,80,241,0.35)]"
          >
            {material.ctaText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
