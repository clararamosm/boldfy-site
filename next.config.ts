import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Redirects 301 do site antigo (Wix) → site novo
  // Preserva SEO juice dos artigos que já rankeiam no Google
  async redirects() {
    return [
      // ────────────────────────────────────────────────────────────
      // ARTIGOS MIGRADOS — redirect /post/slug-antigo → /blog/slug-novo
      // Estes são permanentes (301) para transferência máxima de autoridade SEO
      // ────────────────────────────────────────────────────────────

      // Grupo 1: Slug antigo = slug novo (sem acentos no original)
      { source: '/post/7-estrategias-de-branding-b2b-em-2025', destination: '/blog/7-estrategias-de-branding-b2b-em-2025', permanent: true },
      { source: '/post/associacao-de-marca-e-case-wall-mart', destination: '/blog/associacao-de-marca-e-case-wall-mart', permanent: true },
      { source: '/post/atributos-de-marca-e-coca-cola', destination: '/blog/atributos-de-marca-e-coca-cola', permanent: true },
      { source: '/post/brand-collabs-e-case-fini', destination: '/blog/brand-collabs-e-case-fini', permanent: true },
      { source: '/post/brand-equity-e-case-supreme', destination: '/blog/brand-equity-e-case-supreme', permanent: true },
      { source: '/post/brand-persona-e-lu-do-magalu', destination: '/blog/brand-persona-e-lu-do-magalu', permanent: true },
      { source: '/post/branded-content-e-case-michelin', destination: '/blog/branded-content-e-case-michelin', permanent: true },
      { source: '/post/branding-de-natal-e-case-coca', destination: '/blog/branding-de-natal-e-case-coca', permanent: true },
      { source: '/post/branding-sensorial', destination: '/blog/branding-sensorial', permanent: true },
      { source: '/post/branding-sonoro-e-case-tudum-netflix', destination: '/blog/branding-sonoro-e-case-tudum-netflix', permanent: true },
      { source: '/post/branding-market-share-e-happy-eggs', destination: '/blog/branding-market-share-e-happy-eggs', permanent: true },
      { source: '/post/consistencia-de-marca-na-pratica-e-red-bull', destination: '/blog/consistencia-de-marca-na-pratica-e-red-bull', permanent: true },
      { source: '/post/diferenciacao-no-branding-e-liquid-death', destination: '/blog/diferenciacao-no-branding-e-liquid-death', permanent: true },
      { source: '/post/dopamina-no-branding-e-case-duolingo', destination: '/blog/dopamina-no-branding-e-case-duolingo', permanent: true },
      { source: '/post/futuro-trafego-pago-e-branding', destination: '/blog/futuro-trafego-pago-e-branding', permanent: true },
      { source: '/post/gestao-e-producao-de-conteudo', destination: '/blog/gestao-e-producao-de-conteudo', permanent: true },
      { source: '/post/lojas-conceito-e-case-m-ms', destination: '/blog/lojas-conceito-e-case-m-ms', permanent: true },
      { source: '/post/marca-branding-pessoal-pra-profissionais', destination: '/blog/marca-branding-pessoal-pra-profissionais', permanent: true },
      { source: '/post/marcas-cores-e-case-nubank', destination: '/blog/marcas-cores-e-case-nubank', permanent: true },
      { source: '/post/mulheres-no-branding-e-case-always', destination: '/blog/mulheres-no-branding-e-case-always', permanent: true },
      { source: '/post/personal-branding-marca-pessoal-e-case-nat-arcuri', destination: '/blog/personal-branding-marca-pessoal-e-case-nat-arcuri', permanent: true },
      { source: '/post/personalidade-de-marca-e-aff-the-hype', destination: '/blog/personalidade-de-marca-e-aff-the-hype', permanent: true },
      { source: '/post/personalidade-de-marca-no-branding', destination: '/blog/personalidade-de-marca-no-branding', permanent: true },
      { source: '/post/2-proposito-de-marca-e-skittles', destination: '/blog/2-proposito-de-marca-e-skittles', permanent: true },
      { source: '/post/proposta-de-valor-e-netflix', destination: '/blog/proposta-de-valor-e-netflix', permanent: true },
      { source: '/post/rebranding-e-case-seara', destination: '/blog/rebranding-e-case-seara', permanent: true },
      { source: '/post/ritual-de-marca-6-passos-pra-montar-o-seu-e-case-jack-daniel-s', destination: '/blog/ritual-de-marca-6-passos-pra-montar-o-seu-e-case-jack-daniel-s', permanent: true },
      { source: '/post/tendencias-de-design-visual-2024', destination: '/blog/tendencias-de-design-visual-2024', permanent: true },
      { source: '/post/valor-do-design-e-case-starbucks', destination: '/blog/valor-do-design-e-case-starbucks', permanent: true },

      // Grupo 2: Slug antigo tem acentos — redirect explícito com URL encoded
      // O Next.js faz match com a versão decoded, então usamos o path literal com acentos
      { source: '/post/10-princ%C3%ADpios-do-bom-design-de-dieter-rams', destination: '/blog/10-principios-do-bom-design-de-dieter-rams', permanent: true },
      { source: '/post/branded-content-5-dicas-pra-criar-conte%C3%BAdo-de-marca-e-nestl%C3%A9', destination: '/blog/branded-content-5-dicas-pra-criar-conteudo-de-marca-e-nestle', permanent: true },
      { source: '/post/branding-as-a-service-o-que-%C3%A9', destination: '/blog/branding-as-a-service-o-que-e', permanent: true },
      { source: '/post/branding-como-estrat%C3%A9gia-de-growth-e-case-patreon', destination: '/blog/branding-como-estrategia-de-growth-e-case-patreon', permanent: true },
      { source: '/post/jornada-do-cliente-branding-e-case-ben%C3%AA', destination: '/blog/jornada-do-cliente-branding-e-case-bene', permanent: true },
      { source: '/post/confian%C3%A7a-de-marca-e-case-kylie-jenner', destination: '/blog/confianca-de-marca-e-case-kylie-jenner', permanent: true },
      { source: '/post/conte%C3%BAdo-educativo-e-case-semrush', destination: '/blog/conteudo-educativo-e-case-semrush', permanent: true },
      { source: '/post/1-defini%C3%A7%C3%B5es-de-branding-dicas-pr%C3%A1ticas-e-barbie', destination: '/blog/1-definicoes-de-branding-dicas-praticas-e-barbie', permanent: true },
      { source: '/post/diferen%C3%A7a-entre-marketing-e-branding', destination: '/blog/diferenca-entre-marketing-e-branding', permanent: true },
      { source: '/post/impacto-social-no-branding-e-case-sp-invis%C3%ADvel', destination: '/blog/impacto-social-no-branding-e-case-sp-invisivel', permanent: true },
      { source: '/post/influenciadores-corporativos-conte%C3%BAdo-gerado-por-colaboradores-e-case-globo', destination: '/blog/influenciadores-corporativos-conteudo-gerado-por-colaboradores-e-case-globo', permanent: true },
      { source: '/post/o-que-%C3%A9-branding-percep%C3%A7%C3%A3o-de-valor-de-marca', destination: '/blog/o-que-e-branding-percepcao-de-valor-de-marca', permanent: true },
      { source: '/post/proposito-de-marca-e-case-nath-finan%C3%A7as', destination: '/blog/proposito-de-marca-e-case-nath-financas', permanent: true },
      { source: '/post/varejo-f%C3%ADsico-e-case-oxxo', destination: '/blog/varejo-fisico-e-case-oxxo', permanent: true },

      // ────────────────────────────────────────────────────────────
      // CATCH-ALL: qualquer /post/* que não tem redirect específico → /blog
      // ────────────────────────────────────────────────────────────
      { source: '/post/:slug*', destination: '/blog', permanent: false },

      // ────────────────────────────────────────────────────────────
      // PÁGINAS DO SITE ANTIGO (Wix) → site novo
      // ────────────────────────────────────────────────────────────

      // Páginas de produto Wix → páginas relevantes no site novo
      { source: '/produto/planejamento-de-conteudo-template-notion', destination: '/plataforma', permanent: false },
      { source: '/produto/kit-mentoria-de-marca-pessoal', destination: '/servico', permanent: false },
      { source: '/produto/plano-de-acoes-notion', destination: '/plataforma', permanent: false },
      { source: '/produto/:slug*', destination: '/', permanent: false },

      // Outras páginas Wix
      { source: '/caf%C3%A9-virtual-branding', destination: '/contato', permanent: false },
      { source: '/brandgpt-chat-arquetipo-de-marca', destination: '/plataforma', permanent: false },
      { source: '/conteudo-estrategico', destination: '/servico', permanent: false },
      { source: '/branding-e-construcao-de-marca', destination: '/servico', permanent: false },
      { source: '/mentoria-marca-pessoal', destination: '/servico', permanent: false },
      { source: '/guia-proposta-de-valor', destination: '/blog', permanent: false },
      { source: '/pesquisa-panorama-de-branding-b2b-brasil', destination: '/blog', permanent: false },
      { source: '/diagnostico-de-branding-b2b', destination: '/contato', permanent: false },
      { source: '/category/:slug*', destination: '/blog', permanent: false },
      { source: '/blog/categories/:slug*', destination: '/blog', permanent: false },
      { source: '/members-area/:path*', destination: '/', permanent: false },

      // Casos de uso → páginas "Para" (novo IA)
      { source: '/casos-de-uso/marketing', destination: '/para/marketing', permanent: true },
      { source: '/casos-de-uso/social-selling', destination: '/para/vendas', permanent: true },
      { source: '/casos-de-uso/employer-branding', destination: '/para/rh', permanent: true },
    ];
  },
};

export default nextConfig;
