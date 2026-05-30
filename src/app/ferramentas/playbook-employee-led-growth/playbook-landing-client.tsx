'use client';

/**
 * Landing client — gerencia o layout responsivo do quiz Playbook ELG.
 *
 * Desktop ≥960px:
 *   Grid 2 colunas (pitch + wizard embed). Quiz sempre visível na direita,
 *   sem CTA — pessoa entra na LP e já começa.
 *
 * Mobile <960px:
 *   Single column (pitch + meta + CTA "Começar o quiz"). Quiz fica escondido
 *   atrás do CTA, abre como modal fullscreen com transform translateY(100%→0).
 *
 * Spec: §3.1.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaybookWizard } from '@/components/playbook/wizard';

export function PlaybookLandingClient() {
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Lock scroll do body quando o modal mobile estiver aberto
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isMobileModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isMobileModalOpen]);

  return (
    <>
      {/* Glow decorativo (atmosfera Boldfy — spec design system §5) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.05] blur-[120px]" />
      </div>

      {/* Header minimalista — só o logo, sem nav (LP standalone, foco no quiz) */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 lg:px-12">
          <Link href="/" aria-label="Boldfy — voltar pra home" className="shrink-0 transition-opacity hover:opacity-80">
            <Image src="/images/boldfy-logo.svg" alt="Boldfy" width={84} height={24} priority />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 md:gap-16 md:py-20 lg:grid-cols-[1fr_520px] lg:px-12">

        {/* Coluna esquerda — Pitch */}
        <div className="flex flex-col">
          <span className="mb-6 inline-flex w-fit items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            <Sparkles className="h-3 w-3" />
            Ferramenta gratuita Boldfy
          </span>

          <h1 className="mb-6 font-headline text-[clamp(2.25rem,4.4vw,3.5rem)] font-black leading-[1.04] tracking-[-0.035em] text-foreground">
            Tenha sua estratégia de{' '}
            <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
              Employee-Led Growth
            </span>{' '}
            em 5 minutos
          </h1>

          <p className="mb-8 max-w-[540px] text-lg leading-relaxed text-foreground">
            Conta pra Fai o cenário da sua empresa e ela monta um playbook acionável
            com diagnóstico, dicas selecionadas pro seu caso, plano de ação e cálculo
            de earned media,{' '}
            <span className="cursor-default bg-gradient-to-r from-[#CD50F1] via-[#E875FF] to-[#CD50F1] bg-[length:200%_100%] bg-clip-text font-bold text-foreground transition-colors duration-500 ease-out hover:animate-shimmer hover:text-transparent hover:drop-shadow-[0_0_14px_rgba(205,80,241,0.55)]">
              tudo personalizado
            </span>
            .
          </p>

          <ul className="space-y-3.5">
            <Bullet>Diagnóstico do seu cenário com a curva de adesão real pra sua empresa</Bullet>
            <Bullet>Dicas selecionadas pelo seu setor, cargo, dor e tentativas anteriores</Bullet>
            <Bullet>Calculadora de earned media com seus números e comparativo com Ads</Bullet>
            <Bullet>Link único pra você compartilhar com o time e o decisor</Bullet>
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-6 border-t border-dashed border-border pt-7 text-xs text-muted-foreground">
            <Stat label="pra completar" value="~5 min" icon={<Clock className="h-3.5 w-3.5" />} />
            <Stat label="de custo" value="R$ 0" icon={<Lock className="h-3.5 w-3.5" />} />
          </div>

          {/* CTA mobile — abre modal fullscreen do wizard */}
          <div className="mt-8 lg:hidden">
            <Button
              size="lg"
              className="w-full justify-center text-base"
              onClick={() => setIsMobileModalOpen(true)}
            >
              Começar o quiz
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Coluna direita — Wizard embed (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-8 h-[680px]">
            <PlaybookWizard />
          </div>
        </div>
      </div>

      {/* Modal mobile — fullscreen, slide-up */}
      <div
        className={`fixed inset-0 z-[100] bg-background transition-transform duration-300 ease-out lg:hidden ${
          isMobileModalOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Quiz Playbook de Employee-Led Growth"
      >
        {isMobileModalOpen && (
          <PlaybookWizard
            isMobileModal
            onClose={() => setIsMobileModalOpen(false)}
          />
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-componentes do pitch                                                   */
/* -------------------------------------------------------------------------- */

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] font-medium text-foreground">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      <strong className="text-sm font-extrabold text-foreground">{value}</strong>
      <span>{label}</span>
    </span>
  );
}
