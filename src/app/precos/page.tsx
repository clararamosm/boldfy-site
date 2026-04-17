'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import { BattleCardTrigger } from '@/components/battle-card';
import { ArrowRight, Check, Sparkles, Users, Palette, Mic, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/* -------------------------------------------------------------------------- */
/*  FAQ Accordion (card-style, matching home design)                            */
/* -------------------------------------------------------------------------- */

function PrecosFaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, idx) => (
        <div
          key={faq.q}
          className={`overflow-hidden rounded-[14px] border bg-card transition-all duration-250 ${
            openIndex === idx
              ? 'border-primary shadow-[0_8px_24px_rgba(205,80,241,0.12)]'
              : 'border-border hover:border-primary/35'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setOpenIndex((prev) => (prev === idx ? null : idx))
            }
            className="flex w-full items-center justify-between gap-4 px-6 py-[22px] text-left transition-colors hover:text-primary"
            aria-expanded={openIndex === idx}
          >
            <span className="text-[15px] font-bold leading-[1.35] text-accent-foreground">
              {faq.q}
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-primary transition-transform duration-350 ${
                openIndex === idx ? 'rotate-180' : ''
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
              }}
            />
          </button>
          <div
            className={`grid transition-all duration-400 ${
              openIndex === idx
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
            }}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-[22px] text-sm leading-[1.65] text-muted-foreground">
                {faq.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Platform pricing card                                                      */
/* -------------------------------------------------------------------------- */

interface PricingCardProps {
  range: string;
  price: string;
  seatMonth: string;
  highlighted?: boolean;
}

function PricingCard({ range, price, seatMonth, highlighted }: PricingCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 text-center transition-shadow ${
        highlighted
          ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <p className="text-sm font-semibold text-foreground mb-2">{range}</p>
      <p className="text-3xl font-extrabold text-primary mb-1">{price}</p>
      <p className="text-xs text-muted-foreground">{seatMonth}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PrecosPage() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();

  const tiers: PricingCardProps[] = [
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

  const included = [
    t.precos.included1,
    t.precos.included2,
    t.precos.included3,
    t.precos.included4,
    t.precos.included5,
    t.precos.included6,
  ];

  const faqs = [
    { q: t.precos.faq1Q, a: t.precos.faq1A },
    { q: t.precos.faq2Q, a: t.precos.faq2A },
    { q: t.precos.faq3Q, a: t.precos.faq3A },
    { q: t.precos.faq4Q, a: t.precos.faq4A },
    { q: t.precos.faq5Q, a: t.precos.faq5A },
    { q: t.precos.faq6Q, a: t.precos.faq6A },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {t.precos.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-black text-accent-foreground leading-tight mb-4 max-w-3xl mx-auto">
            {t.precos.heroTitle}
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto mb-6">
            {t.precos.heroSubtitle}
          </p>
          <BattleCardTrigger source="precos:hero" variant="pill" />
        </div>
      </section>

      {/* ── Platform pricing (static) ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-accent-foreground">
              Software as a Service
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <PricingCard key={tier.range} {...tier} />
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-4 rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              {t.precos.tier5Range}
            </p>
            <p className="text-xl font-bold text-primary mb-3">
              {t.precos.enterprisePrice}
            </p>
            <Button variant="outline" size="sm" onClick={() => openPopup('precos:enterprise')}>
              {t.precos.enterpriseCta}
            </Button>
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-8 text-center">
            {t.precos.includedTitle}
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

      {/* ── Add-on services preview ── */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3 text-center">
            Content as a Service
          </h2>
          <p className="text-sm text-muted-foreground mb-2 max-w-lg mx-auto text-center">
            Dois modos que vivem dentro da mesma plataforma, operados pelo estrategista Boldfy. Combine com o SaaS ou contrate separado.
          </p>
          <div className="mb-8 flex justify-center">
            <BattleCardTrigger source="precos:caas-intro" variant="ghost" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modo Design */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(94,42,103,0.12)' }}>
                  <Palette className="h-5 w-5" style={{ color: '#5E2A67' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-accent-foreground">Content as a Service · Modo Design</h3>
                  <p className="text-[11px] text-muted-foreground">Peças gráficas pra biblioteca da empresa</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Carrosséis, infográficos e templates de marca alinhados com o Brand Context. O estrategista produz, o time usa.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">A partir de</span>
                <span className="text-lg font-bold" style={{ color: '#5E2A67' }}>R$ 1.600</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
            </div>

            {/* Modo Executivo */}
            <div className="rounded-xl border bg-card p-6" style={{ borderColor: 'rgba(94,42,103,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ backgroundColor: 'rgba(94,42,103,0.12)' }}>
                  <Mic className="h-5 w-5" style={{ color: '#5E2A67' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-accent-foreground">Content as a Service · Modo Executivo</h3>
                  <p className="text-[11px] text-muted-foreground">Ativação completa de thought leaders</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Estratégia de posicionamento, produção autoral e publicação. O executivo só aprova e conecta o LinkedIn.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">A partir de</span>
                <span className="text-lg font-bold" style={{ color: '#5E2A67' }}>R$ 3.500</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA: Proposal builder ── */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3">
            Monte sua proposta personalizada
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Configure o pacote ideal para sua empresa em menos de 2 minutos. Sem reunião para saber o preço.
          </p>
          <Button size="lg" className="font-bold gap-2" onClick={() => openBuilder('precos:simulador')}>
            Montar meu pacote
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── CaaS preview ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3">
            {t.precos.tier2PreviewTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            {t.precos.tier2PreviewDesc}
          </p>
          <Button variant="outline" asChild>
            <a href="/solucoes/content-as-a-service">
              {t.precos.tier2PreviewCta}
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative overflow-hidden bg-background px-6 py-[80px] md:px-12">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute right-[-100px] top-[10%] h-[600px] w-[600px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(205,80,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.055) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <div className="mb-14 text-center">
            <span className="mb-6 inline-block rounded-full border border-primary/[0.22] bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              Dúvidas frequentes
            </span>
            <h2 className="font-headline text-[clamp(28px,3.6vw,42px)] font-black leading-[1.1] tracking-[-0.025em] text-accent-foreground">
              {t.precos.faqTitle}
            </h2>
          </div>

          <PrecosFaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3">
            {t.precos.ctaTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            {t.precos.ctaSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="font-bold gap-2" onClick={() => openBuilder('precos:cta-final')}>
              Montar meu pacote
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="font-bold" onClick={() => openPopup('precos:cta-final')}>
              {t.precos.ctaButton}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
