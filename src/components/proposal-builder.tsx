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
  { min: 5, max: 10, price: 499, label: '5 – 10 seats' },
  { min: 11, max: 20, price: 449, label: '11 – 20 seats' },
  { min: 21, max: 40, price: 399, label: '21 – 40 seats' },
  { min: 41, max: 70, price: 349, label: '41 – 70 seats' },
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

function getPlatformPrice(seats: number): number {
  for (const tier of PLATFORM_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier.price;
  }
  return 349; // fallback
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

type Step = 'builder' | 'contact' | 'success';

function ProposalBuilderModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>('builder');

  // Tier 1: Platform
  const [seats, setSeats] = useState(10);
  const platformPrice = getPlatformPrice(seats);
  const platformTotal = seats * platformPrice;

  // Tier 2: Design as a Service
  const [designEnabled, setDesignEnabled] = useState(false);
  const [designPlan, setDesignPlan] = useState<string | null>('starter');
  const designPrice = designEnabled ? (DESIGN_PLANS.find((p) => p.key === designPlan)?.price ?? 0) : 0;

  // Tier 3: Full-Service
  const [execEnabled, setExecEnabled] = useState(false);
  const [execProfiles, setExecProfiles] = useState(1);
  const [execFrequency, setExecFrequency] = useState<string>('2x');
  const execPrice =
    execEnabled && execProfiles > 0 && execFrequency
      ? EXEC_PRICING[String(execProfiles)]?.[execFrequency] ?? 0
      : 0;

  // Totals
  const totalMensal = platformTotal + designPrice + execPrice;

  // Form state
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const input: ProposalLeadInput = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      cargo: formData.get('cargo') as string,
      empresa: formData.get('empresa') as string,
      funcionarios: formData.get('funcionarios') as string,
      plataformaSeats: seats,
      plataformaPrice: platformPrice,
      designPlan: designEnabled ? designPlan : null,
      designPrice,
      executiveProfiles: execEnabled ? execProfiles : 0,
      executiveFrequency: execEnabled ? execFrequency : null,
      executivePrice: execPrice,
      totalMensal,
      origem: 'Simulador de Proposta',
    };

    const res = await sendProposalLeadToNotion(input);

    if (res.success) {
      setStatus('success');
      setStep('success');
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
                {step === 'success' ? 'Sua proposta' : step === 'contact' ? 'Seus dados' : 'Monte sua proposta'}
              </Dialog.Title>
              {step === 'builder' && (
                <p className="text-xs text-muted-foreground">
                  Configure o pacote ideal para sua empresa
                </p>
              )}
              {step === 'contact' && (
                <p className="text-xs text-muted-foreground">
                  Preencha seus dados para desbloquear o preço
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
                seats={seats}
                setSeats={setSeats}
                platformPrice={platformPrice}
                platformTotal={platformTotal}
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
                totalMensal={totalMensal}
                onContinue={() => setStep('contact')}
              />
            )}

            {step === 'contact' && (
              <ContactStep
                status={status}
                errorMessage={errorMessage}
                onSubmit={handleSubmit}
                onBack={() => {
                  setStep('builder');
                  setStatus('idle');
                  setErrorMessage('');
                }}
              />
            )}

            {step === 'success' && (
              <SuccessStep
                seats={seats}
                platformPrice={platformPrice}
                platformTotal={platformTotal}
                designEnabled={designEnabled}
                designPlan={designPlan}
                designPrice={designPrice}
                execEnabled={execEnabled}
                execProfiles={execProfiles}
                execFrequency={execFrequency}
                execPrice={execPrice}
                totalMensal={totalMensal}
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
/*  Step 1: Builder                                                            */
/* -------------------------------------------------------------------------- */

function BuilderStep({
  seats,
  setSeats,
  platformPrice,
  platformTotal,
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
  totalMensal,
  onContinue,
}: {
  seats: number;
  setSeats: (v: number) => void;
  platformPrice: number;
  platformTotal: number;
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
  totalMensal: number;
  onContinue: () => void;
}) {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* ── Tier 1: Platform (always active) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-foreground">Plataforma SaaS</h3>
            <p className="text-[11px] text-muted-foreground">Base do programa — obrigatório</p>
          </div>
        </div>

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
            <span className="text-muted-foreground">{formatBRL(platformPrice)}/seat</span>
            <span className="font-bold text-foreground">{formatBRL(platformTotal)}/mês</span>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Design as a Service (toggle) ── */}
      <div>
        <Toggle
          checked={designEnabled}
          onChange={setDesignEnabled}
          label="Design as a Service"
          description="Peças gráficas para o time"
          icon={<Palette className="h-4 w-4 text-violet-500" />}
          iconColor="bg-violet-500/10"
        />

        {/* Collapsible content */}
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

        {/* Collapsible content */}
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

      {/* ── Summary (total hidden / blurred) ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
        <h4 className="text-sm font-bold text-accent-foreground mb-3">Resumo da proposta</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plataforma ({seats} seats)</span>
            <span className="font-medium">{formatBRL(platformTotal)}</span>
          </div>
          {designEnabled && designPlan && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Design ({DESIGN_PLANS.find((p) => p.key === designPlan)?.label})
              </span>
              <span className="font-medium">{formatBRL(designPrice)}</span>
            </div>
          )}
          {execEnabled && execPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Full-Service ({execProfiles}p × {execFrequency}/sem)
              </span>
              <span className="font-medium">{formatBRL(execPrice)}</span>
            </div>
          )}

          {/* Blurred total */}
          <div className="flex items-center justify-between pt-3 border-t border-primary/20">
            <span className="font-bold text-accent-foreground text-sm">Total mensal</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary blur-[6px] select-none" aria-hidden="true">
                {formatBRL(totalMensal)}
              </span>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onContinue} className="w-full gap-2">
        Ver minha proposta
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Contact form (lead capture)                                        */
/* -------------------------------------------------------------------------- */

function ContactStep({
  status,
  errorMessage,
  onSubmit,
  onBack,
}: {
  status: string;
  errorMessage: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
        <Lock className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-accent-foreground">
            Desbloqueie sua proposta completa
          </p>
          <p className="text-[11px] text-muted-foreground">
            Preencha os dados abaixo para ver o preço final e exportar sua proposta.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-xs text-primary hover:underline"
      >
        ← Voltar e ajustar
      </button>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="prop-nome" className="text-sm font-medium text-foreground">
            Nome completo
          </label>
          <input
            required
            id="prop-nome"
            name="nome"
            type="text"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="João Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="prop-email" className="text-sm font-medium text-foreground">
              E-mail corporativo
            </label>
            <input
              required
              id="prop-email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="joao@empresa.com"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="prop-telefone" className="text-sm font-medium text-foreground">
              WhatsApp
            </label>
            <input
              required
              id="prop-telefone"
              name="telefone"
              type="tel"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="prop-cargo" className="text-sm font-medium text-foreground">
              Cargo
            </label>
            <input
              required
              id="prop-cargo"
              name="cargo"
              type="text"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="CMO / Head de Marketing"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="prop-empresa" className="text-sm font-medium text-foreground">
              Empresa
            </label>
            <input
              required
              id="prop-empresa"
              name="empresa"
              type="text"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="Sua Empresa"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="prop-funcionarios" className="text-sm font-medium text-foreground">
            Tamanho da empresa
          </label>
          <select
            required
            id="prop-funcionarios"
            name="funcionarios"
            defaultValue=""
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="" disabled>
              Selecione...
            </option>
            <option value="1 a 10 funcionários">1 a 10 funcionários</option>
            <option value="11 a 50 funcionários">11 a 50 funcionários</option>
            <option value="51 a 200 funcionários">51 a 200 funcionários</option>
            <option value="201 a 1000 funcionários">201 a 1000 funcionários</option>
            <option value="Mais de 1000 funcionários">Mais de 1000 funcionários</option>
          </select>
        </div>

        {status === 'error' && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <Button type="submit" disabled={status === 'loading'} className="w-full gap-2">
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Desbloquear proposta
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Success / Proposal revealed + export                               */
/* -------------------------------------------------------------------------- */

function SuccessStep({
  seats,
  platformPrice,
  platformTotal,
  designEnabled,
  designPlan,
  designPrice,
  execEnabled,
  execProfiles,
  execFrequency,
  execPrice,
  totalMensal,
  onClose,
}: {
  seats: number;
  platformPrice: number;
  platformTotal: number;
  designEnabled: boolean;
  designPlan: string | null;
  designPrice: number;
  execEnabled: boolean;
  execProfiles: number;
  execFrequency: string | null;
  execPrice: number;
  totalMensal: number;
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

  return (
    <div className="px-6 py-6">
      {/* Success banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Plataforma SaaS</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {seats} seats × {formatBRL(platformPrice)}/seat
              </span>
              <span className="font-medium">{formatBRL(platformTotal)}/mês</span>
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

        {/* Design */}
        {designEnabled && designPlan && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">Design as a Service</span>
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

        {/* Full-Service */}
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
        <div className="pt-3 border-t border-border/50">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Time dedicado
          </h5>
          <div className="flex flex-wrap gap-3">
            <TeamMember label="Estrategista" />
            <TeamMember label="Suporte" />
            {designEnabled && designPlan && <TeamMember label="Designer" />}
            {execEnabled && execPrice > 0 && (
              <>
                <TeamMember label="Redator" />
                <TeamMember label="Estrategista Sr." />
              </>
            )}
          </div>
        </div>

        {/* Total — now visible! */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <span className="text-sm font-bold text-accent-foreground">Investimento mensal</span>
          <span className="text-xl font-bold text-primary">{formatBRL(totalMensal)}</span>
        </div>
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
