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
    <div className="absolute inset-x-4 bottom-4 z-[4] flex items-center gap-3 rounded-xl bg-card p-3 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-500">
        <TrendingUp className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Impressões orgânicas
        </p>
        <p className="font-headline text-lg font-black leading-none tracking-tight text-accent-foreground">
          128k
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          <strong className="font-bold text-emerald-500">+47%</strong> vs mês
          anterior
        </p>
      </div>
      {/* Mini bar chart */}
      <div className="flex h-7 shrink-0 items-end gap-0.5">
        {[35, 50, 42, 68, 78, 100].map((h, i) => (
          <div
            key={i}
            className="w-[5px] rounded-t-sm bg-gradient-to-t from-primary to-[#E875FF]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniVendas() {
  return (
    <div className="absolute inset-x-4 bottom-4 z-[4] flex items-center gap-2.5 rounded-xl border-l-[3px] border-l-blue-500 bg-card p-3 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[13px] font-bold text-white">
        JS
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
          Lead engajou
        </p>
        <p className="text-[11px] font-semibold leading-snug text-accent-foreground">
          <strong className="font-extrabold">João Silva</strong> (CMO @ Empresa
          X) viu seu post
        </p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">
          há 2 minutos · salvou o post
        </p>
      </div>
    </div>
  );
}

function MiniRh() {
  return (
    <div className="absolute inset-x-4 bottom-4 z-[4] rounded-xl bg-card p-3 shadow-[0_8px_24px_rgba(15,10,24,0.25),0_0_0_1px_rgba(205,80,241,0.12)]">
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
          <UserPlus className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="font-headline text-xs font-black leading-tight text-accent-foreground">
            Candidaturas Inbound
          </p>
          <p className="text-[9px] text-muted-foreground">
            Product Designer · últimos 30 dias
          </p>
        </div>
      </div>
      {/* Body */}
      <div className="flex items-center gap-2.5">
        <div>
          <p className="font-headline text-[26px] font-black leading-none tracking-tight text-pink-500">
            12
          </p>
          <span className="mt-0.5 inline-block rounded-full bg-pink-500/10 px-1.5 py-0.5 text-[9px] font-bold text-pink-500">
            qualificadas
          </span>
        </div>
        <p className="flex-1 text-[10px] leading-snug text-muted-foreground">
          Todas vieram de posts de colaboradores
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
    <div className="group relative flex flex-col overflow-hidden rounded-[20px] bg-card shadow-[0_20px_60px_rgba(15,10,24,0.35),0_0_0_1px_rgba(205,80,241,0.12)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(15,10,24,0.5),0_0_0_1px_rgba(205,80,241,0.25)]">
      {/* Colored dot */}
      <span
        className={`absolute right-[18px] top-[18px] z-[5] h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.6)] ${dotColor}`}
      />

      {/* Photo area — transparent bg so head overflows visually */}
      <div className="relative h-[260px] overflow-visible bg-transparent">
        <div className="relative h-full w-full">
          <Image
            src={photo}
            alt={tag}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
        {/* Mini-card floating */}
        {miniCard}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-7">
        {/* Tag */}
        <span
          className={`mb-3.5 inline-block self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${tagColor} ${tagBg}`}
        >
          {tag}
        </span>

        {/* Headline */}
        <h3 className="mb-2.5 font-headline text-[22px] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground lg:text-2xl">
          {headline}
        </h3>

        {/* Description */}
        <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>

        {/* Benefits */}
        <ul className="mb-5 flex flex-1 flex-col gap-2">
          {benefits.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-xs leading-snug text-foreground"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 border-t border-border pt-3 text-[13px] font-bold text-primary transition-all hover:gap-2.5"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      {/* Dark container — rounded, with gradient + glows */}
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-gradient-to-b from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-6 py-24 shadow-[0_20px_80px_rgba(45,20,69,0.25),0_0_0_1px_rgba(205,80,241,0.08)] md:px-12 md:py-28">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-[20%] top-[-10%] h-[600px] w-[600px] rounded-full bg-primary opacity-[0.22] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[10%] right-[-100px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.15] blur-[120px]" />
        <div className="pointer-events-none absolute left-[-80px] top-[50%] h-[400px] w-[400px] rounded-full bg-orange-500 opacity-[0.06] blur-[120px]" />

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

        <div className="relative z-10 mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-[820px] text-center md:mb-[72px]">
            <span className="mb-6 inline-block rounded-full border border-primary/25 bg-primary/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              {t.home.personasTag}
            </span>
            <h2 className="mb-4 font-headline text-[clamp(30px,4vw,46px)] font-black leading-[1.08] tracking-[-0.025em] text-white">
              {t.home.personasTitle}{' '}
              <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                {t.home.personasTitleHighlight}
              </span>
            </h2>
            <p className="mx-auto max-w-[640px] text-base leading-relaxed text-white/60">
              {t.home.personasSubtitle}
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {personas.map((p) => (
              <PersonaCard key={p.href} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
