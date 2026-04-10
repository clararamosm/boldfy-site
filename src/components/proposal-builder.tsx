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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { sendProposalLeadToNotion, type ProposalLeadInput } from '@/app/actions/proposal-leads';

/* -------------------------------------------------------------------------- */
/*  Pricing data                                                               */
/* -------------------------------------------------------------------------- */

const PLATFORM_TIERS = [
  { min: 5, max: 10, price: 499, beta: 349, label: '5 – 10 seats' },
  { min: 11, max: 20, price: 449, beta: 315, label: '11 – 20 seats' },
  { min: 21, max: 40, price: 399, beta: 279, label: '21 – 40 seats' },
  { min: 41, max: 70, price: 349, beta: 245, label: '41 – 70 seats' },
];

const DESIGN_PLANS = [
  { key: 'starter', label: 'Starter', pieces: 4, price: 1600 },
  { key: 'growth', label: 'Growth', pieces: 8, price: 2800 },
  { key: 'scale', label: 'Scale', pieces: 12, price: 3600 },
] as const;

// Full-service pricing matrix: [profiles][frequency]
const EXEC_PRICING: Record<string, Record<string, number>> = {
  '1': { '2x': 3500, '3x': 4500, '4x': 5500 },
  '2': { '2x': 6500, '3x': 8500, '4x': 10500 },
  '3': { '2x': 9000, '3x': 12000, '4x': 15000 },
  '4': { '2x': 11500, '3x': 15000, '4x': 19000 },
  '5': { '2x': 13500, '3x': 17500, '4x': 22000 },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getPlatformTier(seats: number) {
  for (const tier of PLATFORM_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier;
  }
  return PLATFORM_TIERS[PLATFORM_TIERS.length - 1];
}

/* -------------------------------------------------------------------------- */
/*  Toggle Switch component                                                    */
/* -------------------------------------------------------------------------- */

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  iconColor,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
        checked
          ? 'border-primary/40 bg-primary/[0.04]'
          : 'border-border bg-card hover:border-primary/20',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          iconColor,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-accent-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      {/* Toggle track */}
      <div
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-border',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

type ProposalBuilderContextType = {
  isOpen: boolean;
  openBuilder: () => void;
  closeBuilder: () => void;
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

  const openBuilder = useCallback(() => setIsOpen(true), []);
  const closeBuilder = useCallback(() => setIsOpen(false), []);

  return (
    <ProposalBuilderContext.Provider value={{ isOpen, openBuilder, closeBuilder }}>
      {children}
      <ProposalBuilderModal isOpen={isOpen} onOpenChange={setIsOpen} />
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
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>('builder');

  // Tier 1: Platform (always on, toggle for visual consistency)
  const [platformEnabled, setPlatformEnabled] = useState(true);
  const [seats, setSeats] = useState(10);
  const tier = getPlatformTier(seats);
  const platformPriceFull = tier.price;
  const platformPriceBeta = tier.beta;
  const platformTotalFull = seats * platformPriceFull;
  const platformTotalBeta = seats * platformPriceBeta;

  // Tier 2: Design on Demand
  const [designEnabled, setDesignEnabled] = useState(false);
  const [designPlan, setDesignPlan] = useState<string | null>('starter');
  const designPrice = designEnabled
    ? (DESIGN_PLANS.find((p) => p.key === designPlan)?.price ?? 0)
    : 0;

  // Tier 3: Content Full-Service
  const [execEnabled, setExecEnabled] = useState(false);
  const [execProfiles, setExecProfiles] = useState(1);
  const [execFrequency, setExecFrequency] = useState<string>('2x');
  const execPrice =
    execEnabled && execProfiles > 0 && execFrequency
      ? EXEC_PRICING[String(execProfiles)]?.[execFrequency] ?? 0
      : 0;

  // Totals
  const totalFull = (platformEnabled ? platformTotalFull : 0) + designPrice + execPrice;
  const totalBeta = (platformEnabled ? platformTotalBeta : 0) + designPrice + execPrice;

  // Lead form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');

  // Submit state
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Can submit?
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
      plataformaEnabled: platformEnabled,
      plataformaSeats: seats,
      plataformaPriceFull: platformPriceFull,
      plataformaPriceBeta: platformPriceBeta,
      designPlan: designEnabled ? designPlan : null,
      designPrice,
      executiveProfiles: execEnabled ? execProfiles : 0,
      executiveFrequency: execEnabled ? execFrequency : null,
      executivePrice: execPrice,
      totalFull,
      totalBeta,
      origem: 'Simulador de Proposta',
    };

    const res = await sendProposalLeadToNotion(input);

    if (res.success) {
      setStatus('success');
      setStep('result');
    } else {
      setStatus('error');
      setErrorMessage(res.error || 'Algo deu errado. Tente novamente.');
    }
  };

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
                  Configure o pacote ideal para sua empresa
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
              <BuilderStep
                platformEnabled={platformEnabled}
                setPlatformEnabled={setPlatformEnabled}
                seats={seats}
                setSeats={setSeats}
                platformPriceFull={platformPriceFull}
                platformPriceBeta={platformPriceBeta}
                platformTotalFull={platformTotalFull}
                platformTotalBeta={platformTotalBeta}
                designEnabled={designEnabled}
                setDesignEnabled={setDesignEnabled}
                designPlan={designPlan}
                setDesignPlan={setDesignPlan}
                designPrice={designPrice}
                execEnabled={execEnabled}
                setExecEnabled={setExecEnabled}
                execProfiles={execProfiles}
                setExecProfiles={setExecProfiles}
                execFrequency={execFrequency}
                setExecFrequency={setExecFrequency}
                execPrice={execPrice}
                totalFull={totalFull}
                totalBeta={totalBeta}
                nome={nome}
                setNome={setNome}
                email={email}
                setEmail={setEmail}
                empresa={empresa}
                setEmpresa={setEmpresa}
                leadFilled={leadFilled}
                status={status}
                errorMessage={errorMessage}
                onSubmit={handleSubmit}
              />
            )}

            {step === 'result' && (
              <ResultStep
                platformEnabled={platformEnabled}
                seats={seats}
                platformPriceFull={platformPriceFull}
                platformPriceBeta={platformPriceBeta}
                platformTotalFull={platformTotalFull}
                platformTotalBeta={platformTotalBeta}
                designEnabled={designEnabled}
                designPlan={designPlan}
                designPrice={designPrice}
                execEnabled={execEnabled}
                execProfiles={execProfiles}
                execFrequency={execFrequency}
                execPrice={execPrice}
                totalFull={totalFull}
                totalBeta={totalBeta}
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
/*  Single-page Builder (config + lead form + blurred summary)                 */
/* -------------------------------------------------------------------------- */

function BuilderStep({
  platformEnabled,
  setPlatformEnabled,
  seats,
  setSeats,
  platformPriceFull,
  platformPriceBeta,
  platformTotalFull,
  platformTotalBeta,
  designEnabled,
  setDesignEnabled,
  designPlan,
  setDesignPlan,
  designPrice,
  execEnabled,
  setExecEnabled,
  execProfiles,
  setExecProfiles,
  execFrequency,
  setExecFrequency,
  execPrice,
  totalFull,
  totalBeta,
  nome,
  setNome,
  email,
  setEmail,
  empresa,
  setEmpresa,
  leadFilled,
  status,
  errorMessage,
  onSubmit,
}: {
  platformEnabled: boolean;
  setPlatformEnabled: (v: boolean) => void;
  seats: number;
  setSeats: (v: number) => void;
  platformPriceFull: number;
  platformPriceBeta: number;
  platformTotalFull: number;
  platformTotalBeta: number;
  designEnabled: boolean;
  setDesignEnabled: (v: boolean) => void;
  designPlan: string | null;
  setDesignPlan: (v: string | null) => void;
  designPrice: number;
  execEnabled: boolean;
  setExecEnabled: (v: boolean) => void;
  execProfiles: number;
  setExecProfiles: (v: number) => void;
  execFrequency: string;
  setExecFrequency: (v: string) => void;
  execPrice: number;
  totalFull: number;
  totalBeta: number;
  nome: string;
  setNome: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  empresa: string;
  setEmpresa: (v: string) => void;
  leadFilled: boolean;
  status: string;
  errorMessage: string;
  onSubmit: () => void;
}) {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* ── Tier 1: Software as a Service (toggle) ── */}
      <div>
        <Toggle
          checked={platformEnabled}
          onChange={setPlatformEnabled}
          label="Software as a Service"
          description="Plataforma de Content Intelligence"
          icon={<Users className="h-4 w-4 text-primary" />}
          iconColor="bg-primary/10"
        />

        <div
          className={cn(
            'grid transition-all duration-300',
            platformEnabled ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0',
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Colaboradores</label>
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
              <div className="flex justify-between mt-1 mb-3">
                <span className="text-[10px] text-muted-foreground">5</span>
                <span className="text-[10px] text-muted-foreground">70</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-xs">
                    {formatBRL(platformPriceFull)}/seat
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    BETA
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatBRL(platformPriceBeta)}/seat
                  </span>
                </div>
                <span className="font-bold text-foreground">{formatBRL(platformTotalBeta)}/mês</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Design on Demand (toggle) ── */}
      <div>
        <Toggle
          checked={designEnabled}
          onChange={setDesignEnabled}
          label="Design on Demand"
          description="Peças gráficas para o time"
          icon={<Palette className="h-4 w-4 text-violet-500" />}
          iconColor="bg-violet-500/10"
        />

        <div
          className={cn(
            'grid transition-all duration-300',
            designEnabled ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0',
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
              {DESIGN_PLANS.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setDesignPlan(plan.key)}
                  className={cn(
                    'rounded-xl border p-3 text-center transition-all',
                    designPlan === plan.key
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30',
                  )}
                >
                  <p className="text-xs font-bold text-accent-foreground">{plan.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{plan.pieces} peças/mês</p>
                  <p className="text-sm font-bold text-primary mt-1.5">{formatBRL(plan.price)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier 3: Content Full-Service (toggle) ── */}
      <div>
        <Toggle
          checked={execEnabled}
          onChange={setExecEnabled}
          label="Content Full-Service"
          description="Ativação executiva completa"
          icon={<Mic className="h-4 w-4 text-amber-500" />}
          iconColor="bg-amber-500/10"
        />

        <div
          className={cn(
            'grid transition-all duration-300',
            execEnabled ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0',
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {/* Profiles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Perfis executivos</label>
                  <span className="text-lg font-bold text-primary">{execProfiles}</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[execProfiles]}
                  onValueChange={(v) => setExecProfiles(v[0])}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">1</span>
                  <span className="text-[10px] text-muted-foreground">5</span>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Frequência de publicação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['2x', '3x', '4x'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setExecFrequency(freq)}
                      className={cn(
                        'rounded-lg border py-2 text-center transition-all text-sm',
                        execFrequency === freq
                          ? 'border-primary bg-primary/5 font-bold text-primary'
                          : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                      )}
                    >
                      {freq}/semana
                    </button>
                  ))}
                </div>
              </div>

              {/* Price display */}
              {execPrice > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">
                    {execProfiles} perfil(is) × {execFrequency}/sem
                  </span>
                  <span className="font-bold text-foreground">{formatBRL(execPrice)}/mês</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary (blurred) ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
        <h4 className="text-sm font-bold text-accent-foreground mb-3">Resumo da proposta</h4>
        <div className="space-y-2">
          {platformEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plataforma ({seats} seats)</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground/60 line-through blur-[3px] select-none" aria-hidden="true">
                  {formatBRL(platformTotalFull)}
                </span>
                <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                  {formatBRL(platformTotalBeta)}
                </span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
          {designEnabled && designPlan && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Design ({DESIGN_PLANS.find((p) => p.key === designPlan)?.label})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                  {formatBRL(designPrice)}
                </span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
          {execEnabled && execPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Full-Service ({execProfiles}p × {execFrequency}/sem)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium blur-[4px] select-none" aria-hidden="true">
                  {formatBRL(execPrice)}
                </span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-primary/20">
            <span className="font-bold text-accent-foreground text-sm">Total mensal</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary blur-[6px] select-none" aria-hidden="true">
                {formatBRL(totalBeta)}
              </span>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
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
            <label htmlFor="prop-nome" className="text-xs font-medium text-foreground">
              Nome
            </label>
            <input
              id="prop-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="prop-email" className="text-xs font-medium text-foreground">
              E-mail
            </label>
            <input
              id="prop-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="prop-empresa" className="text-xs font-medium text-foreground">
            Empresa <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="prop-empresa"
            type="text"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="Sua empresa"
          />
        </div>

        {status === 'error' && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={onSubmit}
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
              Ver proposta completa
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result: full proposal revealed + export                                    */
/* -------------------------------------------------------------------------- */

function ResultStep({
  platformEnabled,
  seats,
  platformPriceFull,
  platformPriceBeta,
  platformTotalFull,
  platformTotalBeta,
  designEnabled,
  designPlan,
  designPrice,
  execEnabled,
  execProfiles,
  execFrequency,
  execPrice,
  totalFull,
  totalBeta,
  onClose,
}: {
  platformEnabled: boolean;
  seats: number;
  platformPriceFull: number;
  platformPriceBeta: number;
  platformTotalFull: number;
  platformTotalBeta: number;
  designEnabled: boolean;
  designPlan: string | null;
  designPrice: number;
  execEnabled: boolean;
  execProfiles: number;
  execFrequency: string | null;
  execPrice: number;
  totalFull: number;
  totalBeta: number;
  onClose: () => void;
}) {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!proposalRef.current) return;
    setExporting(true);

    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(proposalRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          borderRadius: '0',
        },
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

  // Collect team members based on activated services
  const teamMembers: string[] = [];
  if (platformEnabled) {
    teamMembers.push('Estrategista');
    teamMembers.push('Suporte');
  }
  if (designEnabled && designPlan) {
    teamMembers.push('Designer');
  }
  if (execEnabled && execPrice > 0) {
    teamMembers.push('Estrategista Sr.');
    teamMembers.push('Redator');
    teamMembers.push('Designer');
  }
  // Dedupe
  const uniqueTeam = [...new Set(teamMembers)];

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

      {/* Exportable proposal card */}
      <div ref={proposalRef} className="rounded-xl border border-border bg-white p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-accent-foreground">Proposta Boldfy</h4>
            <p className="text-[11px] text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
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
              <span className="text-sm font-semibold text-foreground">Software as a Service</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {seats} seats × {formatBRL(platformPriceBeta)}/seat
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/60 line-through">
                    {formatBRL(platformTotalFull)}
                  </span>
                  <span className="font-medium text-emerald-600">{formatBRL(platformTotalBeta)}/mês</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  'IA Contextual',
                  'Gamificação',
                  'Trilhas LXP',
                  'Dashboard',
                  'Biblioteca de Marca',
                  'Setup assistido',
                ].map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] text-primary font-medium"
                  >
                    <Check className="h-2.5 w-2.5" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Design on Demand */}
        {designEnabled && designPlan && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">Design on Demand</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {DESIGN_PLANS.find((p) => p.key === designPlan)?.label} —{' '}
                  {DESIGN_PLANS.find((p) => p.key === designPlan)?.pieces} peças/mês
                </span>
                <span className="font-medium">{formatBRL(designPrice)}/mês</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['Carrosséis', 'Infográficos', 'Templates de marca', 'Alinhado com Brand Context'].map(
                  (feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-500/5 px-2 py-0.5 text-[10px] text-violet-600 font-medium"
                    >
                      <Check className="h-2.5 w-2.5" />
                      {feat}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Full-Service */}
        {execEnabled && execPrice > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Content Full-Service</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {execProfiles} perfil(is) × {execFrequency}/semana
                </span>
                <span className="font-medium">{formatBRL(execPrice)}/mês</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {['Estratégia de posicionamento', 'Produção autoral', 'Design dedicado', 'Report mensal'].map(
                  (feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/5 px-2 py-0.5 text-[10px] text-amber-600 font-medium"
                    >
                      <Check className="h-2.5 w-2.5" />
                      {feat}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team included */}
        {uniqueTeam.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Time dedicado
            </h5>
            <div className="flex flex-wrap gap-3">
              {uniqueTeam.map((label) => (
                <TeamMember key={label} label={label} />
              ))}
            </div>
          </div>
        )}

        {/* Total — VISIBLE */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <span className="text-sm font-bold text-accent-foreground">Investimento mensal</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground/60 line-through">
              {formatBRL(totalFull)}
            </span>
            <span className="text-xl font-bold text-primary">{formatBRL(totalBeta)}</span>
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          Preço beta · 2 meses grátis + 4 meses com 30% off · renovação a preço cheio
        </p>
      </div>

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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Team member avatar                                                         */
/* -------------------------------------------------------------------------- */

function TeamMember({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
