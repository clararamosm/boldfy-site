import type { Metadata } from 'next';
import SaasPageClient from './saas-client';

export const metadata: Metadata = {
  title: 'Boldfy · Plataforma de influenciadores corporativos',
  description:
    'O SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn. IA contextual, gamificação, trilhas de aprendizagem e dashboard com métricas reais.',
  openGraph: {
    title: 'Boldfy · Plataforma de influenciadores corporativos',
    description:
      'O SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn. IA contextual, gamificação, trilhas de aprendizagem e dashboard com métricas reais.',
    url: 'https://boldfy.com.br/solucoes/software-as-a-service',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Plataforma de influenciadores corporativos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Plataforma de influenciadores corporativos',
    description:
      'O SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn. IA contextual, gamificação, trilhas de aprendizagem e dashboard com métricas reais.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/solucoes/software-as-a-service',
  },
};

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Boldfy',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://boldfy.com.br/solucoes/software-as-a-service',
  description:
    'Plataforma SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com IA contextual, gamificação, trilhas de aprendizagem e dashboard com métricas reais de alcance e engajamento.',
  featureList: [
    'IA contextual para criação de conteúdo',
    'Gamificação e ranking de colaboradores',
    'Trilhas de aprendizagem personalizadas',
    'Dashboard de métricas e analytics',
    'Gestão de times e colaboradores',
    'Integração com LinkedIn',
  ],
  provider: {
    '@type': 'Organization',
    name: 'Boldfy',
    url: 'https://boldfy.com.br',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'BRL',
    price: '349',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '349',
      priceCurrency: 'BRL',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: '1',
        unitText: 'seat/mês',
      },
    },
    url: 'https://boldfy.com.br/precos',
  },
};

export default function SaasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <SaasPageClient />
    </>
  );
}
