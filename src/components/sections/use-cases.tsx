'use client';

import { useT } from '@/lib/i18n/context';
import {
  ArrowRight,
  Check,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Mini-cards (floating over the photo)                               */
/* ------------------------------------------------------------------ */

function MiniMarketing() {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[4] flex items-center gap-2.5 rounded-lg bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
        <TrendingUp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
          Impressões orgânicas
        </p>
        <p className="font-headline text-base font-black leading-none tracking-tight text-accent-foreground">
          128k
        </p>
        <p className="text-[9px] text-muted-foreground">
          <strong className="font-bold text-emerald-500">+47%</strong> vs mês anterior
        </p>
      </div>
      <div className="flex h-6 shrink-0 items-end gap-0.5">
        {[35, 50, 42, 68, 78, 100].map((h, i) => (
          <div
            key={i}
            className="w-[4px] rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniVendas() {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[4] flex items-center gap-2 rounded-lg border-l-[3px] border-l-blue-500 bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-bold text-white">
        JS
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-bold uppercase tracking-wider text-blue-500">
          Lead engajou
        </p>
        <p className="text-[10px] font-semibold leading-snug text-accent-foreground">
          <strong className="font-extrabold">João Silva</strong> (CMO) viu seu post
        </p>
        <p className="text-[8px] text-muted-foreground">
          há 2 min · salvou o post
        </p>
      </div>
    </div>
  );
}

function MiniRh() {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[4] flex items-center gap-2.5 rounded-lg bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
        <UserPlus className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
          Candidaturas inbound
        </p>
        <p className="font-headline text-base font-black leading-none tracking-tight text-accent-foreground">
          12{' '}
          <span className="text-[9px] font-bold text-pink-500">qualificadas</span>
        </p>
        <p className="text-[9px] text-muted-foreground">
          Todas de posts de colaboradores
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Persona Card — 2-box structure                                     */
/*  Top: photo (transparent PNG, no border, no bg)                     */
/*  Bottom: white box (flat top, rounded bottom) with text             */
/* ------------------------------------------------------------------ */

interface PersonaCardProps {
  tag: string;
  headline: string;
  description: string;
  benefits: string[];
  cta: string;
  href: string;
  photo: string;
  tagColor: string;
  tagBg: string;
  miniCard: React.ReactNode;
}

function PersonaCard({
  tag,
  headline,
  description,
  benefits,
  cta,
  href,
  photo,
  tagColor,
  tagBg,
  miniCard,
}: PersonaCardProps) {
  return (
    <div className="group flex flex-col transition-all duration-300 hover:-translate-y-1.5">
      {/* ─── Top box: Photo (transparent, no borders, no bg) ─── */}
      <div className="relative h-[280px]">
        <Image
          src={photo}
          alt={tag}
          fill
          className="object-contain object-bottom"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 340px"
        />
        {/* Mini-card floating on the photo */}
        {miniCard}
      </div>

      {/* ─── Bottom box: White card (flat top, rounded bottom) ─── */}
      <div className="relative flex flex-1 flex-col rounded-b-2xl border border-t-0 border-border bg-card px-5 pb-5 pt-5 shadow-[0_12px_40px_rgba(15,10,24,0.15)]">
        {/* Top edge line for visual separation */}
        <div className="absolute inset-x-0 top-0 h-px bg-border" />

        {/* Tag */}
        <span
          className={`mb-2.5 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tagColor} ${tagBg}`}
        >
          {tag}
        </span>

        {/* Headline */}
        <h3 className="mb-1.5 font-headline text-[17px] font-black leading-[1.2] tracking-[-0.02em] text-accent-foreground lg:text-lg">
          {headline}
        </h3>

        {/* Description */}
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>

        {/* Benefits */}
        <ul className="mb-4 flex flex-1 flex-col gap-1.5">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex items-start gap-1.5 text-[11px] leading-snug text-foreground"
            >
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 border-t border-border pt-3 text-xs font-bold text-primary transition-all hover:gap-2.5"
        >
          {cta}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export function UseCasesSection() {
  const t = useT();

  const personas: PersonaCardProps[] = [
    {
      tag: t.home.ucMarketingTitle,
      headline: t.home.ucMarketingHeadline,
      description: t.home.ucMarketingDesc,
      benefits: [
        t.home.ucMarketingBenefit1,
        t.home.ucMarketingBenefit2,
        t.home.ucMarketingBenefit3,
      ],
      cta: t.home.ucMarketingCta,
      href: '/para/marketing',
      photo: '/images/persona-marketing.png',
      tagColor: 'text-emerald-600',
      tagBg: 'bg-emerald-500/10',
      miniCard: <MiniMarketing />,
    },
    {
      tag: t.home.ucVendasTitle,
      headline: t.home.ucVendasHeadline,
      description: t.home.ucVendasDesc,
      benefits: [
        t.home.ucVendasBenefit1,
        t.home.ucVendasBenefit2,
        t.home.ucVendasBenefit3,
      ],
      cta: t.home.ucVendasCta,
      href: '/para/vendas',
      photo: '/images/persona-comercial.png',
      tagColor: 'text-blue-600',
      tagBg: 'bg-blue-500/10',
      miniCard: <MiniVendas />,
    },
    {
      tag: t.home.ucRhTitle,
      headline: t.home.ucRhHeadline,
      description: t.home.ucRhDesc,
      benefits: [
        t.home.ucRhBenefit1,
        t.home.ucRhBenefit2,
        t.home.ucRhBenefit3,
      ],
      cta: t.home.ucRhCta,
      href: '/para/rh',
      photo: '/images/persona-rh.png',
      tagColor: 'text-pink-600',
      tagBg: 'bg-pink-500/10',
      miniCard: <MiniRh />,
    },
  ];

  return (
    <section className="relative px-4 py-10 md:px-6 md:py-14">
      {/* Dark container */}
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-gradient-to-b from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-5 py-14 shadow-[0_20px_80px_rgba(45,20,69,0.25),0_0_0_1px_rgba(205,80,241,0.08)] md:px-10 md:py-16">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-[20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary opacity-[0.18] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[10%] right-[-80px] h-[400px] w-[400px] rounded-full bg-[#E875FF] opacity-[0.12] blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(205,80,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.05) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="mx-auto mb-10 max-w-[720px] text-center md:mb-12">
            <span className="mb-4 inline-block rounded-full border border-primary/25 bg-primary/[0.12] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              {t.home.personasTag}
            </span>
            <h2 className="mb-2 font-headline text-[clamp(22px,3vw,34px)] font-black leading-[1.1] tracking-[-0.025em] text-white">
              {t.home.personasTitle}{' '}
              <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                {t.home.personasTitleHighlight}
              </span>
            </h2>
            <p className="text-[13px] leading-normal text-white/55">
              {t.home.personasSubtitle}
            </p>
          </div>

          {/* Cards grid */}
          <div className="mx-auto grid max-w-[1020px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {personas.map((p) => (
              <PersonaCard key={p.href} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
