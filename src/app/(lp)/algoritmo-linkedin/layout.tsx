import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report: O Algoritmo do LinkedIn Mudou Tudo · Boldfy',
  description:
    'Análise completa da atualização 360Brew do LinkedIn em 2026: o que mudou no alcance, no perfil como sinal de distribuição e nos formatos que o algoritmo recompensa. Baixe gratuitamente.',
  openGraph: {
    title: 'Report: O Algoritmo do LinkedIn Mudou Tudo · Boldfy',
    description:
      'Análise completa da atualização 360Brew do LinkedIn em 2026: o que mudou e o que precisa mudar na sua estratégia de conteúdo agora.',
    url: 'https://boldfy.com.br/algoritmo-linkedin',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Report Boldfy · O Algoritmo do LinkedIn Mudou Tudo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Report: O Algoritmo do LinkedIn Mudou Tudo · Boldfy',
    description:
      'Análise completa da atualização 360Brew do LinkedIn em 2026: o que mudou e o que precisa mudar na sua estratégia de conteúdo agora.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/algoritmo-linkedin',
  },
};

// Schema.org Report — descreve o material como um conteúdo de pesquisa
// pra ajudar o Google a indexar como recurso de download.
const reportJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Report',
  name: 'O Algoritmo do LinkedIn Mudou Tudo — Análise da atualização 360Brew',
  alternateName: 'Algoritmo LinkedIn 2026',
  description:
    'Relatório de pesquisa Boldfy de março de 2026 sobre a atualização 360Brew do LinkedIn: alcance, perfil como sinal de distribuição, identidade, formatos recompensados e penalizados.',
  datePublished: '2026-03-01',
  inLanguage: 'pt-BR',
  isAccessibleForFree: true,
  publisher: {
    '@type': 'Organization',
    name: 'Boldfy',
    url: 'https://boldfy.com.br',
  },
  about: [
    'LinkedIn Algorithm 2026',
    '360Brew',
    'Employee-Led Growth',
    'B2B Content Strategy',
  ],
};

export default function AlgoritmoLinkedinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reportJsonLd) }}
      />
      {children}
    </>
  );
}
