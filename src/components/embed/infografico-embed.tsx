/**
 * Wrapper que renderiza o infografico correspondente ao slug.
 *
 * Cada infografico vive em /src/components/embed/graficos/<slug>.tsx e eh
 * registrado em /src/lib/infograficos.ts. Aqui so faz lookup e renderiza.
 *
 * Inline (NAO iframe) — o componente vira parte do HTML do post, totalmente
 * indexavel por Google + LLMs.
 */

import { getInfografico } from '@/lib/infograficos';

interface InfograficoEmbedProps {
  slug: string;
}

export function InfograficoEmbed({ slug }: InfograficoEmbedProps) {
  const entry = getInfografico(slug);

  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[InfograficoEmbed] Slug nao encontrado: "${slug}"`);
    }
    return null;
  }

  const { Component } = entry;

  return (
    <figure className="my-8" aria-label={entry.meta.title}>
      <Component />
    </figure>
  );
}
