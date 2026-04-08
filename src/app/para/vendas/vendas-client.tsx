'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  MessageSquare,
  Clock,
  Inbox,
  Medal,
  Trophy,
  Monitor,
  PenTool,
} from 'lucide-react';

export function VendasClient() {
  const t = useT();
  const c = t.paraVendas;

  const solutions = [
    { label: c.sol1Label, desc: c.sol1Desc, icon: MessageSquare },
    { label: c.sol2Label, desc: c.sol2Desc, icon: Clock },
    { label: c.sol3Label, desc: c.sol3Desc, icon: Inbox },
    { label: c.sol4Label, desc: c.sol4Desc, icon: Medal },
  ];

  const caseMonths = [
    { month: 'M1', label: 'Setup + onboarding dos vendedores', color: 'bg-blue-500/10 text-blue-600' },
    { month: 'M2', label: 'Primeiros posts de autoridade técnica', color: 'bg-blue-500/20 text-blue-600' },
    { month: 'M3', label: 'Ranking engaja, competição saudável se forma', color: 'bg-blue-500/30 text-blue-700' },
    { month: 'M4-M6', label: 'Prospects reconhecem nomes, taxa de resposta sobe', color: 'bg-blue-500/40 text-blue-700' },
    { month: 'M6-M12', label: 'Inbound passivo começa, ciclo de vendas encurta', color: 'bg-blue-500/50 text-blue-800' },
  ];

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-blue-600 mb-4">
            {c.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-bold text-accent-foreground leading-tight mb-2 max-w-4xl mx-auto">
            {c.heroTitle}{' '}
            <span className="text-primary">{c.heroTitleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 mt-6 leading-relaxed">
            {c.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/precos">
                {c.heroCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contato">{c.heroCta2}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2 — A dor */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-6">
              {c.painTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {c.painBody}
            </p>
            <p className="text-base font-semibold text-accent-foreground leading-relaxed">
              {c.painConclusion}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Como resolve */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
            {c.solutionTitle}
          </h2>
          <p className="text-base text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            {c.solutionBody}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((sol, idx) => (
              <div
                key={sol.label}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md hover:border-blue-500/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 mb-4">
                  <sol.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-accent-foreground mb-2">
                  <span className="text-blue-600 mr-1">{idx + 1}.</span> {sol.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Gamification */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 mb-6">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
              {c.gamTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {c.gamBody}
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Caso ilustrativo */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-10">
            Como seria no seu time comercial.
          </h2>

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
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
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
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-8">
            {c.ctaTitle}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/precos">
                {c.ctaCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contato">{c.ctaCta2}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
