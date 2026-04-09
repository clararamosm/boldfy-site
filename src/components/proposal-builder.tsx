'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Check, Loader2, CheckCircle2, Users, Palette, Mic } from 'lucide-react';
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
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

type ProposalBuilderContextType = {
  isOpen: boolean;
  openBuilder: () => void;
  closeBuilder: () => void;
};

const ProposalBuilderContext = React.createContext<ProposalBuilderContextType | undefined>(undefined);

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
      <ProposalBuilderPanel isOpen={isOpen} onClose={closeBuilder} />
    </ProposalBuilderContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Slide-in panel                                                             */
/* -------------------------------------------------------------------------- */

type Step = 'builder' | 'contact' | 'success';

function ProposalBuilderPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('builder');

  // Tier 1: Platform
  const [seats, setSeats] = useState(10);
  const platformPrice = getPlatformPrice(seats);
  const platformTotal = seats * platformPrice;

  // Tier 2: Design as a Service
  const [designPlan, setDesignPlan] = useState<string | null>(null);
  const designPrice = DESIGN_PLANS.find((p) => p.key === designPlan)?.price ?? 0;

  // Tier 3: Full-Service
  const [execProfiles, setExecProfiles] = useState(0);
  const [execFrequency, setExecFrequency] = useState<string | null>(null);
  const execPrice =
    execProfiles > 0 && execFrequency
      ? EXEC_PRICING[String(execProfiles)]?.[execFrequency] ?? 0
      : 0;

  // Totals
  const totalMensal = platformTotal + designPrice + execPrice;

  // Form state
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset on close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('builder');
      setStatus('idle');
      setErrorMessage('');
    }, 300);
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
      designPlan,
      designPrice,
      executiveProfiles: execProfiles,
      executiveFrequency: execFrequency,
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
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Monte sua proposta"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-accent-foreground">
              {step === 'success' ? 'Proposta enviada!' : 'Monte sua proposta'}
            </h2>
            {step === 'builder' && (
              <p className="text-xs text-muted-foreground">
                Configure o pacote ideal para sua empresa
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'builder' && (
            <BuilderStep
              seats={seats}
              setSeats={setSeats}
              platformPrice={platformPrice}
              platformTotal={platformTotal}
              designPlan={designPlan}
              setDesignPlan={setDesignPlan}
              designPrice={designPrice}
              execProfiles={execProfiles}
              setExecProfiles={setExecProfiles}
              execFrequency={execFrequency}
              setExecFrequency={setExecFrequency}
              execPrice={execPrice}
              totalMensal={totalMensal}
            />
          )}

          {step === 'contact' && (
            <ContactStep
              status={status}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
              onBack={() => setStep('builder')}
              totalMensal={totalMensal}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              seats={seats}
              platformPrice={platformPrice}
              platformTotal={platformTotal}
              designPlan={designPlan}
              designPrice={designPrice}
              execProfiles={execProfiles}
              execFrequency={execFrequency}
              execPrice={execPrice}
              totalMensal={totalMensal}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer CTA */}
        {step === 'builder' && (
          <div className="border-t border-border/50 p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total mensal</span>
              <span className="text-xl font-bold text-primary">{formatBRL(totalMensal)}</span>
            </div>
            <Button onClick={() => setStep('contact')} className="w-full gap-2">
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
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
  designPlan,
  setDesignPlan,
  designPrice,
  execProfiles,
  setExecProfiles,
  execFrequency,
  setExecFrequency,
  execPrice,
  totalMensal,
}: {
  seats: number;
  setSeats: (v: number) => void;
  platformPrice: number;
  platformTotal: number;
  designPlan: string | null;
  setDesignPlan: (v: string | null) => void;
  designPrice: number;
  execProfiles: number;
  setExecProfiles: (v: number) => void;
  execFrequency: string | null;
  setExecFrequency: (v: string | null) => void;
  execPrice: number;
  totalMensal: number;
}) {
  return (
    <div className="px-6 py-6 space-y-8">
      {/* ── Tier 1: Platform ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-foreground">Plataforma SaaS</h3>
            <p className="text-[11px] text-muted-foreground">Obrigatório — base do programa</p>
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
          <div className="flex justify-between mt-1 mb-4">
            <span className="text-[10px] text-muted-foreground">5</span>
            <span className="text-[10px] text-muted-foreground">70</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatBRL(platformPrice)}/seat
            </span>
            <span className="font-bold text-foreground">{formatBRL(platformTotal)}/mês</span>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Design as a Service ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-500/10">
            <Palette className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-foreground">Design as a Service</h3>
            <p className="text-[11px] text-muted-foreground">Opcional — peças gráficas para o time</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {DESIGN_PLANS.map((plan) => (
            <button
              key={plan.key}
              type="button"
              onClick={() => setDesignPlan(designPlan === plan.key ? null : plan.key)}
              className={cn(
                'rounded-xl border p-3 text-center transition-all',
                designPlan === plan.key
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30',
              )}
            >
              <p className="text-xs font-bold text-accent-foreground">{plan.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{plan.pieces} peças/mês</p>
              <p className="text-sm font-bold text-primary mt-2">{formatBRL(plan.price)}</p>
            </button>
          ))}
        </div>
        {designPlan && (
          <button
            type="button"
            onClick={() => setDesignPlan(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Remover design
          </button>
        )}
      </div>

      {/* ── Tier 3: Full-Service ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10">
            <Mic className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-foreground">Content Full-Service</h3>
            <p className="text-[11px] text-muted-foreground">Opcional — ativação executiva completa</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {/* Profiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Perfis executivos</label>
              <span className="text-lg font-bold text-primary">{execProfiles}</span>
            </div>
            <Slider
              min={0}
              max={5}
              step={1}
              value={[execProfiles]}
              onValueChange={(v) => {
                setExecProfiles(v[0]);
                if (v[0] === 0) setExecFrequency(null);
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">0</span>
              <span className="text-[10px] text-muted-foreground">5</span>
            </div>
          </div>

          {/* Frequency */}
          {execProfiles > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Frequência de publicação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['2x', '3x', '4x'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setExecFrequency(execFrequency === freq ? null : freq)}
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
          )}

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

      {/* ── Summary ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="text-sm font-bold text-accent-foreground mb-3">Resumo da proposta</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plataforma ({seats} seats)</span>
            <span className="font-medium">{formatBRL(platformTotal)}</span>
          </div>
          {designPlan && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Design ({DESIGN_PLANS.find((p) => p.key === designPlan)?.label})
              </span>
              <span className="font-medium">{formatBRL(designPrice)}</span>
            </div>
          )}
          {execPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Full-Service ({execProfiles}p × {execFrequency}/sem)
              </span>
              <span className="font-medium">{formatBRL(execPrice)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="font-bold text-accent-foreground">Total mensal</span>
            <span className="font-bold text-primary text-lg">{formatBRL(totalMensal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Contact form                                                       */
/* -------------------------------------------------------------------------- */

function ContactStep({
  status,
  errorMessage,
  onSubmit,
  onBack,
  totalMensal,
}: {
  status: string;
  errorMessage: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  totalMensal: number;
}) {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Proposta de <span className="font-bold text-primary">{formatBRL(totalMensal)}/mês</span>
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-primary hover:underline mt-1"
        >
          ← Voltar e ajustar
        </button>
      </div>

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
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="João Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="prop-email" className="text-sm font-medium text-foreground">
              E-mail corporativo
            </label>
            <input
              required
              id="prop-email"
              name="email"
              type="email"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="prop-cargo" className="text-sm font-medium text-foreground">
              Cargo
            </label>
            <input
              required
              id="prop-cargo"
              name="cargo"
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
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
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar proposta
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Success / Proposal summary                                         */
/* -------------------------------------------------------------------------- */

function SuccessStep({
  seats,
  platformPrice,
  platformTotal,
  designPlan,
  designPrice,
  execProfiles,
  execFrequency,
  execPrice,
  totalMensal,
  onClose,
}: {
  seats: number;
  platformPrice: number;
  platformTotal: number;
  designPlan: string | null;
  designPrice: number;
  execProfiles: number;
  execFrequency: string | null;
  execPrice: number;
  totalMensal: number;
  onClose: () => void;
}) {
  return (
    <div className="px-6 py-8">
      {/* Success icon */}
      <div className="flex flex-col items-center mb-8">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
        <h3 className="text-lg font-bold text-accent-foreground">Proposta recebida!</h3>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Nossa equipe vai entrar em contato para alinhar os próximos passos.
        </p>
      </div>

      {/* Proposal summary card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <h4 className="text-sm font-bold text-accent-foreground">Sua proposta</h4>

        {/* Platform */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Plataforma SaaS</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{seats} seats × {formatBRL(platformPrice)}/seat</span>
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
        {designPlan && (
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">Design as a Service</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {DESIGN_PLANS.find((p) => p.key === designPlan)?.label} — {DESIGN_PLANS.find((p) => p.key === designPlan)?.pieces} peças/mês
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
        {execPrice > 0 && (
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
            {/* Always included */}
            <TeamMember label="Estrategista" />
            <TeamMember label="Suporte" />
            {designPlan && <TeamMember label="Designer" />}
            {execPrice > 0 && (
              <>
                <TeamMember label="Redator" />
                <TeamMember label="Estrategista Sr." />
              </>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <span className="text-sm font-bold text-accent-foreground">Investimento mensal</span>
          <span className="text-xl font-bold text-primary">{formatBRL(totalMensal)}</span>
        </div>
      </div>

      <Button onClick={onClose} variant="outline" className="w-full mt-6">
        Fechar
      </Button>
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
