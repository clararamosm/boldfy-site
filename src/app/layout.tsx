import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: {
    default: 'Boldfy · Content Intelligence para Employee-Led Growth',
    template: '%s | Boldfy',
  },
  description:
    'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
  metadataBase: new URL('https://boldfy.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://boldfy.com.br',
    siteName: 'Boldfy',
    title: 'Boldfy · Content Intelligence para Employee-Led Growth',
    description:
      'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Content Intelligence para Employee-Led Growth',
    description:
      'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Boldfy',
  legalName: 'Boldfy',
  url: 'https://boldfy.com.br',
  logo: 'https://boldfy.com.br/images/boldfy-logo-white.svg',
  description:
    'Content Intelligence para Employee-Led Growth. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, combinando plataforma SaaS com serviço especializado (CaaS).',
  email: 'contato@boldfy.com.br',
  telephone: '+55-11-91368-8100',
  sameAs: [
    'https://www.linkedin.com/company/boldfy-branding',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BR',
    addressRegion: 'SP',
  },
  founder: {
    '@type': 'Person',
    name: 'Clara Ramos',
    jobTitle: 'Founder',
  },
  knowsAbout: [
    'Employee Advocacy',
    'Employee-Led Growth',
    'Content Intelligence',
    'LinkedIn Marketing',
    'B2B Content Strategy',
    'Social Selling',
    'Employer Branding',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Boldfy',
  url: 'https://boldfy.com.br',
  inLanguage: 'pt-BR',
  publisher: {
    '@type': 'Organization',
    name: 'Boldfy',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://boldfy.com.br/blog?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
