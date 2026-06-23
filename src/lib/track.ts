/**
 * Helper centralizado pra disparar eventos de tracking no GA4.
 *
 * Toda instrumenta\u00e7\u00e3o de eventos customizados (cta_click, form_open,
 * form_submit_success, etc) passa por aqui. Vantagens:
 *
 * - Um \u00fanico ponto pra desligar tudo (kill switch) se precisar
 * - Tipagem forte dos eventos — evita typos e bagun\u00e7a de nomes
 * - Silencioso em SSR (nao falha se window.gtag nao existir)
 * - F\u00e1cil de estender pra mandar o mesmo evento em outras ferramentas
 *   (ex: LinkedIn Ads conversion tracking, Mixpanel, etc)
 *
 * Pra usar:
 *   import { trackEvent } from '@/lib/track';
 *   trackEvent('cta_click', { cta_type: 'demo', source: 'header:desktop' });
 */

declare global {
  interface Window {
    /** LinkedIn Insight Tag (carregada via GTM). Disponível após o insight.min.js. */
    lintrk?: (action: 'track', data: { conversion_id: number }) => void;
  }
}

/**
 * Conversões do LinkedIn Campaign Manager (conta Boldfy 528720447,
 * Insight Tag 10262873) mapeadas por evento de tracking. Criadas em 29/05/2026.
 *
 * A chave é `form_submit_success:<form_type>` para os forms que passam pelo
 * evento unificado, ou o próprio nome do evento (ex: playbook_quiz_submitted).
 * Quando um evento mapeado dispara, o trackEvent espelha a conversão no
 * LinkedIn via window.lintrk (método "específico ao evento").
 */
const LINKEDIN_CONVERSION_IDS: Record<string, number> = {
  'form_submit_success:demo': 28351801,
  'form_submit_success:proposal': 28351841,
  'form_submit_success:beta': 28351833,
  'form_submit_success:algoritmo-linkedin': 28351817,
  'form_submit_success:case-semrush': 28351825,
  playbook_quiz_submitted: 28351809,
};

type FormType = 'demo' | 'proposal' | 'contact' | 'beta' | 'algoritmo-linkedin' | 'case-semrush' | 'playbook-employee-led-growth' | 'eventosbh';

type CtaType = 'demo' | 'proposal' | 'contact' | 'beta' | 'algoritmo_linkedin_download' | 'case_semrush_download' | 'schedule_meeting';

/** Tipos dos botões do CTA do playbook (Bloco 8). */
type PlaybookCtaType = 'demo' | 'pacote' | 'compartilhar';

/**
 * Razão do gate de não-elegibilidade no quiz do playbook.
 *
 * - `porte_baixo`: P1 < 5 colaboradores (hard block na própria P1).
 * - `compromisso_negado`: P1 entre 5 e 20, mas respondeu "não" na tela
 *   intermediária de compromisso com 5 ativos (jun/2026).
 */
type PlaybookGateReason = 'porte_baixo' | 'compromisso_negado';

/**
 * Uni\u00e3o discriminada dos eventos que tem nome + params bem definidos.
 * Adicionar novos eventos aqui for\u00e7a o TS a garantir params corretos
 * em todos os call sites.
 */
type TrackedEvent =
  | {
      name: 'cta_click';
      params: {
        cta_type: CtaType;
        source: string; // ex: 'header:desktop', 'home:hero', 'precos:saas'
      };
    }
  | {
      name: 'form_open';
      params: {
        form_type: FormType;
        source: string;
      };
    }
  | {
      name: 'form_submit_start';
      params: {
        form_type: FormType;
        source?: string;
      };
    }
  | {
      name: 'form_submit_success';
      params: {
        form_type: FormType;
        source?: string;
        // Campos opcionais que alguns forms expõem
        total_mensal?: number; // proposta
        porte?: string; // contato, demo, beta
      };
    }
  | {
      name: 'form_submit_error';
      params: {
        form_type: FormType;
        error_message: string;
      };
    }
  /* ---------------- Playbook ELG (mai/2026) ---------------- */
  | {
      /** Quando a 1ª pergunta do quiz aparece pra pessoa. */
      name: 'playbook_quiz_started';
      params: { source: string };
    }
  | {
      /** A cada pergunta respondida — `step` = StepKey, `step_number` = índice 1..N. */
      name: 'playbook_quiz_step_completed';
      params: { step: string; step_number: number };
    }
  | {
      /** Gate de não-elegibilidade disparou (porte < 5). */
      name: 'playbook_quiz_gate_triggered';
      params: { reason: PlaybookGateReason; porte?: number };
    }
  | {
      /** Submit final OK — o playbook foi gerado. */
      name: 'playbook_quiz_submitted';
      params: {
        area: string;
        dores_principais: string; // string concatenada com vírgula
        porte_colaboradores: number;
        seniority: string;
        tentativas: string;
        budget_status: string;
      };
    }
  | {
      /** Page view de /playbook/[slug]. */
      name: 'playbook_viewed';
      params: { template_key: string; slug: string };
    }
  | {
      /** Clique em qualquer um dos 3 CTAs do Bloco 8. */
      name: 'playbook_cta_clicked';
      params: { cta_type: PlaybookCtaType; slug: string };
    }
  | {
      /** Accordion "Como a Boldfy resolve" aberto em uma dica (Bloco 4). */
      name: 'playbook_tip_expanded';
      params: { tip_id: string; slug: string };
    }
  | {
      /**
       * Clique no callout destacado embaixo do accordion da dica
       * (ex: U6 → /case-semrush). Só dispara quando o callout tem href.
       */
      name: 'playbook_tip_callout_click';
      params: { tip_id: string; slug: string; href: string };
    }
  | {
      /** Accordion da curva de ativação aberto (Bloco 2). */
      name: 'playbook_curva_expanded';
      params: { slug: string };
    }
  | {
      /** Clique em um dos cards do bloco "Sobre a Boldfy" (Bloco 7.5 — mai/2026). */
      name: 'playbook_sobre_boldfy_clicked';
      params: { modalidade: 'saas' | 'caas'; slug: string };
    }
  /* ---------------- Sinais de interesse genéricos (mai/2026) ---------------- */
  | {
      /**
       * Expansão de item da FAQ (qualquer página). Só dispara no abrir,
       * não no fechar. Sinal forte de interesse — aparece na timeline do
       * lead se ele tiver dado consent.
       */
      name: 'faq_expanded';
      params: {
        question: string; // primeiras palavras pra identificar
        page: string;     // ex: 'home', 'precos', etc
      };
    }
  | {
      /**
       * Download de material/recurso (PDF, ebook, etc) via link direto
       * (não pelo botão dos forms — esses já têm form_submit_*).
       */
      name: 'material_downloaded';
      params: {
        material: string; // slug ou nome do material
        source: string;
      };
    };

/**
 * Dispara um evento no GA4 via gtag. No-op se window.gtag n\u00e3o existir
 * (ex: SSR, consent denied antes de default). Nunca throw.
 */
export function trackEvent<E extends TrackedEvent>(
  name: E['name'],
  params: E['params'],
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', name, params);
  } catch {
    // no-op: tracking nunca deve quebrar o fluxo do usuário
  }

  // Espelha conversões selecionadas no LinkedIn Insight Tag (método
  // "específico ao evento", via window.lintrk). Só dispara se a Insight Tag
  // (injetada pelo GTM) já tiver carregado. Conta Boldfy 528720447.
  try {
    const formType = (params as { form_type?: string }).form_type;
    const conversionKey =
      name === 'form_submit_success' && formType
        ? `form_submit_success:${formType}`
        : name;
    const conversionId = LINKEDIN_CONVERSION_IDS[conversionKey];
    if (conversionId && typeof window.lintrk === 'function') {
      window.lintrk('track', { conversion_id: conversionId });
    }
  } catch {
    // Silencioso — tracking nunca deve quebrar o fluxo do usu\u00e1rio
  }
}
