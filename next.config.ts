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

  async redirects() {
    return [
      // Top artigos Wix → /blog
      { source: '/post/personalidade-de-marca-no-branding', destination: '/blog', permanent: false },
      { source: '/post/marcas-cores-e-case-nubank', destination: '/blog', permanent: false },
      { source: '/post/mulheres-no-branding-e-case-always', destination: '/blog', permanent: false },
      { source: '/post/proposta-de-valor-e-netflix', destination: '/blog', permanent: false },
      { source: '/post/branding-sonoro-e-case-tudum-netflix', destination: '/blog', permanent: false },
      { source: '/post/brand-persona-e-lu-do-magalu', destination: '/blog', permanent: false },
      { source: '/post/atributos-de-marca-e-coca-cola', destination: '/blog', permanent: false },
      { source: '/post/ritual-de-marca-6-passos-pra-montar-o-seu-e-case-jack-daniel-s', destination: '/blog', permanent: false },
      { source: '/post/valor-do-design-e-case-starbucks', destination: '/blog', permanent: false },
      { source: '/post/dopamina-no-branding-e-case-duolingo', destination: '/blog', permanent: false },
      { source: '/post/marca-branding-pessoal-pra-profissionais', destination: '/blog', permanent: false },
      { source: '/post/influenciadores-corporativos-conteúdo-gerado-por-colaboradores-e-case-globo', destination: '/blog', permanent: false },
      { source: '/post/tendencias-de-design-visual-2024', destination: '/blog', permanent: false },
      { source: '/post/futuro-trafego-pago-e-branding', destination: '/blog', permanent: false },
      { source: '/post/brand-equity-e-case-supreme', destination: '/blog', permanent: false },
      { source: '/post/7-estrategias-de-branding-b2b-em-2025', destination: '/blog', permanent: false },
      { source: '/post/branding-as-a-service-o-que-é', destination: '/blog', permanent: false },
      { source: '/post/personalidade-de-marca-e-aff-the-hype', destination: '/blog', permanent: false },
      { source: '/post/diferenciacao-no-branding-e-liquid-death', destination: '/blog', permanent: false },
      { source: '/post/rebranding-e-case-seara', destination: '/blog', permanent: false },
      { source: '/post/personal-branding-marca-pessoal-e-case-nat-arcuri', destination: '/blog', permanent: false },
      { source: '/post/10-princípios-do-bom-design-de-dieter-rams', destination: '/blog', permanent: false },
      { source: '/post/diferença-entre-marketing-e-branding', destination: '/blog', permanent: false },
      { source: '/post/o-que-é-branding-percepção-de-valor-de-marca', destination: '/blog', permanent: false },

      // Catch-all: qualquer /post/* → /blog
      { source: '/post/:slug*', destination: '/blog', permanent: false },

      // Páginas de produto Wix → rotas existentes
      { source: '/produto/planejamento-de-conteudo-template-notion', destination: '/solucoes/software-as-a-service', permanent: false },
      { source: '/produto/kit-mentoria-de-marca-pessoal', destination: '/solucoes/content-as-a-service', permanent: false },
      { source: '/produto/plano-de-acoes-notion', destination: '/solucoes/software-as-a-service', permanent: false },
      { source: '/produto/:slug*', destination: '/', permanent: false },

      // Outras páginas Wix → rotas existentes
      { source: '/café-virtual-branding', destination: '/', permanent: false },
      { source: '/brandgpt-chat-arquetipo-de-marca', destination: '/solucoes/software-as-a-service', permanent: false },
      { source: '/conteudo-estrategico', destination: '/solucoes/content-as-a-service', permanent: false },
      { source: '/branding-e-construcao-de-marca', destination: '/solucoes/content-as-a-service', permanent: false },
      { source: '/mentoria-marca-pessoal', destination: '/solucoes/content-as-a-service', permanent: false },
      { source: '/guia-proposta-de-valor', destination: '/blog', permanent: false },
      { source: '/pesquisa-panorama-de-branding-b2b-brasil', destination: '/blog', permanent: false },
      { source: '/diagnostico-de-branding-b2b', destination: '/', permanent: false },
      { source: '/category/:slug*', destination: '/blog', permanent: false },
      { source: '/blog/categories/:slug*', destination: '/blog', permanent: false },
      { source: '/members-area/:path*', destination: '/', permanent: false },

      // Casos de uso → páginas "Para"
      { source: '/casos-de-uso/marketing', destination: '/para/marketing', permanent: true },
      { source: '/casos-de-uso/social-selling', destination: '/para/vendas', permanent: true },
      { source: '/casos-de-uso/employer-branding', destination: '/para/rh', permanent: true },
    ];
  },
};

export default nextConfig;
