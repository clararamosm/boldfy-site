import type { Metadata } from 'next';
import { HeroSection } from '@/components/sections/hero';
import { ProblemSection } from '@/components/sections/problem';
import { UseCasesSection } from '@/components/sections/use-cases';
import { ProductMotionSection } from '@/components/sections/product-motion';
import { SolutionsBentoSection } from '@/components/sections/solutions-bento';
import { ManifestoSection } from '@/components/sections/manifesto';
import { FaqSection } from '@/components/sections/faq';
import { CtaFinalSection } from '@/components/sections/cta-final';

export const metadata: Metadata = {
  title: 'Boldfy · Content Intelligence para Employee-Led Growth',
  description:
    'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
  openGraph: {
    title: 'Boldfy · Content Intelligence para Employee-Led Growth',
    description:
      'O maior canal de aquisição da sua empresa já bate ponto todo dia. A Boldfy transforma colaboradores em criadores de conteúdo autoral no LinkedIn, com estratégia, produção, IA e gamificação.',
    url: 'https://boldfy.com.br',
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
  alternates: {
    canonical: 'https://boldfy.com.br',
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <UseCasesSection />
      <ProductMotionSection />
      <SolutionsBentoSection />
      <ManifestoSection />
      <FaqSection />
      <CtaFinalSection />
    </>
  );
}
