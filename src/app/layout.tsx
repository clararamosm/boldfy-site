import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import {
  ConditionalHeader,
  ConditionalFooter,
} from '@/components/layout/conditional-chrome';
import { GTMScript, GTMNoScript } from '@/components/analytics/gtm';
import { GA4Script } from '@/components/analytics/ga4';
import { LinkedInInsightScript } from '@/components/analytics/linkedin-insight';
import { ActiveCampaignTracking } from '@/components/analytics/ac-site-tracking';
import {
  ConsentBanner,
  ConsentModeDefaults,
} from '@/components/analytics/consent-banner';
import { InternalTrafficMarker } from '@/components/analytics/internal-traffic-marker';

// Fontes self-hosted via next/font (sem render-blocking, com preload automático)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-headline',
  display: 'swap',
});

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
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Content Intelligence para Employee-Led Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Content Intelligence para Employee-Led Growth',
    description:
      'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
    images: ['/images/og-default.jpg'],
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
  email: 'admin@boldfy.com.br',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * Detecta páginas internas (CRM/Dashboard/Catálogo/UTM/Settings) pra
   * NÃO carregar scripts de analytics — só Clara + equipe acessam, esses
   * pageviews enviesam totais de sessions/users do GA4 e do dashboard.
   *
   * Pathname vem via header x-pathname setado pelo middleware. Fallback
   * pra carregar tudo em caso de ausência (build-time/SSG cache).
   *
   * Cobre /internal/* (CRM, dashboards, etc) E /proposta/* (propostas
   * privadas geradas pra clientes específicos — não fazem parte do
   * tráfego público que faz sentido medir).
   */
  const h = await headers();
  const pathname = h.get('x-pathname') ?? '';
  const isInternalRoute = pathname.startsWith('/internal') || pathname.startsWith('/proposta');

  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${inter.variable} ${nunitoSans.variable}`}
    >
      <head>
        {/* Analytics scripts: SOMENTE em páginas públicas. /internal e /proposta
            ficam fora pra não inflar métricas. */}
        {!isInternalRoute ? (
          <>
            {/* Consent Mode v2 defaults — precisa rodar antes do GTM */}
            <ConsentModeDefaults />

            {/* Google Tag Manager — orquestra GA4 + LinkedIn Insight Tag */}
            <GTMScript />

            {/* Fallbacks pra quem não quiser usar GTM (ficam inativos enquanto GTM estiver ativo) */}
            <GA4Script />
            <LinkedInInsightScript />

            {/* ActiveCampaign Site Tracking (VGO) — pode coexistir com GTM */}
            <ActiveCampaignTracking />
          </>
        ) : null}

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
        {/* GTM noscript fallback — só em páginas públicas (matchando o GTMScript acima) */}
        {!isInternalRoute ? <GTMNoScript /> : null}

        <Providers>
          {!isInternalRoute ? <InternalTrafficMarker /> : null}
          <ConditionalHeader />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
          {!isInternalRoute ? <ConsentBanner /> : null}
        </Providers>
      </body>
    </html>
  );
}
