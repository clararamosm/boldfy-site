'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Shield, MessageCircle, Sparkles, Users, Palette, Mic } from 'lucide-react';

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
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            {t.precos.heroSubtitle}
          </p>
        </div>
      </section>

      {/* ── Platform pricing (static) ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-accent-foreground">
              Plataforma SaaS
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
            <Button variant="outline" size="sm" onClick={openPopup}>
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
            Combine com serviços sob medida
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto text-center">
            Monte o pacote que faz sentido pro seu time. A plataforma é a base — os serviços expandem a capacidade.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design as a Service */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-violet-500/10">
                  <Palette className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-accent-foreground">Design as a Service</h3>
                  <p className="text-[11px] text-muted-foreground">Peças gráficas para o time</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Carrosséis, infográficos e templates de marca alinhados com o Brand Context da sua empresa.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">A partir de</span>
                <span className="text-lg font-bold text-violet-600">R$ 1.600</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
            </div>

            {/* Content Full-Service */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/10">
                  <Mic className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-accent-foreground">Content Full-Service</h3>
                  <p className="text-[11px] text-muted-foreground">Ativação executiva completa</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Produção de conteúdo autoral para executivos, preservando a voz de quem assina.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">A partir de</span>
                <span className="text-lg font-bold text-amber-600">R$ 3.500</span>
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
          <Button size="lg" className="font-bold gap-2" onClick={openBuilder}>
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
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-10 text-center">
            {t.precos.faqTitle}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border pb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
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
            <Button size="lg" className="font-bold gap-2" onClick={openBuilder}>
              Montar meu pacote
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="font-bold" onClick={openPopup}>
              {t.precos.ctaButton}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
