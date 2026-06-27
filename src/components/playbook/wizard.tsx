'use client';

/**
 * Wizard do Playbook de Employee-Led Growth.
 *
 * UX híbrida (spec §3.1):
 *   - Desktop ≥960px: renderiza embed na coluna direita da LP (controlado
 *     pelo container pai). Sempre visível, sem tela de welcome separada.
 *   - Mobile <960px: container pai aplica o modo modal fullscreen (transform
 *     translateY). Este componente em si não muda — só vive em outro container.
 *
 * Fai narradora: cada pergunta tem um balão da Fai contendo título + sub.
 * A pretitle (Pergunta X de 11) e os inputs ficam FORA do balão.
 *
 * Persistência: sessionStorage por slug fixo (`playbook-elg-quiz-state`).
 * Carrega no mount, salva a cada mudança, limpa ao concluir.
 *
 * Submit: chama server action submitPlaybookEmployeeLedGrowthLead, recebe
 * URL do playbook gerado, faz router.push pra /playbook/[slug].
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ListChecks, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitPlaybookEmployeeLedGrowthLead } from '@/app/actions/playbook-employee-led-growth-leads';
import { useUtmParams } from '@/hooks/use-utm-params';
import { captureSubmissionMeta } from '@/lib/source-detection';
import { trackEvent } from '@/lib/track';
import { QUESTIONS, STEP_ORDER } from './wizard-config';
import type { StepKey, ChoiceOption } from './wizard-config';
import { StateElgOptinBox } from './state-elg-optin-box';

/* -------------------------------------------------------------------------- */
/*  Tipos do estado                                                            */
/* -------------------------------------------------------------------------- */

type Answers = {
  porte?: number;
  cargoSenioridade?: string;
  cargoArea?: string;
  setor?: string;
  vozAtual?: string;
  tentativasAnteriores?: string;
  /** P8 vira multi-select de até 2 dores (mai/2026 — copy-final §4.3). */
  doresPrincipais?: string[];
  budgetStatus?: string;
  /**
   * P11 reformulada (mai/2026 — curadoria pós-teste): detector de oportunidade
   * Full Content. Valores: `sim_proprio | sim_full_content | nao_foco`.
   */
  sponsorshipLideranca?: string;
  /**
   * P11.5 — gasto mensal em ads (jun/2026, opcional).
   *
   * Alimenta o gráfico "Ads vs ELG" no Bloco 2 do output. Faixas em vez de
   * número exato pra reduzir fricção. Quando undefined, o componente do
   * gráfico cai no modo conceitual (sem números personalizados).
   */
  gastoMensalAds?: string;
  observacoesLivres?: string;
  nome?: string;
  email?: string;
  empresa?: string;
  telefone?: string;
  newsletterOptIn?: boolean;
  lgpdConsent?: boolean;
  /**
   * State of ELG — consent pra uso anonimizado das respostas no relatório
   * "Panorama Employee-Led Growth no Brasil". Default `true` (opt-out).
   * Ver SPEC-playbook-state-of-elg-consent.md.
   */
  stateElgConsent?: boolean;
  /**
   * State of ELG — opt-in pra receber o relatório em primeira mão.
   * Default `false` (opt-in). Subordinado ao consent (UI bloqueia se
   * consent off; adapter trata como false nesse caso).
   */
  stateElgReportSubscribe?: boolean;
  /**
   * Confirmação que o respondente consegue comprometer 3 colaboradores ativos.
   *
   * Quando aparece (jun/2026): empresa com porte entre 4 e 20 inclusive.
   * Decisões da Clara:
   *   - porte = 3: empresa já tem exatamente o mínimo, compromisso é trivial,
   *     a pergunta nem aparece (goNext direto).
   *   - 4-20: 3 ativos representa parte relevante do time, vale confirmar.
   *   - porte > 20: 3 é trivial, pergunta nem aparece.
   *
   * Vai pro AC como custom field pra time de vendas saber se o lead se
   * comprometeu. Não muda o resto do quiz. No playbook, controla se o
   * texto explicativo sobre o "piso de 3 ativos" aparece no accordion de
   * diagnóstico (só pra quem passou por essa tela).
   */
  porteCompromisso5Ativos?: boolean;
};

type WizardState = {
  currentStep: StepKey | 'not-eligible' | 'loading' | 'success' | 'porte-compromisso';
  answers: Answers;
  history: Array<StepKey | 'porte-compromisso'>;
};

const STORAGE_KEY = 'playbook-elg-quiz-state-v1';
const TOTAL_QUESTIONS = 9;

/** Limites coerentes com Zod no server. */
const PORTE_MIN_VIAVEL = 3;
/**
 * Faixa em que pedimos confirmação de compromisso com 3 colaboradores ativos.
 *
 * Aplicado entre PORTE_COMPROMISSO_INICIO (4) e PORTE_LIMITE_DUVIDA (20)
 * inclusive. Decisões:
 *   - porte = 3 não recebe a pergunta (a empresa TEM exatamente o mínimo;
 *     o compromisso é trivial: a equipe toda precisaria estar ativa).
 *   - porte > 20: 3 ativos é número pequeno em relação ao time; trivial.
 *   - 4-20: 3 ativos representa uma fração relevante do time, vale confirmar.
 */
const PORTE_COMPROMISSO_INICIO = 4;
const PORTE_LIMITE_DUVIDA = 20;

/* -------------------------------------------------------------------------- */
/*  Util — persistência                                                        */
/* -------------------------------------------------------------------------- */

function loadFromStorage(): WizardState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(state: WizardState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage cheio ou bloqueado — ignora */
  }
}

function clearStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                       */
/* -------------------------------------------------------------------------- */

export type PlaybookWizardProps = {
  /** Callback chamado ao clicar no X (modal fullscreen mobile). Opcional. */
  onClose?: () => void;
  /** True quando o wizard está dentro do modal mobile (mostra X no header). */
  isMobileModal?: boolean;
};

export function PlaybookWizard({ onClose, isMobileModal = false }: PlaybookWizardProps) {
  const router = useRouter();
  // Lazy initializer: carrega do sessionStorage NO PRIMEIRO RENDER (não em
  // useEffect). Evita render duplo + cascading state-in-effect lint warning.
  const [state, setState] = useState<WizardState>(() => {
    const saved = loadFromStorage();
    if (saved && saved.currentStep !== 'success' && saved.currentStep !== 'loading') {
      return saved;
    }
    return {
      currentStep: 'porte',
      // State of ELG default ON (opt-out) e report subscribe default OFF.
      // Ver SPEC-playbook-state-of-elg-consent.md §3.1.
      answers: {
        porte: QUESTIONS.porte.initial,
        stateElgConsent: true,
        stateElgReportSubscribe: false,
      },
      history: [],
    };
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  // UTMs da URL (persistidos em sessionStorage). Spread no payload do submit
  // pra atribuir canal/campanha mesmo se a pessoa navegou antes de preencher.
  const utms = useUtmParams();
  // Flag de "já trackei o start" — useRef pra não disparar re-render.
  const quizStartTrackedRef = useRef(false);

  // Salva a cada mudança
  useEffect(() => {
    if (state.currentStep === 'success' || state.currentStep === 'loading') return;
    saveToStorage(state);
  }, [state]);

  // Dispara `playbook_quiz_started` na primeira vez que o componente monta
  // mostrando a 1ª pergunta (P1 porte). Só uma vez por sessão.
  useEffect(() => {
    if (quizStartTrackedRef.current) return;
    if (state.currentStep === 'porte' && state.history.length === 0) {
      trackEvent('playbook_quiz_started', {
        source: isMobileModal ? 'mobile_modal' : 'desktop_embed',
      });
      quizStartTrackedRef.current = true;
    }
  }, [state.currentStep, state.history.length, isMobileModal]);

  const progressN = useMemo(() => {
    if (state.currentStep === 'not-eligible' || state.currentStep === 'loading') return 0;
    if (state.currentStep === 'success') return TOTAL_QUESTIONS;
    // porte-compromisso ainda tá conceitualmente "dentro" do step 1 (porte) —
    // mantém o ponteiro no número da P1 pra não dar a sensação de que a barra
    // pulou pra uma pergunta nova.
    if (state.currentStep === 'porte-compromisso') return QUESTIONS.porte.n;
    const q = QUESTIONS[state.currentStep as StepKey];
    return q?.n ?? 0;
  }, [state.currentStep]);

  /* ---------------- Handlers ---------------- */

  const setAnswer = useCallback(<K extends keyof Answers>(key: K, value: Answers[K]) => {
    setState((prev) => ({ ...prev, answers: { ...prev.answers, [key]: value } }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep === 'not-eligible' || prev.currentStep === 'loading' || prev.currentStep === 'success') {
        return prev;
      }
      const currIdx = STEP_ORDER.indexOf(prev.currentStep as StepKey);
      if (currIdx === -1 || currIdx === STEP_ORDER.length - 1) return prev;
      const nextStep = STEP_ORDER[currIdx + 1];
      // Trackeia conclusão do step atual antes de avançar.
      trackEvent('playbook_quiz_step_completed', {
        step: prev.currentStep as StepKey,
        step_number: currIdx + 1,
      });
      return {
        ...prev,
        currentStep: nextStep,
        history: [...prev.history, prev.currentStep as StepKey],
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const newHistory = [...prev.history];
      const last = newHistory.pop()!;
      return { ...prev, currentStep: last, history: newHistory };
    });
  }, []);

  /**
   * Gates após P1 (porte):
   *   - porte < 3  → 'not-eligible' direto (hard block, sem programa viável)
   *   - porte = 3  → goNext() direto (já tem o mínimo, compromisso é trivial)
   *   - 4 ≤ porte ≤ 20 → 'porte-compromisso' (3 ativos representa parte
   *     relevante do time, vale confirmar antes de continuar)
   *   - porte > 20 → goNext() (3 ativos é trivial nesse porte)
   */
  const submitPorte = useCallback(() => {
    const porte = state.answers.porte ?? 0;
    if (porte < PORTE_MIN_VIAVEL) {
      trackEvent('playbook_quiz_gate_triggered', {
        reason: 'porte_baixo',
        porte,
      });
      setState((prev) => ({
        ...prev,
        currentStep: 'not-eligible',
        history: [...prev.history, 'porte'],
      }));
      return;
    }
    if (porte >= PORTE_COMPROMISSO_INICIO && porte <= PORTE_LIMITE_DUVIDA) {
      trackEvent('playbook_quiz_step_completed', {
        step: 'porte',
        step_number: 1,
      });
      setState((prev) => ({
        ...prev,
        currentStep: 'porte-compromisso',
        history: [...prev.history, 'porte'],
      }));
      return;
    }
    goNext();
  }, [state.answers.porte, goNext]);

  /**
   * Resposta da tela intermediária `porte-compromisso`. Sim → continua o quiz
   * a partir do step seguinte ao `porte`. Não → bloqueia em `not-eligible`.
   * A resposta é registrada em `porteCompromisso5Ativos` pra vir como custom
   * field no AC (sinal pra vendas).
   */
  const submitPorteCompromisso = useCallback(
    (confirmou: boolean) => {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, porteCompromisso5Ativos: confirmou },
      }));
      if (!confirmou) {
        trackEvent('playbook_quiz_gate_triggered', {
          reason: 'compromisso_negado',
          porte: state.answers.porte ?? 0,
        });
        setState((prev) => ({
          ...prev,
          currentStep: 'not-eligible',
          history: [...prev.history, 'porte-compromisso'],
        }));
        return;
      }
      trackEvent('playbook_quiz_step_completed', {
        step: 'porte-compromisso',
        step_number: 1,
      });
      // Avanço manual: STEP_ORDER[0] é 'porte', então o próximo é STEP_ORDER[1].
      setState((prev) => ({
        ...prev,
        currentStep: STEP_ORDER[1],
        history: [...prev.history, 'porte-compromisso'],
      }));
    },
    [state.answers.porte],
  );

  /** Submit final — chama server action. */
  const handleFinalSubmit = useCallback(async () => {
    const a = state.answers;

    // Validação leve no client antes de chamar server (server tem Zod completo).
    if (!a.nome || !a.email || !a.empresa || !a.lgpdConsent) {
      setSubmitError('Preencha nome, email, empresa e aceite a LGPD.');
      return;
    }
    // Honeypot: lê o input escondido do DOM. Bots simples vão preencher;
    // humanos não veem nem tabulam. Server descarta silenciosamente se != ''.
    const honeypotEl = typeof document !== 'undefined'
      ? (document.querySelector('input[name="website"]') as HTMLInputElement | null)
      : null;
    const honeypotValue = honeypotEl?.value ?? '';

    setSubmitError(null);
    setState((prev) => ({ ...prev, currentStep: 'loading' }));

    try {
      const result = await submitPlaybookEmployeeLedGrowthLead({
        nome: a.nome,
        email: a.email,
        empresa: a.empresa,
        telefone: a.telefone || undefined,
        newsletterOptIn: a.newsletterOptIn ?? false,
        lgpdConsent: a.lgpdConsent,
        // State of ELG — defaults coerentes com Zod (consent ON, subscribe OFF).
        stateElgConsent: a.stateElgConsent ?? true,
        stateElgReportSubscribe: a.stateElgReportSubscribe ?? false,
        porteColaboradores: a.porte ?? 0,
        // Só presente quando porte ≤ 20 (pergunta foi feita). Quando
        // ausente, server entende como "pergunta não aplicável".
        porteCompromisso5Ativos: a.porteCompromisso5Ativos,
        cargoSenioridade: a.cargoSenioridade as never,
        cargoArea: a.cargoArea as never,
        setor: a.setor ?? '',
        vozAtual: a.vozAtual as never,
        tentativasAnteriores: a.tentativasAnteriores as never,
        doresPrincipais: (a.doresPrincipais ?? []) as never,
        budgetStatus: a.budgetStatus as never,
        sponsorshipLideranca: a.sponsorshipLideranca as never,
        // Gasto em ads (jun/2026) — undefined quando a pessoa pulou.
        gastoMensalAds: (a.gastoMensalAds as never) || undefined,
        observacoesLivres: a.observacoesLivres || undefined,
        website: honeypotValue, // honeypot — vazio em humanos, preenchido em bots
        origem: '/ferramentas/playbook-employee-led-growth',
        ...utms,
        ...captureSubmissionMeta(),
      });

      if (!result.success) {
        setSubmitError(result.error ?? 'Erro inesperado. Tente novamente.');
        setState((prev) => ({ ...prev, currentStep: 'identificacao' }));
        return;
      }

      // Trackeia o submit bem-sucedido com snapshot das respostas-chave
      // (sem PII — não mandamos email/nome).
      trackEvent('playbook_quiz_submitted', {
        area: a.cargoArea ?? 'unknown',
        dores_principais: (a.doresPrincipais ?? []).join(','),
        porte_colaboradores: a.porte ?? 0,
        seniority: a.cargoSenioridade ?? 'unknown',
        tentativas: a.tentativasAnteriores ?? 'unknown',
        budget_status: a.budgetStatus ?? 'unknown',
      });

      clearStorage();
      // Redirect pra página do playbook gerado
      router.push(result.playbookUrl);
    } catch (err) {
      console.error('[playbook-wizard] submit failed:', err);
      setSubmitError('Erro de conexão. Tente novamente.');
      setState((prev) => ({ ...prev, currentStep: 'identificacao' }));
    }
  }, [state.answers, router, utms]);

  /* ---------------- Render ---------------- */

  return (
    <div className="flex h-full max-h-full flex-col overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border">
      <WizardHeader
        progressN={progressN}
        onClose={isMobileModal ? onClose : undefined}
        onToggleRecap={() => setIsRecapOpen((v) => !v)}
      />

      {isRecapOpen && <RecapPanel answers={state.answers} />}

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        {state.currentStep === 'not-eligible' ? (
          <NotEligibleView porte={state.answers.porte ?? 0} />
        ) : state.currentStep === 'porte-compromisso' ? (
          <PorteCompromissoView
            porte={state.answers.porte ?? 0}
            onAnswer={submitPorteCompromisso}
          />
        ) : state.currentStep === 'loading' ? (
          <LoadingView />
        ) : (
          <QuestionView
            stepKey={state.currentStep as StepKey}
            answers={state.answers}
            onAnswer={setAnswer}
          />
        )}
      </div>

      {/* Footer aparece em todos os steps exceto telas terminais (not-eligible,
          loading) e exceto porte-compromisso, que tem botões próprios (sim/não)
          renderizados dentro da view e não usa o footer padrão Continuar/Voltar. */}
      {state.currentStep !== 'not-eligible' &&
        state.currentStep !== 'loading' &&
        state.currentStep !== 'porte-compromisso' && (
          <WizardFooter
            stepKey={state.currentStep as StepKey}
            answers={state.answers}
            canGoBack={state.history.length > 0}
            onBack={goBack}
            onNext={state.currentStep === 'porte' ? submitPorte : goNext}
            onFinalSubmit={handleFinalSubmit}
            error={submitError}
          />
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-componentes                                                            */
/* -------------------------------------------------------------------------- */

function WizardHeader({
  progressN,
  onClose,
  onToggleRecap,
}: {
  progressN: number;
  onClose?: () => void;
  onToggleRecap: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-col gap-3 bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-5 py-4 text-white sm:px-6">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF] shadow-lg">
          <Image
            src="/images/fai-avatar.jpeg"
            alt="Fai"
            fill
            sizes="40px"
            className="object-cover"
          />
          <span className="absolute -bottom-px -right-px h-3 w-3 rounded-full border-[2.5px] border-[#1A0E2E] bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold tracking-tight">Fai · Estrategista Boldfy</div>
          <div className="text-[11px] text-white/55">Vai te guiar nas 11 perguntas</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#CD50F1] to-[#E875FF] transition-all duration-300"
            style={{ width: `${(progressN / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text font-extrabold text-transparent">
            {progressN || '—'}
          </span>{' '}
          de {TOTAL_QUESTIONS}
        </span>
        <button
          type="button"
          onClick={onToggleRecap}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          <ListChecks className="h-3 w-3" />
          Respostas
        </button>
      </div>
    </header>
  );
}

function RecapPanel({ answers }: { answers: Answers }) {
  const items: Array<{ q: string; a: string }> = [];
  if (answers.porte != null) items.push({ q: 'Porte', a: `${answers.porte} colaboradores` });
  if (answers.cargoSenioridade) items.push({ q: 'Senioridade', a: labelOf(QUESTIONS.cargoSenioridade.options, answers.cargoSenioridade) });
  if (answers.cargoArea) items.push({ q: 'Área', a: labelOf(QUESTIONS.cargoArea.options, answers.cargoArea) });
  if (answers.setor) items.push({ q: 'Setor', a: answers.setor });
  if (answers.vozAtual) items.push({ q: 'Voz atual', a: labelOf(QUESTIONS.vozAtual.options, answers.vozAtual) });
  if (answers.tentativasAnteriores) items.push({ q: 'Tentativas', a: labelOf(QUESTIONS.tentativasAnteriores.options, answers.tentativasAnteriores) });
  if (answers.doresPrincipais?.length) items.push({ q: 'Dores principais', a: answers.doresPrincipais.map((v) => labelOf(QUESTIONS.doresPrincipais.options, v)).join(', ') });
  if (answers.budgetStatus) items.push({ q: 'Budget', a: labelOf(QUESTIONS.budgetStatus.options, answers.budgetStatus) });
  if (answers.sponsorshipLideranca) items.push({ q: 'Sponsorship', a: labelOf(QUESTIONS.sponsorshipLideranca.options, answers.sponsorshipLideranca) });

  return (
    <div className="max-h-60 shrink-0 overflow-y-auto border-b border-border bg-secondary px-5 py-3 sm:px-7">
      {items.length === 0 ? (
        <p className="py-2 text-center text-xs italic text-muted-foreground">
          Suas respostas vão aparecer aqui conforme você for respondendo.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.q} className="border-b border-border/40 pb-2 last:border-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{it.q}</div>
              <div className="text-sm font-bold text-foreground">{it.a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function labelOf<V extends string>(options: ReadonlyArray<ChoiceOption<V>>, value: string): string {
  return options.find((o) => o.v === value)?.label ?? value;
}

/* -------------------- QuestionView (Fai bubble + content) -------------------- */

function QuestionView({
  stepKey,
  answers,
  onAnswer,
}: {
  stepKey: StepKey;
  answers: Answers;
  onAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
}) {
  if (stepKey === 'identificacao') {
    return <IdentificationView answers={answers} onAnswer={onAnswer} />;
  }
  // P11.5 — gasto mensal em ads (opcional, alimenta gráfico do Bloco 2).
  // Pretitle "Bônus opcional" + footer mostra botão "Pular" (lógica em
  // isOptional do WizardFooter).
  if (stepKey === 'gastoMensalAds') {
    const cfg = QUESTIONS.gastoMensalAds;
    const currentValue = answers.gastoMensalAds;
    return (
      <FaiQuestion
        pretitle="Bônus opcional"
        faiSay={cfg.faiSay}
        title={cfg.title}
        sub={cfg.sub}
      >
        <div className="grid gap-2">
          {cfg.options.map((opt) => (
            <OptionCard
              key={opt.v}
              option={opt}
              selected={currentValue === opt.v}
              onClick={() => onAnswer('gastoMensalAds', opt.v)}
            />
          ))}
        </div>
      </FaiQuestion>
    );
  }
  if (stepKey === 'observacoesLivres') {
    return (
      <FaiQuestion
        pretitle="Pergunta opcional"
        faiSay={QUESTIONS.observacoesLivres.faiSay}
        title={QUESTIONS.observacoesLivres.title}
        sub={QUESTIONS.observacoesLivres.sub}
      >
        <Textarea
          value={answers.observacoesLivres ?? ''}
          maxLength={QUESTIONS.observacoesLivres.maxLength}
          placeholder={QUESTIONS.observacoesLivres.placeholder}
          onChange={(e) => onAnswer('observacoesLivres', e.target.value)}
          className="min-h-[120px] resize-y"
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {(answers.observacoesLivres?.length ?? 0)} / {QUESTIONS.observacoesLivres.maxLength}
        </p>
      </FaiQuestion>
    );
  }
  if (stepKey === 'porte') {
    return (
      <FaiQuestion
        pretitle={`Pergunta ${QUESTIONS.porte.n} de ${TOTAL_QUESTIONS}`}
        faiSay={QUESTIONS.porte.faiSay}
        title={QUESTIONS.porte.title}
        sub={QUESTIONS.porte.sub}
      >
        <NumericInput
          value={answers.porte ?? QUESTIONS.porte.initial}
          onChange={(v) => onAnswer('porte', v)}
        />
        <p className="mt-4 border-t border-dashed border-border pt-3 text-center text-[11px] text-muted-foreground">
          Employee-Led Growth precisa de pelo menos 3 colaboradores pra dar tração.
        </p>
      </FaiQuestion>
    );
  }
  // Multi-select: P8 (doresPrincipais até 2). Lógica FIFO — quando passa do
  // max, remove o item mais antigo. (P9 resultadosPrioritarios foi removida
  // na curadoria mai/2026; agora só doresPrincipais usa multi.)
  if (stepKey === 'doresPrincipais') {
    const cfg = QUESTIONS[stepKey];
    const selected = (answers[stepKey] as string[] | undefined) ?? [];
    const max = cfg.max;
    return (
      <FaiQuestion
        pretitle={`Pergunta ${cfg.n} de ${TOTAL_QUESTIONS}`}
        faiSay={cfg.faiSay}
        title={cfg.title}
        sub={cfg.sub}
      >
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Selecionadas: <span className="text-primary">{selected.length}</span> de {max}
        </p>
        <div className="grid gap-2">
          {cfg.options.map((opt) => {
            const checked = selected.includes(opt.v);
            return (
              <OptionCard
                key={opt.v}
                option={opt}
                selected={checked}
                onClick={() => {
                  let next = [...selected];
                  if (checked) {
                    next = next.filter((v) => v !== opt.v);
                  } else {
                    if (next.length >= max) next.shift(); // FIFO — remove o mais antigo
                    next.push(opt.v);
                  }
                  onAnswer(stepKey, next as never);
                }}
              />
            );
          })}
        </div>
      </FaiQuestion>
    );
  }

  // Choice (radio) genérico — P2, P3, P4, P5, P6, P7, P8, P10, P11
  const cfg = QUESTIONS[stepKey] as {
    n: number;
    faiSay: string;
    title: string;
    sub: string;
    options: ReadonlyArray<ChoiceOption<string>>;
  };
  const currentValue = answers[stepKey] as string | undefined;

  return (
    <FaiQuestion
      pretitle={`Pergunta ${cfg.n} de ${TOTAL_QUESTIONS}`}
      faiSay={cfg.faiSay}
      title={cfg.title}
      sub={cfg.sub}
    >
      <div className="grid gap-2">
        {cfg.options.map((opt) => (
          <OptionCard
            key={opt.v}
            option={opt}
            // Setor armazena LABEL (não slug) em answers — então o estado
            // selected também compara contra o label. Resto compara contra o slug.
            selected={stepKey === 'setor' ? currentValue === opt.label : currentValue === opt.v}
            onClick={() => {
              // Setor envia o label (string controlada — coluna industry recebe texto legível)
              if (stepKey === 'setor') {
                onAnswer('setor', opt.label);
              } else {
                onAnswer(stepKey, opt.v as never);
              }
            }}
          />
        ))}
      </div>
    </FaiQuestion>
  );
}

/* -------------------- FaiQuestion: pretitle + balão + body -------------------- */

function FaiQuestion({
  pretitle,
  faiSay,
  title,
  sub,
  children,
}: {
  pretitle: string;
  faiSay: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
        {pretitle}
      </span>

      <div className="flex items-start gap-3">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF]">
          <Image src="/images/fai-avatar.jpeg" alt="Fai" fill sizes="32px" className="object-cover" />
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-md border border-primary/10 bg-secondary px-4 py-3">
          {faiSay && <p className="mb-2 text-[13px] font-medium text-foreground/85">{faiSay}</p>}
          <h2 className="font-headline text-xl font-black leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {sub && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}

/* -------------------- OptionCard -------------------- */

function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: ChoiceOption<string>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-xl border bg-card px-4 py-3 text-left transition-all
        ${selected
          ? 'border-primary bg-secondary'
          : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'}`}
    >
      <div className="text-sm font-bold text-foreground">{option.label}</div>
      {option.desc && <div className="mt-0.5 text-[11px] text-muted-foreground">{option.desc}</div>}
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF] text-[11px] font-bold text-white shadow">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* -------------------- NumericInput -------------------- */

function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const adjust = (delta: number) => onChange(Math.max(1, value + delta));
  return (
    <div className="rounded-2xl border border-border bg-background p-6 text-center">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => adjust(-1)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card font-bold text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          aria-label="Diminuir"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          value={value}
          onChange={(e) => {
            const raw = parseInt(e.target.value || '0', 10);
            onChange(Number.isNaN(raw) ? 0 : Math.max(0, raw));
          }}
          onBlur={() => { if (value < 1) onChange(1); }}
          className="w-44 border-b-2 border-dashed border-transparent bg-transparent text-center font-headline text-5xl font-black tracking-tight tabular-nums outline-none transition-colors hover:border-primary/30 focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{
            backgroundImage: 'linear-gradient(135deg, #CD50F1, #E875FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card font-bold text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          aria-label="Aumentar"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        colaboradores no total
      </p>
    </div>
  );
}

/* -------------------- IdentificationView -------------------- */

function IdentificationView({
  answers,
  onAnswer,
}: {
  answers: Answers;
  onAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
}) {
  return (
    <FaiQuestion
      pretitle="Última etapa"
      faiSay={QUESTIONS.identificacao.faiSay}
      title={QUESTIONS.identificacao.title}
      sub={QUESTIONS.identificacao.sub}
    >
      <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
        {/* Honeypot: humanos não veem (left:-9999px) nem tabulam (tabIndex=-1).
            Bots simples preenchem qualquer input do form e cai no descarte
            silencioso do server. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />
        <Field label="Nome completo">
          <Input
            value={answers.nome ?? ''}
            onChange={(e) => onAnswer('nome', e.target.value)}
            placeholder="Como você quer ser chamado(a)?"
          />
        </Field>
        <Field label="Email corporativo">
          <Input
            type="email"
            value={answers.email ?? ''}
            onChange={(e) => onAnswer('email', e.target.value)}
            placeholder="voce@suaempresa.com.br"
          />
        </Field>
        <Field label="Empresa">
          <Input
            value={answers.empresa ?? ''}
            onChange={(e) => onAnswer('empresa', e.target.value)}
            placeholder="Nome da sua empresa"
          />
        </Field>
        <Field label="Telefone (opcional)">
          <Input
            type="tel"
            value={answers.telefone ?? ''}
            onChange={(e) => onAnswer('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </Field>

        <label className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={answers.newsletterOptIn ?? false}
            onChange={(e) => onAnswer('newsletterOptIn', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>Quero receber a newsletter da Boldfy</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={answers.lgpdConsent ?? false}
            onChange={(e) => onAnswer('lgpdConsent', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
            required
          />
          <span>
            Concordo com o tratamento dos meus dados conforme a{' '}
            <a
              href="/legal#privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Política de Privacidade
            </a>{' '}
            da Boldfy. <span className="text-primary">*</span>
          </span>
        </label>

        {/* Box State of ELG (opt-out consent + opt-in report subscription).
            Ver docs/SPEC-playbook-state-of-elg-consent.md. */}
        <div className="pt-1">
          <StateElgOptinBox
            consent={answers.stateElgConsent ?? true}
            onConsentChange={(v) => {
              onAnswer('stateElgConsent', v);
              // Se desliga consent, força subscribe off (defensivo).
              if (!v && answers.stateElgReportSubscribe) {
                onAnswer('stateElgReportSubscribe', false);
              }
            }}
            subscribe={answers.stateElgReportSubscribe ?? false}
            onSubscribeChange={(v) => onAnswer('stateElgReportSubscribe', v)}
          />
        </div>
      </div>
    </FaiQuestion>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-foreground">{label}</label>
      {children}
    </div>
  );
}

/* -------------------- NotEligibleView -------------------- */

/**
 * Recebe o porte preenchido pra decidir entre dois copies:
 *   - porte < 3: empresa abaixo do piso operacional do programa.
 *   - porte ≥ 3: chegou via 'porte-compromisso' respondendo "não consigo
 *     comprometer 3". Mesmo destino, mas a explicação muda.
 */
function NotEligibleView({ porte }: { porte: number }) {
  const fromCompromisso = porte >= PORTE_MIN_VIAVEL;
  return (
    <div className="space-y-6 py-4 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
        <ChevronLeft className="h-6 w-6 -scale-x-100 text-primary" />
      </div>
      <h3 className="font-headline text-xl font-black leading-tight tracking-tight text-foreground">
        Ainda não é hora{' '}
        <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
          de Employee-Led Growth
        </span>
      </h3>
      {fromCompromisso ? (
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          Sem 3 colaboradores comprometidos em postar com regularidade, a estratégia não
          gera o earned media e a consistência necessária pra valer o esforço. Com porte
          enxuto como o seu, faz mais sentido começar por founder-led growth (founder/CEO
          puxando o conteúdo solo) e só montar o programa quando esse compromisso
          existir do lado do time.
          <br />
          <br />
          Se você é consultor pesquisando pra um cliente, vamos conversar.
        </p>
      ) : (
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          O programa precisa de pelo menos 3 colaboradores ativos pra rodar de forma
          sustentável. Com menos que isso, founder-led growth (founder/CEO postando
          solo) tende a render mais que tentar montar um programa.
          <br />
          <br />
          Se você é consultor pesquisando pra um cliente, vamos conversar.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <a href="/agendar-demo">Falar com a Boldfy</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/materiais">Ver outros materiais</a>
        </Button>
      </div>
    </div>
  );
}

/* -------------------- PorteCompromissoView -------------------- */

/**
 * Tela intermediária pra empresas com porte 5–20: confirma que a pessoa
 * consegue comprometer 3 colaboradores ativos antes de seguir o quiz.
 *
 * "Sim" → próximo step (cargoSenioridade), grava `porteCompromisso5Ativos=true`.
 * "Não" → 'not-eligible' (copy condicional), grava `porteCompromisso5Ativos=false`.
 *
 * Visual reaproveita o padrão FaiQuestion (avatar + balão) pra manter
 * continuidade narrativa com o resto do quiz — a Fai é quem está pedindo
 * o compromisso, não um popup do site.
 */
function PorteCompromissoView({
  porte,
  onAnswer,
}: {
  porte: number;
  onAnswer: (confirmou: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
        Confirmação rápida
      </span>

      <div className="flex items-start gap-3">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF]">
          <Image src="/images/fai-avatar.jpeg" alt="Fai" fill sizes="32px" className="object-cover" />
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-md border border-primary/10 bg-secondary px-4 py-3">
          <p className="mb-2 text-[13px] font-medium text-foreground/85">
            Antes de eu montar seu playbook, preciso confirmar um ponto.
          </p>
          <h2 className="font-headline text-xl font-black leading-tight tracking-tight text-foreground">
            Vocês conseguem comprometer{' '}
            <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
              ao menos 3 colaboradores
            </span>{' '}
            ativos no programa?
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Com {porte} colaboradores no time, 3 ativos já representa parte relevante da
            empresa. O programa precisa desse piso pra gerar earned media consistente.
            Sem isso, founder-led growth costuma render mais que tentar montar o programa.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        <Button size="lg" className="w-full" onClick={() => onAnswer(true)}>
          Sim, consigo comprometer 3
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => onAnswer(false)}>
          Não, é muito pro nosso porte
        </Button>
      </div>
    </div>
  );
}

/* -------------------- LoadingView -------------------- */

function LoadingView() {
  const messages = [
    'Analisando suas respostas...',
    'Cruzando com benchmarks do mercado...',
    'Calculando earned media potencial...',
    'Montando seu playbook personalizado...',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, messages.length - 1)), 1500);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="space-y-6 py-10 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p className="text-sm font-semibold text-foreground transition-opacity">{messages[idx]}</p>
      <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
        Cruzando seu cenário com benchmarks do mercado pra montar o plano mais relevante.
      </p>
    </div>
  );
}

/* -------------------- WizardFooter -------------------- */

function WizardFooter({
  stepKey,
  answers,
  canGoBack,
  onBack,
  onNext,
  onFinalSubmit,
  error,
}: {
  stepKey: StepKey;
  answers: Answers;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinalSubmit: () => void;
  error: string | null;
}) {
  const nextDisabled = isNextDisabled(stepKey, answers);
  const isLast = stepKey === 'identificacao';
  const isOptional = stepKey === 'observacoesLivres' || stepKey === 'gastoMensalAds';

  return (
    <footer className="shrink-0 border-t border-border bg-card px-5 py-3 sm:px-7">
      {error && (
        <p className="mb-2 text-center text-xs text-red-600">{error}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={!canGoBack}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-3 w-3" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          {isOptional && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Pular
            </Button>
          )}
          {isLast ? (
            <Button size="sm" onClick={onFinalSubmit} disabled={nextDisabled}>
              Gerar Playbook
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={onNext} disabled={nextDisabled}>
              Continuar
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}

function isNextDisabled(stepKey: StepKey, answers: Answers): boolean {
  if (stepKey === 'porte') return !answers.porte || answers.porte < 1;
  if (stepKey === 'cargoSenioridade') return !answers.cargoSenioridade;
  if (stepKey === 'cargoArea') return !answers.cargoArea;
  if (stepKey === 'setor') return !answers.setor;
  if (stepKey === 'vozAtual') return !answers.vozAtual;
  if (stepKey === 'tentativasAnteriores') return !answers.tentativasAnteriores;
  if (stepKey === 'doresPrincipais') return !answers.doresPrincipais?.length;
  if (stepKey === 'budgetStatus') return !answers.budgetStatus;
  if (stepKey === 'sponsorshipLideranca') return !answers.sponsorshipLideranca;
  if (stepKey === 'gastoMensalAds') return false; // opcional — botão Pular sempre disponível
  if (stepKey === 'observacoesLivres') return false; // sempre pode pular
  if (stepKey === 'identificacao') {
    return !answers.nome || !answers.email || !answers.empresa || !answers.lgpdConsent;
  }
  return false;
}
