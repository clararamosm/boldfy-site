/**
 * Tipos e constantes compartilhados da aba Forms.
 *
 * Vive em arquivo separado (não-server, não-client) porque Client Components
 * (forms-list.tsx, forms-filters.tsx) precisam importar daqui. Importar de
 * page.tsx (que exporta `metadata`) quebra build: "you are attempting to
 * export metadata from a component marked with use client".
 */

export type FormType =
  | 'form_submit_demo'
  | 'form_submit_beta'
  | 'form_submit_algoritmo_linkedin'
  | 'form_submit_case_semrush'
  | 'form_submit_proposta'
  | 'form_submit_playbook_employee_led_growth';

export const FORM_LABELS: Record<FormType, string> = {
  form_submit_demo: 'Demo',
  form_submit_beta: 'Beta',
  form_submit_algoritmo_linkedin: 'Algoritmo LinkedIn',
  form_submit_case_semrush: 'Case Semrush',
  form_submit_proposta: 'Proposta',
  form_submit_playbook_employee_led_growth: 'Playbook',
};

/**
 * 1 row por pessoa. forms = lista de-dup dos forms preenchidos.
 * lastFormAt/firstFormAt usados pra sort.
 *
 * Task 1 (mai/2026): segment, newsletterOptIn, unsubscribed lidos direto
 * das colunas dedicadas em people (não mais derivados de acTags).
 */
export type PersonRow = {
  person: {
    id: string;
    name: string;
    /**
     * Pode ser null pra LinkedIn Leads capturados pela extensão Chrome
     * (mai/2026). Forms do site continuam exigindo email via Zod, então
     * pessoas com `forms` não-vazios podem assumir não-null na prática.
     */
    email: string | null;
    phone: string | null;
    sourceChannel: string | null;
    sourcePage: string | null;
    acTags: string[] | null;
    statusLabel: string | null;
    statusColor: string | null;
    jobTitle: string | null;
    metadata: Record<string, unknown> | null;
    segment: string | null;
    newsletterOptIn: boolean;
    unsubscribed: boolean;
    unsubscribedAt: Date | null;
    formsSubmitted: string[];
  };
  company: { id: string; name: string } | null;
  forms: FormType[];
  lastFormAt: Date;
  firstFormAt: Date;
};
