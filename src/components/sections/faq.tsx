'use client';

import { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/context';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Single FAQ item (card-style accordion)                             */
/* ------------------------------------------------------------------ */

interface FaqItemProps {
  question: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, children, isOpen, onToggle }: FaqItemProps) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border bg-card transition-all duration-250 ${
        isOpen
          ? 'border-primary shadow-[0_8px_24px_rgba(205,80,241,0.12)]'
          : 'border-border hover:border-primary/35'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-[22px] text-left transition-colors hover:text-primary"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-bold leading-[1.35] text-accent-foreground">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-primary transition-transform duration-350 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
          }}
        />
      </button>

      <div
        className={`grid transition-all duration-400 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-[22px] text-sm leading-[1.65] text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                        */
/* ------------------------------------------------------------------ */

export function FaqSection() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setOpenIndex((prev) => (prev === idx ? null : idx));

  /* JSON-LD for SEO */
  const faqPairs = useMemo(
    () => [
      { q: t.home.faq1Q, a: t.home.faq1A },
      { q: t.home.faq2Q, a: t.home.faq2A },
      {
        q: t.home.faq3Q,
        a: `${t.home.faq3A_intro} ${t.home.faq3A_plataforma} ${t.home.faq3A_design} ${t.home.faq3A_content}`,
      },
      { q: t.home.faq4Q, a: t.home.faq4A },
      { q: t.home.faq5Q, a: `${t.home.faq5A_p1} ${t.home.faq5A_p2}` },
      { q: t.home.faq6Q, a: t.home.faq6A },
    ],
    [t],
  );

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqPairs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      }),
    [faqPairs],
  );

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background px-6 pb-10 pt-[100px] md:px-12"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute right-[-100px] top-[10%] h-[600px] w-[600px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="relative z-10 mx-auto max-w-[900px]">
        {/* Header */}
        <div className="mb-14 text-center">
          <span className="mb-6 inline-block rounded-full border border-primary/[0.22] bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.faqTag}
          </span>
          <h2 className="font-headline text-[clamp(28px,3.6vw,42px)] font-black leading-[1.1] tracking-[-0.025em] text-accent-foreground">
            {t.home.faqTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.faqTitleHighlight}
            </span>
          </h2>
        </div>

        {/* FAQ list */}
        <div className="flex flex-col gap-3">
          {/* 1 */}
          <FaqItem
            question={t.home.faq1Q}
            isOpen={openIndex === 0}
            onToggle={() => toggle(0)}
          >
            <p>{t.home.faq1A}</p>
          </FaqItem>

          {/* 2 */}
          <FaqItem
            question={t.home.faq2Q}
            isOpen={openIndex === 1}
            onToggle={() => toggle(1)}
          >
            <p>{t.home.faq2A}</p>
          </FaqItem>

          {/* 3 — has intro + bullet list */}
          <FaqItem
            question={t.home.faq3Q}
            isOpen={openIndex === 2}
            onToggle={() => toggle(2)}
          >
            <p className="mb-3">{t.home.faq3A_intro}</p>
            <ul className="flex flex-col gap-1.5 pl-0">
              {[
                t.home.faq3A_plataforma,
                t.home.faq3A_design,
                t.home.faq3A_content,
              ].map((item) => (
                <li key={item} className="relative pl-[18px]">
                  <span className="absolute left-1 top-[10px] h-[5px] w-[5px] rounded-full bg-primary" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.replace(
                        /^([^:]+:)/,
                        '<strong class="font-bold text-accent-foreground">$1</strong>',
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </FaqItem>

          {/* 4 */}
          <FaqItem
            question={t.home.faq4Q}
            isOpen={openIndex === 3}
            onToggle={() => toggle(3)}
          >
            <p>
              {t.home.faq4A.split('Content Full-Service')[0]}
              <strong className="font-bold text-accent-foreground">
                Content Full-Service
              </strong>
              {t.home.faq4A.split('Content Full-Service')[1]}
            </p>
          </FaqItem>

          {/* 5 — two paragraphs */}
          <FaqItem
            question={t.home.faq5Q}
            isOpen={openIndex === 4}
            onToggle={() => toggle(4)}
          >
            <p className="mb-3">
              {t.home.faq5A_p1.split('lista dos perfis que engajaram')[0]}
              <strong className="font-bold text-accent-foreground">
                lista dos perfis que engajaram
              </strong>
              {t.home.faq5A_p1.split('lista dos perfis que engajaram')[1]}
            </p>
            <p>{t.home.faq5A_p2}</p>
          </FaqItem>

          {/* 6 */}
          <FaqItem
            question={t.home.faq6Q}
            isOpen={openIndex === 5}
            onToggle={() => toggle(5)}
          >
            <p>
              Você usa o{' '}
              <Link
                href="/precos"
                className="font-bold text-primary border-b-[1.5px] border-primary/35 transition-colors hover:border-primary"
              >
                simulador em /preços
              </Link>{' '}
              pra montar seu pacote em tempo real: quantos colaboradores na
              plataforma, quantos designs por mês, quantos executivos a gente
              ativa. Você sai de lá com o preço exato e a proposta formatada.
              Sem reunião pra saber quanto custa.
            </p>
          </FaqItem>
        </div>
      </div>
    </section>
  );
}
