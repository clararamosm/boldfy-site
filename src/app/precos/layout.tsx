import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preços · Boldfy',
  description:
    'Planos e preços da Boldfy. Escolha o número de colaboradores e veja quanto custa transformar o seu time em criadores de conteúdo autoral no LinkedIn.',
  openGraph: {
    title: 'Preços · Boldfy',
    description:
      'Planos e preços da Boldfy. Escolha o número de colaboradores e veja quanto custa transformar o seu time em criadores de conteúdo autoral no LinkedIn.',
    url: 'https://boldfy.com.br/precos',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Preços Boldfy · Content Intelligence para Employee-Led Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preços · Boldfy',
    description:
      'Planos e preços da Boldfy. Escolha o número de colaboradores e veja quanto custa transformar o seu time em criadores de conteúdo autoral no LinkedIn.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/precos',
  },
};

const offerJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Boldfy · Plataforma de Employee-Led Growth',
  description:
    'Plataforma SaaS que transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com IA contextual, gamificação, trilhas de aprendizagem e dashboard de métricas.',
  brand: {
    '@type': 'Brand',
    name: 'Boldfy',
  },
  url: 'https://boldfy.com.br/precos',
  offers: [
    {
      '@type': 'Offer',
      name: 'Plano até 10 colaboradores',
      priceCurrency: 'BRL',
      price: '499',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '499',
        priceCurrency: 'BRL',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitText: 'seat/mês',
        },
      },
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 10,
        unitText: 'colaboradores',
      },
      url: 'https://boldfy.com.br/precos',
      seller: {
        '@type': 'Organization',
        name: 'Boldfy',
      },
    },
    {
      '@type': 'Offer',
      name: 'Plano 11–20 colaboradores',
      priceCurrency: 'BRL',
      price: '449',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '449',
        priceCurrency: 'BRL',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitText: 'seat/mês',
        },
      },
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 11,
        maxValue: 20,
        unitText: 'colaboradores',
      },
      url: 'https://boldfy.com.br/precos',
      seller: {
        '@type': 'Organization',
        name: 'Boldfy',
      },
    },
    {
      '@type': 'Offer',
      name: 'Plano 21–40 colaboradores',
      priceCurrency: 'BRL',
      price: '399',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '399',
        priceCurrency: 'BRL',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitText: 'seat/mês',
        },
      },
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 21,
        maxValue: 40,
        unitText: 'colaboradores',
      },
      url: 'https://boldfy.com.br/precos',
      seller: {
        '@type': 'Organization',
        name: 'Boldfy',
      },
    },
    {
      '@type': 'Offer',
      name: 'Plano 41+ colaboradores',
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
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 41,
        unitText: 'colaboradores',
      },
      url: 'https://boldfy.com.br/precos',
      seller: {
        '@type': 'Organization',
        name: 'Boldfy',
      },
    },
  ],
};

export default function PrecosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }}
      />
      {children}
    </>
  );
}
