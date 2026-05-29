import type { NextConfig } from 'next';

/**
 * Content-Security-Policy — restringe origens de scripts, estilos, imagens, etc.
 *
 * 'unsafe-inline' em script-src é necessário porque:
 *   - GTM injeta scripts inline no documento
 *   - layout.tsx tem JSON-LD via dangerouslySetInnerHTML
 *   - Next 16 ainda emite alguns scripts inline (RSC bootstrapping)
 *
 * 'unsafe-eval' em script-src é necessário pelo loader do Cal.com (eval do IIFE).
 *
 * 'unsafe-inline' em style-src é necessário pra Tailwind/Next inline styles.
 *
 * connect-src cobre:
 *   - GA4 / GTM beacons (*.google-analytics.com, *.analytics.google.com)
 *   - LinkedIn Insight (px.ads.linkedin.com)
 *   - ActiveCampaign Site Tracking (*.activehosted.com, trackcmp.net)
 *   - Cal.com embed API (app.cal.com)
 *
 * Próxima evolução: trocar 'unsafe-inline' por nonce-based CSP via middleware.
 */
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  [
    "script-src 'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.licdn.com",
    "https://*.activehosted.com",
    "https://*.app-us1.com", // ActiveCampaign Site Tracking (VGO) — diffuser-cdn
    "https://trackcmp.net",
    "https://app.cal.com",
  ].join(' '),
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src 'self'",
    "data:",
    "blob:",
    "https://*.amazonaws.com",
    "https://images.unsplash.com",
    "https://www.notion.so",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://px.ads.linkedin.com",
    "https://*.licdn.com",
    "https://*.activehosted.com",
    "https://*.app-us1.com",
  ].join(' '),
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://px.ads.linkedin.com",
    "https://*.licdn.com",
    "https://*.activehosted.com",
    "https://*.app-us1.com", // AC Site Tracking POSTs aqui
    "https://trackcmp.net",
    "https://app.cal.com",
  ].join(' '),
  "frame-src 'self' https://app.cal.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
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
  // Remove o header `X-Powered-By: Next.js` (vaza info do servidor sem benefício)
  poweredByHeader: false,

  // Compressão gzip/brotli explícita (Vercel já faz por padrão, mas explícito é melhor)
  compress: true,

  // Tree-shake melhor de pacotes pesados — Next só inclui o que é importado
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
    ],
  },

  images: {
    remotePatterns: [
      // Notion: imagens de covers e fotos de autores hospedadas no S3 da Notion
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'www.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'notion.so',
      },
      // Imagens de uploads do Notion via CDN
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // CORS pros endpoints da extensão Chrome.
      // A extensão MV3 roda em origin chrome-extension://<id> e bate em
      // /api/extension/*. Sem CORS aberto aqui, browser bloqueia POST após
      // preflight OPTIONS. Restringir ao origin específico da extensão não
      // dá pq o id muda toda vez que recarrega unpacked.
      {
        source: '/api/extension/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
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

      // Produtos antigos (Wix) — como não vendemos mais, todos vão pra /materiais
      { source: '/produto/:slug*', destination: '/materiais', permanent: true },
      { source: '/category/all-products', destination: '/materiais', permanent: true },
      { source: '/category/kits', destination: '/materiais', permanent: true },
      { source: '/category/template-notion', destination: '/materiais', permanent: true },
      { source: '/recursos', destination: '/materiais', permanent: true },

      // Outras páginas Wix
      { source: '/caf%C3%A9-virtual-branding', destination: '/', permanent: true },
      { source: '/brandgpt-chat-arquetipo-de-marca', destination: '/solucoes/software-as-a-service', permanent: true },
      { source: '/conteudo-estrategico', destination: '/solucoes/content-as-a-service', permanent: true },
      { source: '/branding-e-construcao-de-marca', destination: '/solucoes/content-as-a-service', permanent: true },
      { source: '/mentoria-marca-pessoal', destination: '/materiais', permanent: true },
      { source: '/guia-proposta-de-valor', destination: '/blog', permanent: true },
      { source: '/pesquisa-panorama-de-branding-b2b-brasil', destination: '/blog', permanent: true },
      { source: '/diagnostico-de-branding-b2b', destination: '/', permanent: true },
      { source: '/category/:slug*', destination: '/blog', permanent: true },
      { source: '/blog/categories/:slug*', destination: '/blog', permanent: true },
      { source: '/members-area/:path*', destination: '/', permanent: false },

      // Casos de uso → páginas "Para" (novo IA)
      { source: '/casos-de-uso/marketing', destination: '/para/marketing', permanent: true },
      { source: '/casos-de-uso/social-selling', destination: '/para/vendas', permanent: true },
      { source: '/casos-de-uso/employer-branding', destination: '/para/rh', permanent: true },

      // ────────────────────────────────────────────────────────────
      // LEGAL — consolidado em /legal com âncoras
      // ────────────────────────────────────────────────────────────
      { source: '/privacidade', destination: '/legal#privacidade', permanent: true },
      { source: '/termos', destination: '/legal#termos', permanent: true },
      { source: '/cookies', destination: '/legal#cookies', permanent: true },
      { source: '/politica-de-privacidade', destination: '/legal#privacidade', permanent: true },
      { source: '/politica-de-cookies', destination: '/legal#cookies', permanent: true },
      { source: '/termos-de-uso', destination: '/legal#termos', permanent: true },
    ];
  },
};

export default nextConfig;
