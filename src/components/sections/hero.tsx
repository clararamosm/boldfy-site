'use client';

import { useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Trophy,
  Clock,
  BookOpen,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import Image from 'next/image';

/* -------------------------------------------------------------------------- */
/*  Floating card: Pontos (sits behind person)                                 */
/* -------------------------------------------------------------------------- */

function CardPontos() {
  return (
    <div className="w-[165px] rounded-2xl border border-border/40 bg-card p-3.5 shadow-lg shadow-primary/10">
      <div className="mb-1.5 flex items-center gap-1.5 text-primary">
        <Trophy className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Pontos
        </span>
      </div>
      <p className="font-headline text-[26px] font-black leading-none tracking-tight text-accent-foreground">
        1.240
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        <strong className="font-bold text-emerald-500">+340</strong> esta semana
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating card: Trilha (sits behind person)                                 */
/* -------------------------------------------------------------------------- */

function CardTrilha() {
  return (
    <div className="w-[250px] rounded-2xl border border-border/40 bg-card p-3.5 shadow-lg shadow-primary/10">
      {/* Tag */}
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
        <Clock className="h-[11px] w-[11px]" />
        Em progresso
      </span>

      <p className="font-headline text-[15px] font-black leading-snug tracking-tight text-accent-foreground">
        Marca Corporativa
      </p>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Fundamentos da identidade da sua marca
      </p>

      {/* Chips */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {[
          { icon: BookOpen, label: '2 módulos' },
          { icon: Zap, label: '90 pts' },
          { icon: Clock, label: '30 min' },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground"
          >
            <Icon className="h-[10px] w-[10px]" />
            {label}
          </span>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>1/2 módulos</span>
        <span>50%</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-primary/10">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-[#E875FF]" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating card: IA Assistant (sits in front of person)                      */
/* -------------------------------------------------------------------------- */

function CardIA() {
  return (
    <div className="hero-card-ia-glow w-[280px] rounded-2xl border border-border/40 bg-card p-[18px] shadow-xl shadow-primary/15">
      {/* Tag */}
      <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-[11px] w-[11px]" />
        Assistente de Conteúdo
      </span>

      <p className="font-headline text-[16px] font-black tracking-tight text-accent-foreground">
        Crie sua legenda
      </p>
      <p className="mb-3.5 text-[11px] leading-relaxed text-muted-foreground">
        Escreva sua ideia e nossa IA sugere o melhor formato
      </p>

      {/* Fake textarea */}
      <div className="mb-3 min-h-[56px] rounded-[10px] border border-primary/15 bg-background p-3 text-[12px] leading-relaxed text-foreground">
        Como construímos autoridade no LinkedIn sem virar mais um perfil
        corporativo de fachada
        <span className="ml-0.5 inline-block h-3 w-px animate-hero-blink bg-primary align-middle" />
      </div>

      {/* Options */}
      <div className="mb-3.5 flex gap-1.5">
        {['LinkedIn', 'Híbrido', 'Texto denso'].map((opt, i) => (
          <span
            key={opt}
            className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {opt}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-br from-primary to-[#E875FF] px-4 py-3 text-[12px] font-bold text-white shadow-lg shadow-primary/30">
        <Sparkles className="h-[13px] w-[13px]" />
        Gerar Legenda
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero Section                                                               */
/* -------------------------------------------------------------------------- */

export function HeroSection() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const visualRef = useRef<HTMLDivElement>(null);

  /* Parallax on scroll */
  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const cards = visual.querySelectorAll<HTMLElement>('[data-parallax]');
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const rect = visual!.getBoundingClientRect();
        if (rect.bottom < 0) {
          ticking = false;
          return;
        }
        cards.forEach((card) => {
          const speed = parseFloat(card.dataset.parallax ?? '0');
          card.style.transform = `translateY(${scrollY * speed}px)`;
        });
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen bg-background px-6 pb-10 pt-20 md:px-12 md:pb-12 md:pt-20">
      {/* ── Ambient glows ── */}
      <div className="pointer-events-none absolute -right-[150px] -top-[10%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.14] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[100px] -left-[50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.10] blur-[120px]" />
      <div className="pointer-events-none absolute left-[35%] top-1/2 h-[400px] w-[400px] rounded-full bg-orange-500 opacity-[0.04] blur-[120px]" />

      {/* ── Grid pattern ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary) / 0.055) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* ── Grid container ── */}
      <div className="relative mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* ════════════ LEFT COLUMN: Text ════════════ */}
        <div className="relative z-10">
          {/* Badge */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-2 text-[12px] font-semibold text-primary">
            <span className="hero-pulse h-2 w-2 rounded-full bg-primary" />
            {t.home.heroTag}
          </div>

          {/* Title */}
          <h1 className="mb-7 font-headline text-4xl font-black leading-[1.02] tracking-[-0.035em] text-accent-foreground sm:text-5xl lg:text-[clamp(40px,5vw,66px)]">
            {t.home.heroTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.heroTitleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 max-w-[540px] text-base leading-relaxed text-muted-foreground md:text-[17px]">
            {t.home.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3.5">
            <Button
              size="lg"
              className="gap-2.5 rounded-xl px-7 py-4 text-[15px] font-bold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              onClick={openBuilder}
            >
              {t.home.heroCta1}
              <ArrowRight className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl border-border bg-card px-7 py-4 text-[15px] font-bold transition-all hover:border-primary hover:text-primary"
              onClick={openPopup}
            >
              {t.home.heroCta2}
            </Button>
          </div>
        </div>

        {/* ════════════ RIGHT COLUMN: Visual ════════════ */}
        {/*
          Simple layering:
          z-2  → Person photo (hero-person.png, transparent bg, already cropped)
          z-5  → All 3 floating cards on top
        */}
        <div
          ref={visualRef}
          className="relative hidden h-[680px] lg:block"
        >
          {/* Halo behind everything */}
          <div className="pointer-events-none absolute left-[40%] top-[5%] z-[1] h-[80%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,hsl(var(--primary)/0.18)_0%,transparent_65%)] blur-[60px]" />

          {/* ── Person photo (z-2) — transparent PNG, no border, no card styling ── */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-[2] flex items-start justify-center">
            <div className="relative h-full w-[460px]">
              <Image
                src="/images/hero-person.png"
                alt="Profissional criando conteúdo no LinkedIn com a plataforma Boldfy"
                fill
                className="object-contain object-top"
                priority
                sizes="460px"
              />
            </div>
          </div>

          {/* ── Floating cards on top of the photo (z-5) ── */}
          {/* Pontos — top-left */}
          <div
            className="absolute left-[-2%] top-[2%] z-[5] animate-hero-float"
            data-parallax="0.15"
          >
            <CardPontos />
          </div>

          {/* Trilha — bottom-left */}
          <div
            className="absolute left-[-8%] bottom-[8%] z-[5] animate-hero-float-slow"
            data-parallax="0.25"
          >
            <CardTrilha />
          </div>

          {/* Card IA — right side */}
          <div
            className="absolute right-[-40px] top-[38%] z-[5] animate-hero-float-reverse"
            data-parallax="-0.18"
          >
            <CardIA />
          </div>
        </div>
      </div>
    </section>
  );
}
