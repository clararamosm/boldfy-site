/**
 * Lista de páginas conhecidas do site Boldfy.
 *
 * Usado no dashboard de tráfego pra garantir que TODAS as páginas
 * apareçam na tabela "Top páginas" — mesmo com 0 visitas. Sem isso, uma
 * página que ninguém visita simplesmente não aparece no GA4 e a Clara
 * não sabe que existe + tá morta. Aqui ela vê a lista completa e pode
 * decidir promover.
 *
 * Lista construída a partir de `src/app/**​/page.tsx` (mai/2026 — manter
 * sincronizada quando criar página nova) + blogs do Notion via
 * getPublishedPosts.
 */

import { getPublishedPosts } from '@/lib/notion';

export type KnownPage = {
  path: string;       // ex: '/precos', '/blog/algoritmo-2026'
  category: string;   // ex: 'Landing page', 'Blog', 'Solução', etc.
  label?: string;     // título legível (opcional)
};

/**
 * Páginas estáticas do site — sincronizadas manualmente com
 * `src/app/**​/page.tsx`. Sempre que criar página nova, adicionar aqui
 * pra ela aparecer na tabela com 0 visitas se não tiver dado.
 */
const STATIC_PAGES: KnownPage[] = [
  // Home + comerciais
  { path: '/', category: 'Home' },
  { path: '/precos', category: 'Comercial' },
  { path: '/agendar-demo', category: 'Comercial' },

  // Soluções
  { path: '/solucoes/software-as-a-service', category: 'Solução' },
  { path: '/solucoes/content-as-a-service', category: 'Solução' },

  // Para (verticais)
  { path: '/para/marketing', category: 'Vertical' },
  { path: '/para/vendas', category: 'Vertical' },
  { path: '/para/rh', category: 'Vertical' },

  // Landing pages
  { path: '/algoritmo-linkedin', category: 'LP' },
  { path: '/case-semrush', category: 'LP' },
  { path: '/beta-test', category: 'LP' },

  // Ferramentas
  { path: '/ferramentas', category: 'Ferramenta' },
  { path: '/ferramentas/playbook-employee-led-growth', category: 'Ferramenta' },

  // Recursos
  { path: '/blog', category: 'Recurso' },
  { path: '/blog/sobre-o-autor', category: 'Recurso' },
  { path: '/materiais', category: 'Recurso' },

  // Outras
  { path: '/legal', category: 'Institucional' },
];

/**
 * Lista completa de páginas conhecidas (estáticas + blogs do Notion).
 *
 * Falha silenciosa pro Notion: se a API quebrar, ainda retorna só as
 * estáticas. Cache via `revalidate` da page do dashboard (mesmo TTL
 * que blog usa).
 */
export async function getKnownPages(): Promise<KnownPage[]> {
  try {
    const blogPosts = await getPublishedPosts();
    const blogPages: KnownPage[] = blogPosts.map((p) => ({
      path: `/blog/${p.slug}`,
      category: 'Blog',
      label: p.title,
    }));
    return [...STATIC_PAGES, ...blogPages];
  } catch (err) {
    console.error('[known-pages] failed to load blogs:', err);
    return STATIC_PAGES;
  }
}
