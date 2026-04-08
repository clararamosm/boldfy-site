import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: {
    default: 'Boldfy — Plataforma de Employee Advocacy Gamificada',
    template: '%s | Boldfy',
  },
  description:
    'Transforme colaboradores em embaixadores da marca com IA contextual, trilhas de aprendizagem, gamificação e recompensas. Plataforma SaaS B2B para Employee Advocacy.',
  metadataBase: new URL('https://boldfy.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://boldfy.com.br',
    siteName: 'Boldfy',
    title: 'Boldfy — Plataforma de Employee Advocacy Gamificada',
    description:
      'Transforme colaboradores em embaixadores da marca com IA contextual, trilhas de aprendizagem, gamificação e recompensas.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy — Plataforma de Employee Advocacy Gamificada',
    description:
      'Transforme colaboradores em embaixadores da marca com IA contextual, trilhas de aprendizagem, gamificação e recompensas.',
  },
  robots: {
    index: true,
    follow: true,
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
