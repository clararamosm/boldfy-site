import { useT } from '@/lib/i18n/context';
import { BattleCardTrigger } from '@/components/battle-card';
import {
  ArrowRight,
  Sparkles,
  Mic,
  Clock,
  Palette,
  MessageSquare,
  UserCheck,
  Layers,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const avatars = Array.from({ length: 6 }, (_, i) => ({
  src: `/images/avatar-${i + 1}.jpeg`,
  alt: `Colaborador ${i + 1}`,
}));

/* ================================================================== */
/*  Visual 1 — Time: avatars + 2 stats (compacto)                      */
/* ================================================================== */

function VisualTime() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] border border-border bg-background px-3.5 py-3">
      <div className="flex items-center pl-2">
        {avatars.map((a, i) => (
          <div
            key={a.src}
            className="-ml-2 h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-card shadow-sm"
            style={{ zIndex: i }}
          >
            <Image
              src={a.src}
              alt={a.alt}
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      <div className="text-right">
        <p className="font-headline text-base font-black leading-none text-accent-foreground">
          128k
        </p>
        <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
          impressões/mês
        </p>
      </div>
      <div className="text-right">
        <p className="font-headline text-base font-black leading-none text-accent-foreground">
          <span className="text-[11px] font-bold text-muted-foreground">R$</span>
          38,4k
        </p>
        <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
          em mídia equivalente
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Visual 2 — Boldfy: 3 mini chips (compacto)                         */
/* ================================================================== */

function VisualBoldfy() {
  const items = [
    { icon: Clock, title: 'Estratégia', sub: 'Narrativa e pilares', iconBg: 'bg-primary/10 text-primary' },
    { icon: Palette, title: 'Design', sub: 'Peças sob demanda', iconBg: 'bg-[#9840AD]/12 text-[#9840AD]' },
    { icon: MessageSquare, title: 'Operação', sub: 'Publica e mede', iconBg: 'bg-emerald-500/10 text-emerald-500' },
  ];
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-[14px] border border-border bg-background p-2.5">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 text-center shadow-sm"
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-[9px] ${item.iconBg}`}>
            <item.icon className="h-[15px] w-[15px]" />
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
/*  Steps list (3 passos)                                              */
/* ================================================================== */

function Steps({ items, caas }: { items: string[]; caas?: boolean }) {
  return (
    <div className="mb-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Como funciona
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-headline text-[10px] font-extrabold ${
                caas ? 'bg-[#5E2A67]/10 text-[#5E2A67]' : 'bg-primary/10 text-primary'
              }`}
            >
              {i + 1}
            </div>
            <p className="text-[12.5px] font-medium leading-[1.4] text-accent-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Call-out de plataforma/admin dentro do card                        */
/* ================================================================== */

function AdminCallout({ text, caas }: { text: string; caas?: boolean }) {
  return (
    <div
      className={`mb-5 flex items-center gap-2.5 rounded-xl border p-3 ${
        caas ? 'border-[#5E2A67]/20 bg-[#5E2A67]/[0.05]' : 'border-primary/20 bg-primary/[0.05]'
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          caas ? 'bg-[#5E2A67]/12 text-[#5E2A67]' : 'bg-primary/12 text-primary'
        }`}
      >
        <Layers className="h-4 w-4" />
      </div>
      <p className="text-[12px] leading-[1.4] text-accent-foreground">{text}</p>
    </div>
  );
}

/* ================================================================== */
/*  Section                                                            */
/* ================================================================== */

export function SolutionsBentoSection() {
  const t = useT();

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 md:py-24">
      <div className="pointer-events-none absolute left-[-100px] top-[-10%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />
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

      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[1100px] text-center md:mb-14">
          <span className="mb-5 inline-block rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.solutionsTag}
          </span>
          <h2 className="mb-4 font-headline text-[clamp(28px,4vw,44px)] font-black leading-[1.08] tracking-[-0.025em] text-accent-foreground">
            {t.home.solutionsTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.solutionsTitleHighlight}
            </span>
          </h2>
          <p className="mx-auto max-w-[760px] text-base leading-relaxed text-muted-foreground">
            {t.home.solutionsSubtitle}
          </p>
          <div className="mt-6 flex justify-center">
            <BattleCardTrigger source="home:solutions" variant="pill">
              {t.home.solutionsCompareLabel}
            </BattleCardTrigger>
          </div>
        </div>

        {/* 2-card grid */}
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {/* ── Card 1: Conteúdo feito pelo time (SaaS · Modo Time) ── */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] md:p-8">
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Sparkles className="h-3 w-3" />
              {t.home.solSaasTag}
            </span>

            <h3 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solSaasTitle}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solSaasDesc}
            </p>

            <VisualTime />

            <Steps items={[t.home.solSaasStep1, t.home.solSaasStep2, t.home.solSaasStep3]} />

            <AdminCallout text={t.home.solSaasAdmin} />

            {/* Footer: Modo Time + price + CTA */}
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
              <div>
                <span className="mb-2 inline-block rounded-full bg-[#F7EEFC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-primary">
                  {t.home.solSaasModo}
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  A partir de
                </p>
                <p className="font-headline text-[22px] font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                  <span className="text-sm font-bold text-muted-foreground">R$</span>
                  {t.home.solSaasPrice}
                </p>
                <p className="text-[11px] text-muted-foreground">{t.home.solSaasPriceUnit}</p>
              </div>
              <Link
                href="/solucoes/software-as-a-service"
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_10px_24px_rgba(205,80,241,0.38)]"
              >
                {t.home.solSaasCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Card 2: Conteúdo feito pela Boldfy (CaaS) ── */}
          <div className="boldfy-service-glow group flex flex-col rounded-3xl bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(94,42,103,0.16)] md:p-8">
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-[#5E2A67]/25 bg-[#5E2A67]/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5E2A67]">
              <Mic className="h-3 w-3" />
              {t.home.solCaasTag}
            </span>

            <h3 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solCaasTitle}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solCaasDesc}
            </p>

            <VisualBoldfy />

            <Steps caas items={[t.home.solCaasStep1, t.home.solCaasStep2, t.home.solCaasStep3]} />

            <AdminCallout caas text={t.home.solCaasAdmin} />

            {/* Sub-modos: Modo Design + Modo Executivo */}
            <div className="mt-auto grid grid-cols-2 gap-2.5 border-t border-border pt-5">
              {[
                { title: t.home.solCaasSub1Title, price: t.home.solCaasSub1Price },
                { title: t.home.solCaasSub2Title, price: t.home.solCaasSub2Price },
              ].map((sub) => (
                <div
                  key={sub.title}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-[#5E2A67]/30"
                >
                  <div>
                    <p className="font-headline text-[13px] font-black leading-tight text-accent-foreground">
                      {sub.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      a partir de{' '}
                      <strong className="font-extrabold text-[#5E2A67]">{sub.price}</strong>/mês
                    </p>
                  </div>
                  <Link
                    href="/solucoes/content-as-a-service"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#5E2A67] px-3 py-2 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(94,42,103,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#6f3479]"
                  >
                    {t.home.solCaasCta}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estrategista de conta — único call-out compartilhado abaixo */}
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
