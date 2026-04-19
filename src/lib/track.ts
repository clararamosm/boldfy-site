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

type FormType = 'demo' | 'proposal' | 'contact' | 'beta';

type CtaType = 'demo' | 'proposal' | 'contact' | 'beta';

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
    // Silencioso — tracking nunca deve quebrar o fluxo do usu\u00e1rio
  }
}
