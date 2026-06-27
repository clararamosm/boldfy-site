import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Semrush TLG · Bastidores de uma estratégia global · Boldfy',
  description:
    'Como a Semrush transformou dezenas de colaboradores em porta-vozes da marca e gerou +500k de alcance adicional em 2 meses. Leitura de bastidores do programa de Employee-Led Growth que virou referência global. Baixe o case gratuitamente.',
  openGraph: {
    title: 'Case Semrush TLG · Bastidores de uma estratégia global · Boldfy',
    description:
      'O case de Employee-Led Growth da Semrush: +500k de alcance em 2 meses, R$ 360 mil em earned media, e o método que virou produto. Baixe gratuitamente.',
    url: 'https://boldfy.com.br/case-semrush',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Case Semrush TLG · Boldfy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Case Semrush TLG · Bastidores de uma estratégia global · Boldfy',
    description:
      'O case de Employee-Led Growth da Semrush: +500k de alcance em 2 meses, R$ 360 mil em earned media. Baixe gratuitamente.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/case-semrush',
  },
};

// Schema.org Article — case é leitura analítica/editorial, não relatório de
// pesquisa primária. Article rende melhor pro Google entender que é um
// artigo de análise com autora (Clara) e publisher (Boldfy).
const caseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Case Semrush · O programa de Employee-Led Growth que virou referência global',
  alternateName: 'Case Semrush TLG',
  description:
    'Leitura de bastidores do programa de employee advocacy da Semrush: três pilares (conteúdo, apoio direto, amplificação contextual), os clusters de variação visual, e os resultados em alcance e earned media.',
  datePublished: '2026-05-01',
  inLanguage: 'pt-BR',
  isAccessibleForFree: true,
  author: {
    '@type': 'Person',
    name: 'Clara Ramos',
    url: 'https://www.linkedin.com/in/clararramos/',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Boldfy',
    url: 'https://boldfy.com.br',
  },
  about: [
    'Employee-Led Growth',
    'Employee Advocacy',
    'Semrush',
    'B2B SaaS',
    'Distribuição Orgânica',
  ],
};

export default function CaseSemrushLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseJsonLd) }}
      />
      {children}
    </>
  );
}
