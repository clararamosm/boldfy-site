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
  | 'form_submit_report'
  | 'form_submit_proposta';

export const FORM_LABELS: Record<FormType, string> = {
  form_submit_demo: 'Demo',
  form_submit_beta: 'Beta',
  form_submit_report: 'Report',
  form_submit_proposta: 'Proposta',
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
    email: string;
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
