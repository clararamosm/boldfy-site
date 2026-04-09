'use client';

import { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/context';
import { ChevronDown } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-primary"
        aria-expanded={isOpen}
      >
        <span className="text-base md:text-lg font-semibold text-accent-foreground">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm md:text-base text-muted-foreground leading-relaxed pr-8">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = useMemo(
    () => [
      { q: t.home.faq1Q, a: t.home.faq1A },
      { q: t.home.faq2Q, a: t.home.faq2A },
      { q: t.home.faq3Q, a: t.home.faq3A },
      { q: t.home.faq4Q, a: t.home.faq4A },
      { q: t.home.faq5Q, a: t.home.faq5A },
      { q: t.home.faq6Q, a: t.home.faq6A },
    ],
    [t],
  );

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      }),
    [faqs],
  );

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        <h2 className="font-headline text-2xl md:text-4xl font-black text-accent-foreground text-center mb-12 max-w-2xl mx-auto">
          {t.home.faqTitle}
        </h2>

        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, idx) => (
            <FaqItem
              key={idx}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === idx}
              onToggle={() =>
                setOpenIndex((prev) => (prev === idx ? null : idx))
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
