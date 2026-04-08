'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Trophy,
  GraduationCap,
  BarChart3,
  BookOpen,
  Shield,
  Check,
  Monitor,
} from 'lucide-react';

export default function SaasPageClient() {
  const t = useT();

  const features = [
    {
      icon: Sparkles,
      title: t.solucoesSaas.feature1Title,
      desc: t.solucoesSaas.feature1Desc,
    },
    {
      icon: Trophy,
      title: t.solucoesSaas.feature2Title,
      desc: t.solucoesSaas.feature2Desc,
    },
    {
      icon: GraduationCap,
      title: t.solucoesSaas.feature3Title,
      desc: t.solucoesSaas.feature3Desc,
    },
    {
      icon: BarChart3,
      title: t.solucoesSaas.feature4Title,
      desc: t.solucoesSaas.feature4Desc,
    },
    {
      icon: BookOpen,
      title: t.solucoesSaas.feature5Title,
      desc: t.solucoesSaas.feature5Desc,
    },
  ];

  const steps = [
    { label: t.solucoesSaas.daily1Label, desc: t.solucoesSaas.daily1Desc },
    { label: t.solucoesSaas.daily2Label, desc: t.solucoesSaas.daily2Desc },
    { label: t.solucoesSaas.daily3Label, desc: t.solucoesSaas.daily3Desc },
    { label: t.solucoesSaas.daily4Label, desc: t.solucoesSaas.daily4Desc },
  ];

  const securityItems = [
    t.solucoesSaas.sec1,
    t.solucoesSaas.sec2,
    t.solucoesSaas.sec3,
    t.solucoesSaas.sec4,
    t.solucoesSaas.sec5,
  ];

  return (
    <>
      {/* ── Section 1: Hero ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {t.solucoesSaas.heroTag}
          </span>

          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-accent-foreground leading-tight mb-6 max-w-4xl mx-auto">
            {t.solucoesSaas.heroTitle}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.solucoesSaas.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="font-bold w-full sm:w-auto">
              <Link href="/precos">
                {t.solucoesSaas.heroCta1}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/contato">{t.solucoesSaas.heroCta2}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Para quem e ── */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-headline text-xl md:text-2xl lg:text-3xl font-bold text-accent-foreground leading-tight mb-8 text-center">
            {t.solucoesSaas.forWhoTitle}
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            {t.solucoesSaas.forWhoBody}
          </p>

          <p className="text-base md:text-lg font-bold text-accent-foreground">
            {t.solucoesSaas.forWhoConclusion}
          </p>
        </div>
      </section>

      {/* ── Section 3: Features ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold text-accent-foreground mb-16 text-center">
            {t.solucoesSaas.featuresTitle}
          </h2>

          <div className="space-y-20">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              const isEven = i % 2 === 0;

              return (
                <div
                  key={feat.title}
                  className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16`}
                >
                  {/* Text side */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-headline text-lg md:text-xl font-bold text-accent-foreground">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  {/* Image placeholder */}
                  <div className="flex-1 w-full">
                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-1 shadow-lg shadow-primary/5">
                      <div className="rounded-xl bg-white/80 backdrop-blur overflow-hidden">
                        <div className="relative aspect-[4/3] flex items-center justify-center bg-secondary/20">
                          <div className="text-center">
                            <Monitor className="h-10 w-10 text-primary/25 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground/50">
                              {feat.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 4: Como funciona ── */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold text-accent-foreground mb-16 text-center">
            {t.solucoesSaas.dailyTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.label} className="relative">
                {/* Step number */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm mb-4">
                  {i + 1}
                </div>

                {/* Connector line (hidden on last item and on mobile) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-10 w-[calc(100%-2.5rem)] h-px bg-border" />
                )}

                <h3 className="font-headline text-base font-bold text-accent-foreground mb-2">
                  {step.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Seguranca ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground">
              {t.solucoesSaas.securityTitle}
            </h2>
          </div>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 text-center max-w-3xl mx-auto">
            {t.solucoesSaas.securityBody}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Comparacao ── */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-6">
            {t.solucoesSaas.comparisonTitle}
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto">
            {t.solucoesSaas.comparisonBody}
          </p>

          <div className="rounded-xl border border-border bg-card p-8 inline-block">
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link href="/solucoes/content-as-a-service">
                {t.solucoesSaas.comparisonCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Section 7: CTA Final ── */}
      <section className="py-20 md:py-28 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold text-accent-foreground mb-10">
            {t.solucoesSaas.ctaTitle}
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="font-bold w-full sm:w-auto">
              <Link href="/precos">
                {t.solucoesSaas.ctaCta1}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/contato">{t.solucoesSaas.ctaCta2}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
