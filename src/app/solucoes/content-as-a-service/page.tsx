import type { Metadata } from 'next';
import { CaasClient } from './caas-client';

export const metadata: Metadata = {
  title: 'Boldfy · Content as a Service',
  description:
    'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
  openGraph: {
    title: 'Boldfy · Content as a Service',
    description:
      'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
    url: 'https://boldfy.com.br/solucoes/content-as-a-service',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Content as a Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Content as a Service',
    description:
      'Produção de conteúdo autoral para executivos e times de marketing enxutos. Design integrado à plataforma ou ativação completa de perfis C-level, preservando a voz de quem assina.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/solucoes/content-as-a-service',
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Content as a Service · Boldfy',
  serviceType: 'Produção de conteúdo para LinkedIn',
  description:
    'Serviço de produção de conteúdo autoral para executivos e times de marketing. A Boldfy cuida de estratégia, criação, design e publicação no LinkedIn, preservando a voz de quem assina.',
  provider: {
    '@type': 'Organization',
    name: 'Boldfy',
    url: 'https://boldfy.com.br',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Brasil',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Executivos, CEOs, times de marketing B2B',
  },
  url: 'https://boldfy.com.br/solucoes/content-as-a-service',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Modalidades de Content as a Service',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Design integrado à plataforma',
          description:
            'Produção de peças visuais integradas à plataforma Boldfy para colaboradores que já usam o SaaS.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Ativação completa de perfis C-level',
          description:
            'Serviço completo de estratégia, criação e publicação de conteúdo para executivos C-level no LinkedIn.',
        },
      },
    ],
  },
};

export default function CaasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <CaasClient />
    </>
  );
}
