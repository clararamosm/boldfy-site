'use client';

import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  ArrowRight,
  Check,
  Loader2,
  CheckCircle2,
  Users,
  Palette,
  Mic,
  Lock,
  Download,
  Link2,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { sendProposalLeadToNotion, type ProposalLeadInput, type ProposalLeadResult } from '@/app/actions/proposal-leads';
import { useUtmParams } from '@/hooks/use-utm-params';

/* -------------------------------------------------------------------------- */
/*  Pricing data (synced with official Boldfy pricing 2026-04-08)              */
/* -------------------------------------------------------------------------- */

const PLATFORM_TIERS = [
  { min: 5, max: 10, full: 499, beta: 349 },
  { min: 11, max: 20, full: 449, beta: 315 },
  { min: 21, max: 40, full: 399, beta: 279 },
  { min: 41, max: 70, full: 349, beta: 245 },
];

const DESIGN_PACKS = {
  starter: { label: 'Starter', pieces: 4, price: 1600 },
  growth: { label: 'Growth', pieces: 8, price: 2800 },
  scale: { label: 'Scale', pieces: 12, price: 3600 },
} as const;

type DesignPackKey = keyof typeof DESIGN_PACKS;

// Full-service pricing matrix: [TLs][freq per week]
const FULLSERVICE_MATRIX: Record<number, Record<number, number>> = {
  1: { 2: 5500, 3: 7700, 4: 9600 },
  2: { 2: 9000, 3: 12600, 4: 15700 },
  3: { 2: 12000, 3: 16800, 4: 20900 },
  4: { 2: 14800, 3: 20700, 4: 25800 },
  5: { 2: 18000, 3: 25200, 4: 31400 },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function formatBRL(value: number): string {
  return `R$ ${fmt(value)}`;
}

function getPlatformTier(seats: number) {
  for (const t of PLATFORM_TIERS) {
    if (seats >= t.min && seats <= t.max) return t;
  }
  return null; // enterprise
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

type ProposalBuilderContextType = {
  isOpen: boolean;
  openBuilder: (source?: string) => void;
  closeBuilder: () => void;
  source: string;
};

const ProposalBuilderContext = React.createContext<ProposalBuilderContextType | undefined>(
  undefined,
);

export function useProposalBuilder() {
  const context = React.useContext(ProposalBuilderContext);
  if (!context) {
    throw new Error('useProposalBuilder must be used within a ProposalBuilderProvider');
  }
  return context;
}

export function ProposalBuilderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('direto');

  const openBuilder = useCallback((src?: string) => {
    setSource(src ?? 'direto');
    setIsOpen(true);
  }, []);
  const closeBuilder = useCallback(() => setIsOpen(false), []);

  return (
    <ProposalBuilderContext.Provider value={{ isOpen, openBuilder, closeBuilder, source }}>
      {children}
      <ProposalBuilderModal isOpen={isOpen} onOpenChange={setIsOpen} source={source} />
    </ProposalBuilderContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Centered Modal                                                             */
/* -------------------------------------------------------------------------- */

type Step = 'builder' | 'result';

function ProposalBuilderModal({
  isOpen,
  onOpenChange,
  source,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
}) {
  const utms = useUtmParams();
  const [step, setStep] = useState<Step>('builder');

  // Beta toggle
  const [betaActive, setBetaActive] = useState(true);

  // Tier 1: Platform
  const [platformEnabled, setPlatformEnabled] = useState(true);
  const [seats, setSeats] = useState(20);
  const tier = getPlatformTier(seats)!;
  const platformPerSeatFull = tier.full;
  const platformPerSeatBeta = tier.beta;
  const platformPerSeat = betaActive ? platformPerSeatBeta : platformPerSeatFull;
  const platformTotalFull = seats * platformPerSeatFull;
  const platformTotal = seats * platformPerSeat;

  // Tier 2: Design on Demand
  const [designEnabled, setDesignEnabled] = useState(false);
  const [designPack, setDesignPack] = useState<DesignPackKey>('starter');
  const designPrice = designEnabled ? DESIGN_PACKS[designPack].price : 0;

  // Tier 3: Content Full-Service
  const [fsEnabled, setFsEnabled] = useState(false);
  const [fsTls, setFsTls] = useState(3);
  const [fsFreq, setFsFreq] = useState(2);
  const fsPrice = fsEnabled ? (FULLSERVICE_MATRIX[fsTls]?.[fsFreq] ?? 0) : 0;

  // Totals
  const totalCurrent = (platformEnabled ? platformTotal : 0) + designPrice + fsPrice;
  const totalFull = (platformEnabled ? platformTotalFull : 0) + designPrice + fsPrice;
  const savings = totalFull - totalCurrent;

  // Lead form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');

  // Submit state
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [proposalUrl, setProposalUrl] = useState<string | undefined>();

  const leadFilled = nome.trim().length > 0 && email.trim().length > 2 && email.includes('@');

  // Reset on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setStep('builder');
        setStatus('idle');
        setErrorMessage('');
      }, 300);
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!leadFilled) return;
    setStatus('loading');
    setErrorMessage('');

    const input: ProposalLeadInput = {
      nome: nome.trim(),
      email: email.trim(),
      empresa: empresa.trim() || '—',
      cargo: cargo.trim() || '—',
      betaActive,
      plataformaEnabled: platformEnabled,
      plataformaSeats: seats,
      plataformaEnterprise: false,
      plataformaPriceFull: platformPerSeatFull,
      plataformaPriceBeta: platformPerSeatBeta,
      designPlan: designEnabled ? designPack : null,
      designPrice,
      fsTls: fsEnabled ? fsTls : 0,
      fsFreq: fsEnabled ? fsFreq : 0,
      fsPrice,
      totalCurrent,
      totalFull,
      savings,
      origem: source || 'Simulador de Proposta',
      ...utms,
      teamItems,
    };

    const res: ProposalLeadResult = await sendProposalLeadToNotion(input);

    if (res.success) {
      setStatus('success');
      setProposalUrl(res.proposalUrl);
      setStep('result');
    } else {
      setStatus('error');
      setErrorMessage(res.error || 'Algo deu errado. Tente novamente.');
    }
  };

  // Build team list
  const teamItems: { text: string; dedicated: boolean }[] = [];
  if (fsEnabled) {
    teamItems.push({ text: '1 Estrategista dedicado', dedicated: true });
    teamItems.push({ text: '1 Designer dedicado', dedicated: true });
    teamItems.push({ text: 'Lead Magnet mensal', dedicated: false });
    teamItems.push({ text: 'Operação de jornada', dedicated: false });
    teamItems.push({ text: 'Dashboard de métricas', dedicated: false });
  } else {
    if (platformEnabled || designEnabled) {
      teamItems.push({ text: '1 Estrategista global da conta', dedicated: false });
    }
    if (designEnabled) {
      teamItems.push({ text: '1 Designer', dedicated: false });
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-[640px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-white shadow-[0_25px_65px_rgba(0,0,0,0.15)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-accent-foreground">
                {step === 'result' ? 'Sua proposta' : 'Monte sua proposta'}
              </Dialog.Title>
              {step === 'builder' && (
                <p className="text-xs text-muted-foreground">
                  Ative os produtos, ajuste os parâmetros e veja o resultado
                </p>
              )}
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-foreground/60 hover:bg-accent hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </Dialog.Close>
          </div>

          {/* Content — scrollable */}
          <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
            {step === 'builder' && (
              <div className="px-6 py-6 space-y-5">
                {/* Beta toggle */}
                <div className="flex items-center justify-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm mx-auto w-fit">
                  <span className="text-[12px] font-semibold text-foreground">
                    Preço <span className="text-primary font-bold">Beta Tester</span> (30% off na Plataforma)
                  </span>
                  <button
                    type="button"
                    onClick={() => setBetaActive(!betaActive)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      betaActive ? 'bg-primary' : 'bg-border',
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        betaActive ? 'translate-x-[22px]' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </div>

                {/* ── Tier 1: Software as a Service ── */}
                <div
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    platformEnabled
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : 'border-border bg-card hover:border-primary/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setPlatformEnabled(!platformEnabled)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-accent-foreground">Software as a Service</p>
                      <p className="text-[11px] text-muted-foreground">Plataforma de Content Intelligence</p>
                    </div>
                    <div
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                        platformEnabled ? 'bg-primary' : 'bg-border',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          platformEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                        )}
                      />
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-all duration-300',
                      platformEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                    style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border/50 px-4 pb-4 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Quantos colaboradores?</label>
                          <div className="text-right">
                            <span className="text-lg font-bold text-primary">{seats}</span>
                            <span className="text-xs text-muted-foreground ml-1">seats</span>
                          </div>
                        </div>
                        <Slider
                          min={5}
                          max={70}
                          step={1}
                          value={[seats]}
                          onValueChange={(v) => setSeats(v[0])}
                        />
                        <div className="flex justify-between -mt-1 mb-1">
                          <span className="text-[10px] text-muted-foreground">5</span>
                          <span className="text-[10px] text-muted-foreground">20</span>
                          <span className="text-[10px] text-muted-foreground">40</span>
                          <span className="text-[10px] text-muted-foreground">70</span>
                        </div>

                        {/* Team badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            1 Estrategista global da conta
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t border-dashed border-border">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Plataforma
                          </span>
                          <div className="text-right">
                            {betaActive && (
                              <span className="block text-xs text-muted-foreground line-through">
                                {formatBRL(platformTotalFull)}/mês
                              </span>
                            )}
                            <span className={cn('text-lg font-extrabold', betaActive ? 'text-primary' : 'text-foreground')}>
                              {formatBRL(platformTotal)}/mês
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tier 2: Design on Demand ── */}
                <div
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    designEnabled
                      ? 'border-violet-400/40 bg-violet-500/[0.04]'
                      : 'border-border bg-card hover:border-violet-400/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setDesignEnabled(!designEnabled)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <Palette className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-accent-foreground">Design on Demand</p>
                      <p className="text-[11px] text-muted-foreground">Peças gráficas para a biblioteca do time</p>
                    </div>
                    <div
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                        designEnabled ? 'bg-violet-500' : 'bg-border',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          designEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                        )}
                      />
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-all duration-300',
                      designEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                    style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border/50 px-4 pb-4 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-secondary p-1">
                          {(Object.entries(DESIGN_PACKS) as [DesignPackKey, (typeof DESIGN_PACKS)[DesignPackKey]][]).map(
                            ([key, pack]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setDesignPack(key)}
                                className={cn(
                                  'rounded-[7px] py-2.5 px-2 text-center transition-all text-xs font-semibold',
                                  designPack === key
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                                )}
                              >
                                <span className="block font-bold text-xs">{pack.label}</span>
                                <span className="block text-[10px] font-medium opacity-80 mt-0.5">
                                  {pack.pieces} peças/mês
                                </span>
                              </button>
                            ),
                          )}
                        </div>

                        {/* Team badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            1 Designer
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            1 Estrategista global da conta
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t border-dashed border-border">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Biblioteca
                          </span>
                          <span className="text-lg font-extrabold text-foreground">
                            {formatBRL(designPrice)}/mês
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tier 3: Content Full-Service ── */}
                <div
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    fsEnabled
                      ? 'border-amber-400/40 bg-amber-500/[0.04]'
                      : 'border-border bg-card hover:border-amber-400/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setFsEnabled(!fsEnabled)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <Mic className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-accent-foreground">Content Full-Service</p>
                      <p className="text-[11px] text-muted-foreground">Gestão ponta a ponta do LinkedIn de executivos</p>
                    </div>
                    <div
                      className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                        fsEnabled ? 'bg-amber-500' : 'bg-border',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          fsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                        )}
                      />
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-all duration-300',
                      fsEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                    style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border/50 px-4 pb-4 pt-4 space-y-4">
                        {/* TLs slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">
                              Quantos executivos serão gerenciados?
                            </label>
                            <span className="text-lg font-bold text-amber-600">{fsTls} {fsTls === 1 ? 'executivo' : 'executivos'}</span>
                          </div>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[fsTls]}
                            onValueChange={(v) => setFsTls(v[0])}
                          />
                          <div className="flex justify-between mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n} className="text-[10px] text-muted-foreground">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Frequência de publicação por executivo
                          </label>
                          <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-secondary p-1">
                            {([
                              { freq: 2, label: '2x/sem', sub: '8 posts/mês' },
                              { freq: 3, label: '3x/sem', sub: '12 posts/mês' },
                              { freq: 4, label: '4x/sem', sub: '16 posts/mês' },
                            ] as const).map((opt) => (
                              <button
                                key={opt.freq}
                                type="button"
                                onClick={() => setFsFreq(opt.freq)}
                                className={cn(
                                  'rounded-[7px] py-2.5 px-2 text-center transition-all text-xs font-semibold',
                                  fsFreq === opt.freq
                                    ? 'bg-white text-amber-600 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                                )}
                              >
                                <span className="block font-bold text-xs">{opt.label}</span>
                                <span className="block text-[10px] font-medium opacity-80 mt-0.5">
                                  {opt.sub}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Team badges — dedicated */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-2.5 py-1 text-[10px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            1 Estrategista dedicado
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-2.5 py-1 text-[10px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            1 Designer dedicado
                          </span>
                        </div>

                        {/* Extra tags */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Lead Magnet mensal
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Operação de jornada
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            Dashboard de métricas
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t border-dashed border-border">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Full-Service
                          </span>
                          <span className="text-lg font-extrabold text-foreground">
                            {formatBRL(fsPrice)}/mês
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Summary (blurred) ── */}
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <h4 className="text-sm font-bold text-accent-foreground mb-3">Resumo da proposta</h4>

                  {!(platformEnabled || designEnabled || fsEnabled) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      <strong className="block text-foreground mb-1">Ative um produto</strong>
                      Ligue pelo menos um dos serviços acima para montar sua proposta.
                    </p>
                  )}

                  {(platformEnabled || designEnabled || fsEnabled) && (
                    <div className="space-y-2">
                      {platformEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Plataforma ({seats} seats)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                              {formatBRL(platformTotal)}
                            </span>
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      {designEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Biblioteca ({DESIGN_PACKS[designPack].label})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                              {formatBRL(designPrice)}
                            </span>
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      {fsEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Full-Service ({fsTls} exec × {fsFreq}x/sem)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                              {formatBRL(fsPrice)}
                            </span>
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                        <span className="font-bold text-accent-foreground text-sm">Total mensal</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary blur-[6px] select-none" aria-hidden="true">
                            {formatBRL(totalCurrent)}
                          </span>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Inline lead form ── */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-accent-foreground">
                      Desbloqueie sua proposta
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="prop-nome" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nome
                      </label>
                      <input
                        id="prop-nome"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="Como você se chama?"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="prop-email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Email corporativo
                      </label>
                      <input
                        id="prop-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="voce@empresa.com.br"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="prop-empresa" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Empresa
                      </label>
                      <input
                        id="prop-empresa"
                        type="text"
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="Onde você trabalha?"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="prop-cargo" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Cargo
                      </label>
                      <input
                        id="prop-cargo"
                        type="text"
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="Ex: CMO, Head de Marketing…"
                      />
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={!leadFilled || status === 'loading'}
                    className="w-full gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Liberar minha proposta
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground text-center">
                    Não fazemos spam. Usamos seus dados só pra enviar a proposta.
                  </p>
                </div>
              </div>
            )}

            {step === 'result' && (
              <ResultStep
                betaActive={betaActive}
                platformEnabled={platformEnabled}
                seats={seats}
                platformPerSeat={platformPerSeat}
                platformPerSeatFull={platformPerSeatFull}
                platformTotal={platformTotal}
                platformTotalFull={platformTotalFull}
                designEnabled={designEnabled}
                designPack={designPack}
                designPrice={designPrice}
                fsEnabled={fsEnabled}
                fsTls={fsTls}
                fsFreq={fsFreq}
                fsPrice={fsPrice}
                totalCurrent={totalCurrent}
                totalFull={totalFull}
                savings={savings}
                teamItems={teamItems}
                proposalUrl={proposalUrl}
                onClose={() => handleOpenChange(false)}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result: full proposal revealed + export                                    */
/* -------------------------------------------------------------------------- */

function ResultStep({
  betaActive,
  platformEnabled,
  seats,
  platformPerSeat,
  platformPerSeatFull,
  platformTotal,
  platformTotalFull,
  designEnabled,
  designPack,
  designPrice,
  fsEnabled,
  fsTls,
  fsFreq,
  fsPrice,
  totalCurrent,
  totalFull,
  savings,
  teamItems,
  proposalUrl,
  onClose,
}: {
  betaActive: boolean;
  platformEnabled: boolean;
  seats: number;
  platformPerSeat: number;
  platformPerSeatFull: number;
  platformTotal: number;
  platformTotalFull: number;
  designEnabled: boolean;
  designPack: DesignPackKey;
  designPrice: number;
  fsEnabled: boolean;
  fsTls: number;
  fsFreq: number;
  fsPrice: number;
  totalCurrent: number;
  totalFull: number;
  savings: number;
  teamItems: { text: string; dedicated: boolean }[];
  proposalUrl?: string;
  onClose: () => void;
}) {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!proposalUrl) return;
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Fallback: open in new tab
      window.open(proposalUrl, '_blank');
    }
  };

  const handleExport = async () => {
    if (!proposalRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(proposalRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: { borderRadius: '0' },
      });
      const link = document.createElement('a');
      link.download = `proposta-boldfy-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Success banner */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-bold text-accent-foreground">Proposta desbloqueada!</p>
          <p className="text-[11px] text-muted-foreground">
            Nossa equipe vai entrar em contato para alinhar os próximos passos.
          </p>
        </div>
      </div>

      {/* Exportable card */}
      <div ref={proposalRef} className="rounded-xl border border-border bg-white p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-accent-foreground">Proposta Boldfy</h4>
            <p className="text-[11px] text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex h-8 items-center rounded-md bg-primary/10 px-2.5">
            <span className="text-xs font-bold text-primary">BOLDFY</span>
          </div>
        </div>

        {/* Platform */}
        {platformEnabled && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Plataforma</span>
            </div>
            <div className="ml-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {seats} seats · {formatBRL(platformPerSeat)}/seat{betaActive ? ' (beta)' : ''}
                </span>
                <div className="text-right">
                  {betaActive && (
                    <span className="block text-xs text-muted-foreground/60 line-through">
                      {formatBRL(platformTotalFull)}
                    </span>
                  )}
                  <span className="font-medium">{formatBRL(platformTotal)}/mês</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['IA Contextual', 'Gamificação', 'Trilhas LXP', 'Dashboard', 'Biblioteca de Marca', 'Setup assistido'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] text-primary font-medium">
                    <Check className="h-2.5 w-2.5" />{f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Design */}
        {designEnabled && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">Biblioteca de Peças</span>
            </div>
            <div className="ml-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {DESIGN_PACKS[designPack].label} · {DESIGN_PACKS[designPack].pieces} peças/mês
                </span>
                <span className="font-medium">{formatBRL(designPrice)}/mês</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['Carrosséis', 'Infográficos', 'Templates de marca', 'Alinhado com Brand Context'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-violet-500/5 px-2 py-0.5 text-[10px] text-violet-600 font-medium">
                    <Check className="h-2.5 w-2.5" />{f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Full-Service */}
        {fsEnabled && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Content Full-Service</span>
            </div>
            <div className="ml-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {fsTls} executivo{fsTls > 1 ? 's' : ''} · {fsFreq}x por semana cada
                </span>
                <span className="font-medium">{formatBRL(fsPrice)}/mês</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['Estratégia de posicionamento', 'Produção autoral', 'Design dedicado', 'Report mensal', 'Lead Magnet mensal'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-amber-500/5 px-2 py-0.5 text-[10px] text-amber-600 font-medium">
                    <Check className="h-2.5 w-2.5" />{f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team */}
        {teamItems.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Sua equipe Boldfy
            </h5>
            <div className="space-y-1.5">
              {teamItems.map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', item.dedicated ? 'bg-orange-500' : 'bg-primary')} />
                  <span>
                    <strong className="text-foreground">{item.text.split(' ').slice(0, 2).join(' ')}</strong>{' '}
                    {item.text.split(' ').slice(2).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t-2 border-border/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Investimento mensal
          </p>
          {betaActive && savings > 0 && (
            <p className="text-sm text-muted-foreground/60 line-through">{formatBRL(totalFull)}/mês</p>
          )}
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            {formatBRL(totalCurrent)}<span className="text-sm font-medium text-muted-foreground ml-1">/mês</span>
          </p>
          {betaActive && savings > 0 && (
            <p className="text-[11px] font-semibold text-primary mt-1">
              Economia beta: {formatBRL(savings)}/mês
            </p>
          )}
        </div>
      </div>

      {/* Shareable link */}
      {proposalUrl && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold text-accent-foreground">Link da proposta</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={proposalUrl}
              className="flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-muted-foreground select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={handleCopyLink} size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8">
              {linkCopied ? (
                <>
                  <ClipboardCheck className="h-3 w-3 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                'Copiar'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="flex-1 gap-2">
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar proposta
            </>
          )}
        </Button>
        <Button onClick={onClose} className="flex-1">
          Fechar
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Pricing vigente Boldfy (2026). Desconto Beta Tester (30% off) aplica-se somente à Plataforma.
        Contrato mínimo de 6 meses. Executivos do Content Full-Service não consomem seats da Plataforma.
      </p>
    </div>
  );
}
