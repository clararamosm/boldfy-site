'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  Wrench,
  Trophy,
  TrendingUp,
  Users,
  BarChart3,
  CalendarCheck,
  Rocket,
  Monitor,
  PenTool,
} from 'lucide-react';

export function MarketingClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const c = t
  const { openPopup } = useDemoPopup();.paraMarketing;

  const solutions = [
    { label: c.sol1Label, desc: c.sol1Desc, icon: Compass },
    { label: c.sol2Label, desc: c.sol2Desc, icon: Wrench },
    { label: c.sol3Label, desc: c.sol3Desc, icon: Trophy },
  ];

  const results = [c.result1, c.result2, c.result3, c.result4];

  const caseMonths = [
    { month: 'M1', label: 'Setup + onboarding do time', color: 'bg-green-500/10 text-green-600' },
    { month: 'M2', label: 'Primeiros posts autorais saindo', color: 'bg-green-500/20 text-green-600' },
    { month: 'M3', label: 'Gamificação engaja, ritmo se forma', color: 'bg-green-500/30 text-green-700' },
    { month: 'M4-M6', label: 'Impressões escalam, listas de remarketing crescem', color: 'bg-green-500/40 text-green-700' },
    { month: 'M6-M12', label: 'Canal orgânico começa a impactar CAC', color: 'bg-green-500/50 text-green-800' },
  ];

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-green-600 mb-4">
            {c.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-black text-accent-foreground leading-tight mb-2 max-w-4xl mx-auto">
            {c.heroTitle}{' '}
            <span className="text-primary">{c.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 mt-6 leading-relaxed">
            {c.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button  size="lg" className="font-bold" onClick={openPopup}>
              
                {c.heroCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              
            </Button>
            <Button  variant="outline" size="lg" onClick={openPopup}>
              {c.heroCta2}
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2 — A dor */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-6">
              {c.painTitle}
            </h2>
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>{c.painBody}</p>
              <p>{c.painBody2}</p>
              <p>{c.painBody3}</p>
            </div>
            <p className="mt-6 text-base font-semibold text-accent-foreground leading-relaxed">
              {c.painConclusion}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Como resolve */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {c.solutionTitle}
          </h2>
          <p className="text-base text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            {c.solutionIntro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {solutions.map((sol, idx) => (
              <div
                key={sol.label}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md hover:border-green-500/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 mb-4">
                  <sol.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-accent-foreground mb-2">
                  <span className="text-green-600 mr-1">{idx + 1}.</span> {sol.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{sol.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
            <h3 className="text-sm font-bold text-accent-foreground mb-3 uppercase tracking-wide">
              Resultado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((result) => (
                <div key={result} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{result}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Numbers */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {c.numbersTitle}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            {c.numbersNote}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Users className="h-6 w-6 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-accent-foreground">10</p>
              <p className="text-sm text-muted-foreground mt-1">colaboradores ativos</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-accent-foreground">50k+</p>
              <p className="text-sm text-muted-foreground mt-1">impressões/mês</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-accent-foreground">R$ 15k</p>
              <p className="text-sm text-muted-foreground mt-1">valor equivalente em mídia</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Rocket className="h-6 w-6 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-accent-foreground">3x</p>
              <p className="text-sm text-muted-foreground mt-1">ROI sobre investimento</p>
            </div>
          </div>

          <Button  variant="outline" size="lg" onClick={openPopup}>
              {c.numbersCta}
            </Button>
        </div>
      </section>

      {/* Section 5 — Caso ilustrativo */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {c.caseTitle}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            {c.caseNote}
          </p>

          <div className="space-y-4">
            {caseMonths.map((item) => (
              <div
                key={item.month}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <span className={`inline-flex items-center justify-center h-10 min-w-[3.5rem] rounded-lg px-3 text-sm font-bold ${item.color}`}>
                  {item.month}
                </span>
                <p className="text-sm text-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 italic">
            Nota: caso de uso ilustrativo baseado em progressão típica do método Boldfy.
          </p>
        </div>
      </section>

      {/* Section 6 — Qual solução */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {c.pathTitle}
          </h2>
          <p className="text-base text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            {c.pathBody}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/solucoes/saas"
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md hover:border-primary/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-accent-foreground mb-2 group-hover:text-primary transition-colors">
                Plataforma SaaS
              </h3>
              <p className="text-sm text-muted-foreground">
                IA contextual, gamificação, trilhas e dashboard. O time produz conteúdo autoral com método e ferramentas.
              </p>
            </Link>

            <Link
              href="/solucoes/content-as-a-service"
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md hover:border-orange-500/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 mb-4">
                <PenTool className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-accent-foreground mb-2 group-hover:text-orange-500 transition-colors">
                Content as a Service
              </h3>
              <p className="text-sm text-muted-foreground">
                Design embutido na plataforma ou ativação executiva completa. Produção com método e escala.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 7 — CTA Final */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-8">
            {c.ctaTitle}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button  size="lg" className="font-bold" onClick={openPopup}>
              
                {c.ctaCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              
            </Button>
            <Button  variant="outline" size="lg" onClick={openPopup}>
              {c.ctaCta2}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
