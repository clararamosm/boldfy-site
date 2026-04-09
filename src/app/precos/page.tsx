'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Shield, MessageCircle } from 'lucide-react';
import { RoiSimulatorSection } from '@/components/sections/roi-simulator';

interface PricingCardProps {
  range: string;
  price: string;
  betaPrice: string;
  seatMonth: string;
  highlighted?: boolean;
}

function PricingCard({ range, price, betaPrice, seatMonth, highlighted }: PricingCardProps) {
  return (
    <div className={`rounded-xl border p-6 text-center transition-shadow ${highlighted ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5' : 'border-border bg-card'}`}>
      <p className="text-sm font-semibold text-foreground mb-2">{range}</p>
      <p className="text-sm text-muted-foreground line-through mb-1">{price}</p>
      <p className="text-3xl font-extrabold text-primary mb-1">{betaPrice}</p>
      <p className="text-xs text-muted-foreground">{seatMonth}</p>
    </div>
  );
}

export default function PrecosPage() {
  const t = useT();
  const { openPopup } = useDemoPopup();

  const tiers: PricingCardProps[] = [
    { range: t.precos.tier1Range, price: t.precos.tier1Price, betaPrice: t.precos.tier1Beta, seatMonth: t.precos.seatMonth },
    { range: t.precos.tier2Range, price: t.precos.tier2Price, betaPrice: t.precos.tier2Beta, seatMonth: t.precos.seatMonth, highlighted: true },
    { range: t.precos.tier3Range, price: t.precos.tier3Price, betaPrice: t.precos.tier3Beta, seatMonth: t.precos.seatMonth },
    { range: t.precos.tier4Range, price: t.precos.tier4Price, betaPrice: t.precos.tier4Beta, seatMonth: t.precos.seatMonth },
  ];

  const included = [
    t.precos.included1, t.precos.included2, t.precos.included3,
    t.precos.included4, t.precos.included5, t.precos.included6,
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

      {/* Pricing grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <PricingCard key={tier.range} {...tier} />
            ))}
          </div>
          {/* Enterprise */}
          <div className="mt-4 rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">{t.precos.tier5Range}</p>
            <p className="text-xl font-bold text-primary mb-3">{t.precos.enterprisePrice}</p>
            <Button  variant="outline" size="sm" onClick={openPopup}>
              {t.precos.enterpriseCta}
            </Button>
          </div>
        </div>
      </section>

      {/* Beta banner */}
      <section className="py-16 bg-primary/5">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground">
              {t.precos.betaBannerTitle} <span className="text-primary">{t.precos.betaBannerTitleSuffix}</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.precos.betaBannerSubtitle}</p>
          <p className="text-xs text-primary font-medium mb-6">{t.precos.betaContractTerms}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-3 py-1.5">{t.precos.freeSetup}</Badge>
            <Badge variant="secondary" className="px-3 py-1.5">{t.precos.strategyIncluded}</Badge>
            <Badge variant="secondary" className="px-3 py-1.5">{t.precos.directSupport}</Badge>
          </div>
        </div>
      </section>

      {/* Included */}
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

      {/* ROI Simulator */}
      <RoiSimulatorSection />

      {/* Tier 2 preview */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3">
            {t.precos.tier2PreviewTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            {t.precos.tier2PreviewDesc}
          </p>
          <Button  variant="outline" onClick={openPopup}>
              
              {t.precos.tier2PreviewCta}
              <ArrowRight className="w-4 h-4 ml-2" />
            
            </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-10 text-center">
            {t.precos.faqTitle}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border pb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-3">
            {t.precos.ctaTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            {t.precos.ctaSubtitle}
          </p>
          <Button  size="lg" className="font-bold" onClick={openPopup}>
              
              {t.precos.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />
            
            </Button>
        </div>
      </section>
    </>
  );
}
