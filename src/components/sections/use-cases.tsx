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
/*  Mini-cards (floating over the photo area)                          */
/* ------------------------------------------------------------------ */

function MiniMarketing() {
  return (
    <div className="absolute inset-x-3 bottom-3 z-[4] flex items-center gap-2.5 rounded-lg bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
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
            className="w-[4px] rounded-t-sm bg-gradient-to-t from-primary to-[#E875FF]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniVendas() {
  return (
    <div className="absolute inset-x-3 bottom-3 z-[4] flex items-center gap-2 rounded-lg border-l-[3px] border-l-blue-500 bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
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
    <div className="absolute inset-x-3 bottom-3 z-[4] rounded-lg bg-card p-2.5 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pink-500/10 text-pink-500">
          <UserPlus className="h-3 w-3" />
        </div>
        <div>
          <p className="font-headline text-[10px] font-black leading-tight text-accent-foreground">
            Candidaturas Inbound
          </p>
          <p className="text-[8px] text-muted-foreground">
            Product Designer · 30 dias
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div>
          <p className="font-headline text-xl font-black leading-none tracking-tight text-pink-500">
            12
          </p>
          <span className="mt-0.5 inline-block rounded-full bg-pink-500/10 px-1.5 py-0.5 text-[8px] font-bold text-pink-500">
            qualificadas
          </span>
        </div>
        <p className="flex-1 text-[9px] leading-snug text-muted-foreground">
          Todas de posts de colaboradores
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Persona Card                                                       */
/* ------------------------------------------------------------------ */

interface PersonaCardProps {
  tag: string;
  headline: string;
  description: string;
  benefits: string[];
  cta: string;
  href: string;
  photo: string;
  dotColor: string;
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
  dotColor,
  tagColor,
  tagBg,
  miniCard,
}: PersonaCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-card shadow-[0_16px_48px_rgba(15,10,24,0.3),0_0_0_1px_rgba(205,80,241,0.1)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_64px_rgba(15,10,24,0.45),0_0_0_1px_rgba(205,80,241,0.2)]">
      {/* Colored dot */}
      <span
        className={`absolute right-4 top-4 z-[5] h-2.5 w-2.5 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.5)] ${dotColor}`}
      />

      {/* Photo area — overflow visible so head extends above card edge */}
      <div className="relative h-[220px] overflow-hidden rounded-t-2xl bg-gradient-to-b from-[#1A0E2E] to-[#2D1445]">
        <Image
          src={photo}
          alt={tag}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 360px"
        />
        {/* Mini-card floating */}
        {miniCard}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
        {/* Tag */}
        <span
          className={`mb-3 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tagColor} ${tagBg}`}
        >
          {tag}
        </span>

        {/* Headline */}
        <h3 className="mb-2 font-headline text-lg font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground lg:text-xl">
          {headline}
        </h3>

        {/* Description */}
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
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
      dotColor: 'bg-emerald-500',
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
      dotColor: 'bg-blue-500',
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
      dotColor: 'bg-pink-500',
      tagColor: 'text-pink-600',
      tagBg: 'bg-pink-500/10',
      miniCard: <MiniRh />,
    },
  ];

  return (
    <section className="relative px-4 py-16 md:px-6 md:py-24">
      {/* Dark container */}
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-gradient-to-b from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-5 py-16 shadow-[0_20px_80px_rgba(45,20,69,0.25),0_0_0_1px_rgba(205,80,241,0.08)] md:px-10 md:py-20">
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
          <div className="mx-auto mb-12 max-w-[680px] text-center md:mb-14">
            <span className="mb-5 inline-block rounded-full border border-primary/25 bg-primary/[0.12] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              {t.home.personasTag}
            </span>
            <h2 className="mb-3 font-headline text-[clamp(26px,3.5vw,40px)] font-black leading-[1.1] tracking-[-0.025em] text-white">
              {t.home.personasTitle}{' '}
              <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                {t.home.personasTitleHighlight}
              </span>
            </h2>
            <p className="mx-auto max-w-[540px] text-sm leading-relaxed text-white/55">
              {t.home.personasSubtitle}
            </p>
          </div>

          {/* Cards grid */}
          <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {personas.map((p) => (
              <PersonaCard key={p.href} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
