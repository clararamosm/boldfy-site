/**
 * Catalogo central de materiais (reports, guias, templates).
 *
 * Cada material aparece:
 *   - como card no /materiais
 *   - como callout dentro de blog posts via embed do Notion:
 *     https://boldfy.com.br/embed/material/<slug>?source=<slug-do-post>
 *
 * Pra adicionar material novo:
 *   1. Sobe a capa em /public/images/<slug>-cover.jpeg (formato 16:10 ou 4:3)
 *   2. Cria a LP de captura em /src/app/(lp)/<slug>/ (se ainda nao existe)
 *   3. Adiciona uma entrada no MATERIAIS abaixo
 *   4. Pronto — ja pode usar em qualquer blog post via Notion embed
 */

export type Material = {
  /** Slug usado na URL: /embed/material/<slug> */
  slug: string;
  /** Tag visual no canto do callout (ex: "REPORT", "GUIA", "TEMPLATE") */
  tag: string;
  /** Titulo principal do material */
  title: string;
  /** Descricao curta (1-2 linhas) */
  description: string;
  /** Caminho da capa em /public (ex: /images/algoritmo-linkedin-cover.jpeg) */
  cover: string;
  /** Texto do botao CTA */
  ctaText: string;
  /**
   * URL base da LP de captura (sem UTMs). Ex: '/algoritmo-linkedin'
   * Os UTMs sao adicionados automaticamente pelo MaterialCallout.
   */
  href: string;
};

export const MATERIAIS: Record<string, Material> = {
  'algoritmo-linkedin': {
    slug: 'algoritmo-linkedin',
    tag: 'Report gratuito',
    title: 'O algoritmo do LinkedIn mudou tudo',
    description:
      'O que muda na pratica pro seu B2B em 2026 — entenda como o 360Brew reescreveu as regras do feed.',
    cover: '/images/algoritmo-linkedin-cover.jpeg',
    ctaText: 'Baixar gratis',
    href: '/algoritmo-linkedin',
  },
};

/**
 * Helper: dado um slug + source (ex: slug do blog post), constroi a URL
 * final do CTA com UTMs apropriados pra rastreamento no AC.
 */
export function buildMaterialCtaUrl(material: Material, source: string | null): string {
  const url = new URL(material.href, 'https://boldfy.com.br');
  url.searchParams.set('utm_source', 'blog');
  url.searchParams.set('utm_medium', 'embed');
  url.searchParams.set('utm_campaign', 'blog-cta-material');
  if (source) {
    url.searchParams.set('utm_content', source);
  }
  // Retorna path + query (sem o host) — fica relativo, melhor pra Next Link
  return url.pathname + url.search;
}

/**
 * Lookup com fallback null (slug invalido = renderiza nada, sem quebrar).
 */
export function getMaterial(slug: string): Material | null {
  return MATERIAIS[slug] ?? null;
}
