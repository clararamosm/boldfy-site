'use client';

import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import Link from 'next/link';
import { ArrowRight, Check, AlertTriangle, Lightbulb, BarChart3, MessageSquareQuote } from 'lucide-react';

interface UseCasePageProps {
  heroTag: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  persona: string;
  problemTitle: string;
  problems: string[];
  solutionTitle: string;
  solutions: string[];
  metricsTitle: string;
  metrics: string[];
  objectionTitle: string;
  objectionAnswer: string;
  ctaButton: string;
}

export function UseCasePageLayout(props: UseCasePageProps) {
  const { openPopup } = useDemoPopup();
  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {props.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-black text-accent-foreground leading-tight mb-4 max-w-3xl mx-auto">
            {props.heroTitle}{' '}
            <span className="text-primary">{props.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            {props.heroSubtitle}
          </p>
          <p className="text-sm font-medium text-primary/80 mb-8">{props.persona}</p>
          <Button  size="lg" className="font-bold" onClick={() => openPopup('caso-de-uso:hero')}>

              {props.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />

            </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 bg-destructive/5">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground">
              {props.problemTitle}
            </h2>
          </div>
          <ul className="space-y-4">
            {props.problems.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground">
              {props.solutionTitle}
            </h2>
          </div>
          <ul className="space-y-4">
            {props.solutions.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{s}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground">
              {props.metricsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {props.metrics.map((m) => (
              <div key={m} className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objection */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8">
            <div className="flex items-start gap-3 mb-4">
              <MessageSquareQuote className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <h3 className="font-headline text-lg font-black text-accent-foreground">{props.objectionTitle}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-8">
              {props.objectionAnswer}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Button  size="lg" className="font-bold" onClick={() => openPopup('caso-de-uso:cta-final')}>

              {props.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />

            </Button>
        </div>
      </section>
    </>
  );
}
