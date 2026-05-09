/**
 * Catalogo de infograficos. Cada um eh um componente React unico em
 * /src/components/embed/graficos/<slug>.tsx.
 *
 * Diferente dos materiais (catalogo central com dados), aqui eh so um
 * mapa de slug -> componente. O conteudo visual fica no proprio componente.
 *
 * Pra adicionar infografico novo:
 *   1. Cria componente em /src/components/embed/graficos/<slug>.tsx
 *      (default export ou named export deste arquivo)
 *   2. Adiciona entrada no INFOGRAFICOS abaixo
 *   3. No Notion, cola embed:
 *      https://boldfy.com.br/embed/grafico/<slug>?source=<slug-do-post>
 *
 * Acessibilidade & SEO: o componente DEVE renderizar texto inline (HTML
 * ou SVG <text>) — nao usar canvas nem images com texto rasterizado.
 * Eh exatamente isso que faz o infografico indexavel por Google + LLMs.
 */

import type { ComponentType } from 'react';

export type InfograficoMeta = {
  /** Slug usado na URL: /embed/grafico/<slug> */
  slug: string;
  /** Titulo descritivo (usado em fallback / a11y) */
  title: string;
};

export type InfograficoEntry = {
  meta: InfograficoMeta;
  /** Componente React que renderiza o infografico inline */
  Component: ComponentType;
};

/**
 * Registro vazio por enquanto. Quando criar o primeiro infografico,
 * importa o componente e adiciona aqui.
 *
 * Exemplo (quando houver):
 *   import JornadaELG from '@/components/embed/graficos/jornada-elg';
 *
 *   export const INFOGRAFICOS: Record<string, InfograficoEntry> = {
 *     'jornada-elg': {
 *       meta: { slug: 'jornada-elg', title: 'Jornada do Employee-Led Growth' },
 *       Component: JornadaELG,
 *     },
 *   };
 */
export const INFOGRAFICOS: Record<string, InfograficoEntry> = {};

export function getInfografico(slug: string): InfograficoEntry | null {
  return INFOGRAFICOS[slug] ?? null;
}
