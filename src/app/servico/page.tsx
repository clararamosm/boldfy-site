'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Check, X, UserCheck, Lightbulb, PenTool, BarChart3 } from 'lucide-react';

export default function ServicoPage() {
  const t = useT();

  const forWho = [t.servico.forWho1, t.servico.forWho2, t.servico.forWho3, t.servico.forWho4];
  const included = [
    t.servico.included1, t.servico.included2, t.servico.included3,
    t.servico.included4, t.servico.included5, t.servico.included6,
  ];

  const comparisons = [
    { label: t.servico.comparison1, platform: true, service: true },
    { label: t.servico.comparison2, platform: true, service: true },
    { label: t.servico.comparison3, platform: false, service: true },
    { label: t.servico.comparison4, platform: false, service: true },
    { label: t.servico.comparison5, platform: false, service: true },
    { label: t.servico.comparison6, platform: false, service: true },
    { label: t.servico.comparison7, platform: false, service: true },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {t.servico.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-bold text-accent-foreground leading-tight mb-4 max-w-3xl mx-auto">
            {t.servico.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.servico.heroSubtitle}
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link href="/contato">
              {t.servico.heroCta}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* For who */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-8 text-center">
            {t.servico.forWhoTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {forWho.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
                <UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-8 text-center">
            {t.servico.includedTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-8 text-center">
            {t.servico.comparisonTitle}
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-border bg-secondary/50 px-4 py-3">
              <div />
              <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
                {t.servico.platformLabel}
              </p>
              <p className="text-xs font-semibold text-center text-primary uppercase tracking-wide">
                {t.servico.serviceLabel}
              </p>
            </div>
            {/* Rows */}
            {comparisons.map((row) => (
              <div key={row.label} className="grid grid-cols-3 items-center border-b border-border/50 px-4 py-3 last:border-b-0">
                <p className="text-sm text-foreground">{row.label}</p>
                <div className="flex justify-center">
                  {row.platform ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex justify-center">
                  {row.service ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-3">
            {t.servico.ctaTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            {t.servico.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/contato">
                {t.servico.ctaCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/precos">{t.servico.ctaCta2}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
