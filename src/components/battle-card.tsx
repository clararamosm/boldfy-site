'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import {
  X,
  ArrowRight,
  Users,
  Mic,
  Check,
  UserCheck,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/context';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';

/* -------------------------------------------------------------------------- */
/*  Context & Provider                                                         */
/* -------------------------------------------------------------------------- */

type BattleCardContextType = {
  isOpen: boolean;
  openBattleCard: (source?: string) => void;
  closeBattleCard: () => void;
  source: string;
};

const BattleCardContext = React.createContext<BattleCardContextType | undefined>(
  undefined,
);

export function useBattleCard() {
  const ctx = React.useContext(BattleCardContext);
  if (!ctx) {
    throw new Error('useBattleCard must be used within a BattleCardProvider');
  }
  return ctx;
}

export function BattleCardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [source, setSource] = React.useState('direto');

  const openBattleCard = React.useCallback((src?: string) => {
    setSource(src ?? 'direto');
    setIsOpen(true);
  }, []);
  const closeBattleCard = React.useCallback(() => setIsOpen(false), []);

  return (
    <BattleCardContext.Provider
      value={{ isOpen, openBattleCard, closeBattleCard, source }}
    >
      {children}
      <BattleCardModal isOpen={isOpen} onOpenChange={setIsOpen} source={source} />
    </BattleCardContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trigger — can be used anywhere on the site                                 */
/* -------------------------------------------------------------------------- */

type TriggerVariant = 'link' | 'ghost' | 'pill';

export function BattleCardTrigger({
  source = 'direto',
  variant = 'link',
  className = '',
  children,
}: {
  source?: string;
  variant?: TriggerVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  const { openBattleCard } = useBattleCard();
  const label = children ?? t.battleCard.triggerLabel;

  const base = 'inline-flex items-center gap-1.5 font-semibold transition-colors';

  const variantClasses: Record<TriggerVariant, string> = {
    link: 'text-[13px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline',
    ghost: 'text-[13px] text-primary hover:opacity-80',
    pill: 'rounded-full border border-primary/30 bg-primary/[0.06] px-3.5 py-1.5 text-[12px] text-primary hover:bg-primary/[0.12]',
  };

  return (
    <button
      type="button"
      onClick={() => openBattleCard(source)}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      <GitCompare className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal                                                                      */
/* -------------------------------------------------------------------------- */

const CAAS_ACCENT = '#5E2A67';

function BattleCardModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
}) {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.battleCard;

  const rows = [
    { label: c.rowWhoOperates, saas: c.rowWhoOperatesSaas, caas: c.rowWhoOperatesCaas },
    { label: c.rowWhoBenefits, saas: c.rowWhoBenefitsSaas, caas: c.rowWhoBenefitsCaas },
    { label: c.rowEffort, saas: c.rowEffortSaas, caas: c.rowEffortCaas },
    { label: c.rowGamification, saas: c.rowGamificationSaas, caas: c.rowGamificationCaas },
    { label: c.rowReports, saas: c.rowReportsSaas, caas: c.rowReportsCaas },
    { label: c.rowIdealFor, saas: c.rowIdealForSaas, caas: c.rowIdealForCaas },
  ];

  const handleCtaBuilder = () => {
    onOpenChange(false);
    setTimeout(() => openBuilder('battle-card'), 200);
  };

  const handleCtaDemo = () => {
    onOpenChange(false);
    setTimeout(() => openPopup('battle-card'), 200);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-1.5rem)] max-w-[980px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_25px_65px_rgba(0,0,0,0.2)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          {/* Top bar with gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-[#9840AD] to-[#5E2A67]" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 md:px-8">
            <div className="min-w-0">
              <Dialog.Title className="font-headline text-[18px] font-black leading-tight tracking-[-0.02em] text-accent-foreground md:text-[22px]">
                {c.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] text-muted-foreground md:text-[13px]">
                {c.subtitle}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="shrink-0 rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={c.closeLabel}
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto">
            {/* Comparison table */}
            <div className="px-5 py-6 md:px-8">
              {/* Column headers */}
              <div className="mb-4 grid grid-cols-[110px_1fr_1fr] gap-2 md:grid-cols-[160px_1fr_1fr] md:gap-3">
                <div />
                <div className="rounded-lg border border-primary/30 bg-primary/[0.06] p-3 text-center">
                  <div className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary md:text-[11px]">
                    <Users className="h-3.5 w-3.5" />
                    {c.colSaasTag}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-[11px]">
                    {c.colSaasSub}
                  </div>
                </div>
                <div
                  className="rounded-lg border p-3 text-center"
                  style={{
                    borderColor: 'rgba(94,42,103,0.3)',
                    backgroundColor: 'rgba(94,42,103,0.06)',
                  }}
                >
                  <div
                    className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] md:text-[11px]"
                    style={{ color: CAAS_ACCENT }}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {c.colCaasTag}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-[11px]">
                    {c.colCaasSub}
                  </div>
                </div>
              </div>

              {/* Rows */}
              <div className="overflow-hidden rounded-lg border border-border">
                {rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[110px_1fr_1fr] gap-2 md:grid-cols-[160px_1fr_1fr] md:gap-3 ${
                      i < rows.length - 1 ? 'border-b border-border' : ''
                    } ${i % 2 === 0 ? 'bg-background/40' : 'bg-card'}`}
                  >
                    <div className="px-3 py-3 md:px-4 md:py-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground md:text-[11px]">
                        {row.label}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 px-3 py-3 text-[11px] leading-[1.45] text-accent-foreground md:px-4 md:py-3.5 md:text-[12.5px]">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>{row.saas}</span>
                    </div>
                    <div
                      className="flex items-start gap-1.5 px-3 py-3 text-[11px] leading-[1.45] text-accent-foreground md:px-4 md:py-3.5 md:text-[12.5px]"
                      style={{ backgroundColor: 'rgba(94,42,103,0.035)' }}
                    >
                      <Check
                        className="mt-0.5 h-3 w-3 shrink-0"
                        style={{ color: CAAS_ACCENT }}
                      />
                      <span>{row.caas}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Universal benefit */}
              <div
                className="mt-5 flex items-start gap-3 rounded-xl border p-4"
                style={{
                  borderColor: 'rgba(205,80,241,0.2)',
                  backgroundImage:
                    'linear-gradient(135deg, rgba(205,80,241,0.06) 0%, rgba(94,42,103,0.04) 100%)',
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.12] text-primary">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-headline text-[13px] font-black text-accent-foreground">
                    {c.universalTitle}
                  </div>
                  <div className="text-[12px] leading-[1.55] text-muted-foreground">
                    {c.universalBody}
                  </div>
                </div>
              </div>

              {/* Learn more links */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[12px]">
                <Link
                  href="/solucoes/software-as-a-service"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-semibold text-primary transition-colors hover:border-primary/40"
                >
                  {c.ctaLearnSaas}
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/solucoes/content-as-a-service"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 font-semibold transition-colors"
                  style={{
                    borderColor: 'hsl(var(--border))',
                    color: CAAS_ACCENT,
                  }}
                >
                  {c.ctaLearnCaas}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex flex-col items-stretch gap-2.5 border-t border-border bg-background/50 px-6 py-4 md:flex-row md:items-center md:justify-end md:gap-3 md:px-8">
            <Button variant="outline" size="lg" onClick={handleCtaDemo}>
              {c.ctaSecondary}
            </Button>
            <Button size="lg" className="font-bold" onClick={handleCtaBuilder}>
              {c.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
