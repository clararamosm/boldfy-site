'use client';

import { useT } from '@/lib/i18n/context';
import { useProposalBuilder } from '@/components/proposal-builder';
import {
  ArrowRight,
  Monitor,
  Rocket,
  Clock,
  Palette,
  MessageSquare,
  Mic,
  UserCheck,
} from 'lucide-react';
import Image from 'next/image';

/* ================================================================== */
/*  Visual 1 — Plataforma (SaaS): avatars + stats                      */
/*  (mesmo visual da home)                                             */
/* ================================================================== */

const avatars = Array.from({ length: 10 }, (_, i) => ({
  src: `/images/avatar-${i + 1}.jpeg`,
  alt: `Colaborador ${i + 1}`,
}));

function VisualPlataforma() {
  return (
    <div className="mb-5 rounded-[14px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Seu time na plataforma
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          10 colaboradores
        </span>
      </div>

      <div className="mb-3 flex items-center pl-3">
        {avatars.map((a, i) => (
          <div
            key={a.src}
            className="-ml-3 h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-card shadow-sm transition-transform hover:-translate-y-1 hover:z-10"
            style={{ zIndex: i }}
          >
            <Image
              src={a.src}
              alt={a.alt}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            4.850
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            pontos distribuídos
          </p>
        </div>
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            128k
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            impressões do mês
          </p>
        </div>
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            <span className="text-[11px] font-bold text-muted-foreground">
              R$
            </span>
            38,4k
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            em mídia paga equivalente
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Visual 2 — Produção (CaaS): 3 mini cards                           */
/*  (mesmo visual da home)                                             */
/* ================================================================== */

function VisualProducao() {
  const items = [
    {
      icon: Clock,
      title: 'Estratégia',
      sub: 'Narrativa e pilares',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      icon: Palette,
      title: 'Design',
      sub: 'Peças sob demanda',
      iconBg: 'bg-amber-400/15 text-amber-500',
    },
    {
      icon: MessageSquare,
      title: 'Operação',
      sub: 'Publica e mede',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-3 gap-2 rounded-[14px] border border-border bg-background p-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${item.iconBg}`}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </div>
          <p className="font-headline text-[11px] font-black leading-tight text-accent-foreground">
            {item.title}
          </p>
          <p className="text-[9px] text-muted-foreground">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Pricing Tiers — SaaS (faixas de colaboradores + Enterprise)        */
/* ================================================================== */

interface TierProps {
  range: string;
  price: string;
  seatMonth: string;
  highlighted?: boolean;
}

function TierCard({ range, price, seatMonth, highlighted }: TierProps) {
  return (
    <div
      className={`rounded-lg border p-3 text-center transition-all ${
        highlighted
          ? 'border-primary bg-primary/[0.06] shadow-[0_4px_12px_rgba(205,80,241,0.14)]'
          : 'border-border bg-background hover:border-primary/30'
      }`}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {range}
      </p>
      <p className="font-headline text-[18px] font-black leading-none text-primary">
        {price}
      </p>
      <p className="mt-1 text-[9px] text-muted-foreground">{seatMonth}</p>
    </div>
  );
}

/* ================================================================== */
/*  Pricing Card — CaaS Modo                                           */
/* ================================================================== */

function CaasModeCard({
  icon: Icon,
  title,
  subtitle,
  price,
}: {
  icon: typeof Palette;
  title: string;
  subtitle: string;
  price: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-[#5E2A67]/40">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: 'rgba(94,42,103,0.12)', color: '#5E2A67' }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="font-headline text-[13px] font-black leading-tight text-accent-foreground">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-1 border-t border-border pt-3">
        <span className="text-[10px] text-muted-foreground">a partir de</span>
        <span
          className="font-headline text-[18px] font-black leading-none"
          style={{ color: '#5E2A67' }}
        >
          {price}
        </span>
        <span className="text-[10px] text-muted-foreground">/mês</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function PrecosPage() {
  const t = useT();
  const { openBuilder } = useProposalBuilder();

  const tiers: TierProps[] = [
    {
      range: t.precos.tier1Range,
      price: t.precos.tier1Price,
      seatMonth: t.precos.seatMonth,
    },
    {
      range: t.precos.tier2Range,
      price: t.precos.tier2Price,
      seatMonth: t.precos.seatMonth,
      highlighted: true,
    },
    {
      range: t.precos.tier3Range,
      price: t.precos.tier3Price,
      seatMonth: t.precos.seatMonth,
    },
    {
      range: t.precos.tier4Range,
      price: t.precos.tier4Price,
      seatMonth: t.precos.seatMonth,
    },
  ];

  return (
    <section className="relative bg-background px-6 py-20 md:px-12 md:py-28">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-[-100px] top-[-10%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header — mesmo pretag/título da home "Dois caminhos. Um sistema." */}
        <div className="mx-auto mb-14 max-w-[1100px] text-center md:mb-16">
          <span className="mb-5 inline-block rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.solutionsTag}
          </span>
          <h1 className="mb-4 font-headline text-[clamp(28px,4vw,44px)] font-black leading-[1.08] tracking-[-0.025em] text-accent-foreground">
            {t.home.solutionsTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.solutionsTitleHighlight}
            </span>
          </h1>
          <p className="mx-auto max-w-[720px] text-base leading-relaxed text-muted-foreground">
            Escolha o caminho — ou combine os dois. Preços transparentes, sem reunião pra saber
            quanto custa.
          </p>
        </div>

        {/* 2-card grid — Plataforma + Produção com preços dentro */}
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {/* ═══════════════════════════════════════════════════
              Card 1: Plataforma (SaaS) — com pricing por faixas
             ═══════════════════════════════════════════════════ */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] md:p-8">
            {/* Tag */}
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Monitor className="h-3 w-3" />
              {t.home.solSaasTag}
            </span>

            {/* Title + desc */}
            <h2 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solSaasTitle}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solSaasDesc}
            </p>

            {/* Visual — mesmo da home */}
            <VisualPlataforma />

            {/* Pricing tiers — 4 faixas de colaboradores */}
            <div className="mb-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Preço por colaborador/mês
              </p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {tiers.map((tier) => (
                  <TierCard key={tier.range} {...tier} />
                ))}
              </div>
            </div>

            {/* Enterprise tier — destaque separado */}
            <div className="mb-5 flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  {t.precos.tier5Range}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Preço personalizado para volumes grandes
                </p>
              </div>
              <p className="font-headline text-[14px] font-black text-primary">
                {t.precos.enterprisePrice}
              </p>
            </div>

            {/* CTA único — Monte sua proposta */}
            <button
              type="button"
              onClick={() => openBuilder('precos:saas')}
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_10px_24px_rgba(205,80,241,0.38)]"
            >
              Montar proposta personalizada
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════
              Card 2: Produção (CaaS) — com pricing dos 2 modos
             ═══════════════════════════════════════════════════ */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] md:p-8">
            {/* Tag */}
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Rocket className="h-3 w-3" />
              {t.home.solCaasTag}
            </span>

            {/* Title + desc */}
            <h2 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solCaasTitle}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solCaasDesc}
            </p>

            {/* Visual — mesmo da home */}
            <VisualProducao />

            {/* Pricing — 2 modos CaaS */}
            <div className="mb-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Dois modos, preços separados
              </p>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                <CaasModeCard
                  icon={Palette}
                  title="Modo Design"
                  subtitle="Peças pra biblioteca"
                  price={`R$ ${t.home.solCaasSub1Price}`}
                />
                <CaasModeCard
                  icon={Mic}
                  title="Modo Executivo"
                  subtitle="Ativação completa"
                  price={`R$ ${t.home.solCaasSub2Price}`}
                />
              </div>
            </div>

            {/* CTA único — Monte sua proposta */}
            <button
              type="button"
              onClick={() => openBuilder('precos:caas')}
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_10px_24px_rgba(205,80,241,0.38)]"
            >
              Montar proposta personalizada
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Account manager card — mesmo da home, compartilhado pelos 2 caminhos */}
        <div className="mx-auto mt-10 max-w-[860px] rounded-[18px] border border-primary/25 bg-card p-5 shadow-[0_10px_28px_rgba(205,80,241,0.08)] md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-primary/[0.12] text-primary">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1.5 font-headline text-[17px] font-black leading-tight tracking-[-0.015em] text-accent-foreground md:text-[19px]">
                {t.home.solutionsAmTitle}{' '}
                <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                  {t.home.solutionsAmHighlight}
                </span>
                .
              </h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground md:text-sm">
                {t.home.solutionsAmBody}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
