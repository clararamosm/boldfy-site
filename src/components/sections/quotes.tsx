'use client';

import { useT } from '@/lib/i18n/context';

interface QuoteCardProps {
  name: string;
  role: string;
  quote: string;
}

function QuoteCard({ name, role, quote }: QuoteCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 border-l-4 border-l-primary">
      <p className="text-sm md:text-base text-foreground italic leading-relaxed mb-4">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function QuotesSection() {
  const t = useT();

  const quotes: QuoteCardProps[] = [
    {
      name: t.home.renateName,
      role: t.home.renataRole,
      quote: t.home.renataQuote,
    },
    {
      name: t.home.fernandoName,
      role: t.home.fernandoRole,
      quote: t.home.fernandoQuote,
    },
    {
      name: t.home.camilaName,
      role: t.home.camilaRole,
      quote: t.home.camilaQuote,
    },
    {
      name: t.home.marceloName,
      role: t.home.marceloRole,
      quote: t.home.marceloQuote,
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map((q) => (
            <QuoteCard key={q.name} {...q} />
          ))}
        </div>
      </div>
    </section>
  );
}
