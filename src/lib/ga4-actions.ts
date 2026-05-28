/**
 * GA4 — agregados de ações no site (cross-pessoa).
 *
 * Diferente de `ga4-person.ts` (que filtra por clientId individual), esse
 * módulo agrega cliques de CTAs, expansões de FAQ, funil do quiz Playbook
 * e funil de forms — pra dashboard "Ações no site".
 *
 * Cada função faz UMA query GA4 e retorna shape pronto pra renderizar em
 * tabela. Todas as queries respeitam EXCLUDE_INTERNAL_DIMENSION_FILTER
 * pra não contar tráfego interno do time.
 *
 * Estrutura: cliques totais (eventCount) + pessoas únicas (totalUsers,
 * proxy de pessoas distintas que dispararam o evento).
 */

import { runReportPublic, EXCLUDE_INTERNAL_DIMENSION_FILTER } from './ga4';

/* -------------------------------------------------------------------------- */
/*  CTAs / botões                                                              */
/* -------------------------------------------------------------------------- */

export type CtaActionRow = {
  ctaType: string;     // 'demo', 'beta', 'proposal', 'case_semrush_download', etc
  source: string;      // ex: 'header:desktop', 'home:hero', 'precos:saas'
  clicks: number;
  uniqueUsers: number;
  submits: number;     // forms desse cta_type que viraram form_submit_success
  submitRate: number;  // submits / clicks (0..1)
};

/**
 * Conta cliques em CTAs (cta_click) e cruza com forms submetidos
 * (form_submit_success) por cta_type pra dar a taxa de conversão.
 *
 * Granularidade: cta_type × source (header:desktop separado de hero, etc).
 * Pra agregar só por cta_type, soma as linhas no client.
 */
export async function getCtaActions(days = 30): Promise<CtaActionRow[]> {
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  // Query 1: cta_click por cta_type + source
  const clicksReport = await runReportPublic({
    dateRanges,
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:cta_type' },
      { name: 'customEvent:source' },
    ],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    limit: '5000',
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT', value: 'cta_click' },
            },
          },
        ],
      },
    },
  });

  // Query 2: form_submit_success por form_type (pra cruzar com cta_type)
  const submitsReport = await runReportPublic({
    dateRanges,
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:form_type' },
    ],
    metrics: [{ name: 'eventCount' }],
    limit: '500',
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT', value: 'form_submit_success' },
            },
          },
        ],
      },
    },
  });

  // form_type → submits map
  const submitsByFormType = new Map<string, number>();
  for (const row of submitsReport?.rows ?? []) {
    const formType = row.dimensionValues[1]?.value ?? '';
    const count = parseInt(row.metricValues[0]?.value ?? '0', 10);
    if (formType) submitsByFormType.set(formType, (submitsByFormType.get(formType) ?? 0) + count);
  }

  // cta_type → form_type: mesma convenção que já uso no track.ts
  // ('demo' → 'demo', 'beta' → 'beta', 'proposal' → 'proposal',
  // 'algoritmo_linkedin_download' → 'algoritmo-linkedin',
  // 'case_semrush_download' → 'case-semrush').
  const ctaToFormType: Record<string, string> = {
    demo: 'demo',
    beta: 'beta',
    proposal: 'proposal',
    contact: 'contact',
    algoritmo_linkedin_download: 'algoritmo-linkedin',
    case_semrush_download: 'case-semrush',
    schedule_meeting: 'demo',
  };

  const rows: CtaActionRow[] = [];
  for (const row of clicksReport?.rows ?? []) {
    const ctaType = row.dimensionValues[1]?.value ?? '';
    const source = row.dimensionValues[2]?.value ?? '(unset)';
    const clicks = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const uniqueUsers = parseInt(row.metricValues[1]?.value ?? '0', 10);
    if (!ctaType || ctaType === '(not set)') continue;

    const linkedFormType = ctaToFormType[ctaType];
    const submits = linkedFormType ? (submitsByFormType.get(linkedFormType) ?? 0) : 0;
    // Submits são por form_type AGREGADO, mas estamos repartindo por source.
    // Atribuição exata exige cruzar source ↔ form, o que GA4 não dá nativo.
    // Aproximação: atribui proporcional ao share de cliques do source dentro
    // daquele cta_type. Pra simplificar: deixamos `submits` no nível do
    // cta_type (não do source) e a row mostra "submits do tipo todo".
    const submitRate = clicks > 0 ? submits / clicks : 0;

    rows.push({ ctaType, source, clicks, uniqueUsers, submits, submitRate });
  }
  rows.sort((a, b) => b.clicks - a.clicks);
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  FAQs                                                                       */
/* -------------------------------------------------------------------------- */

export type FaqActionRow = {
  question: string;       // primeiros 80 chars da pergunta
  page: string;           // de qual página foi expandida
  clicks: number;
  uniqueUsers: number;
  shareOfTotal: number;   // 0..1 — fração dos cliques totais de FAQ
};

/**
 * Agrega expansões de FAQ por pergunta. Útil pra identificar dúvidas mais
 * comuns dos visitantes — alimenta priorização editorial.
 */
export async function getFaqActions(days = 30): Promise<FaqActionRow[]> {
  const report = await runReportPublic({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:question' },
      { name: 'customEvent:page' },
    ],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    limit: '500',
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT', value: 'faq_expanded' },
            },
          },
        ],
      },
    },
  });

  const raw = (report?.rows ?? []).map((row) => ({
    question: row.dimensionValues[1]?.value ?? '',
    page: row.dimensionValues[2]?.value ?? '/',
    clicks: parseInt(row.metricValues[0]?.value ?? '0', 10),
    uniqueUsers: parseInt(row.metricValues[1]?.value ?? '0', 10),
  })).filter((r) => r.question && r.question !== '(not set)');

  const totalClicks = raw.reduce((a, r) => a + r.clicks, 0);
  return raw
    .map((r) => ({ ...r, shareOfTotal: totalClicks > 0 ? r.clicks / totalClicks : 0 }))
    .sort((a, b) => b.clicks - a.clicks);
}

/* -------------------------------------------------------------------------- */
/*  Funil do Playbook (quiz steps)                                             */
/* -------------------------------------------------------------------------- */

export type PlaybookFunnelStep = {
  step: string;          // step key (ex: 'porte', 'cargo', 'dores')
  stepNumber: number;
  startedAt: number;     // pessoas únicas que chegaram nesse step
  dropoff: number;       // 0..1 — perda relativa ao step anterior
};

/**
 * Reconstrói o funil do quiz Playbook a partir dos eventos
 * playbook_quiz_step_completed (1 evento por step terminado). Identifica
 * onde o usuário abandona.
 *
 * Considera "step iniciado" = step completed, então o último step pode
 * superestimar (algumas pessoas começam mas não terminam — esse contador
 * fica fora). Pra esse refinamento, precisaríamos de step_started também
 * (não temos hoje).
 */
export async function getPlaybookFunnel(days = 90): Promise<PlaybookFunnelStep[]> {
  const report = await runReportPublic({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:step' },
      { name: 'customEvent:step_number' },
    ],
    metrics: [{ name: 'totalUsers' }],
    limit: '500',
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT', value: 'playbook_quiz_step_completed' },
            },
          },
        ],
      },
    },
  });

  const raw = (report?.rows ?? []).map((row) => ({
    step: row.dimensionValues[1]?.value ?? '',
    stepNumber: parseInt(row.dimensionValues[2]?.value ?? '0', 10),
    users: parseInt(row.metricValues[0]?.value ?? '0', 10),
  })).filter((r) => r.step && r.step !== '(not set)');

  raw.sort((a, b) => a.stepNumber - b.stepNumber);

  const steps: PlaybookFunnelStep[] = [];
  for (let i = 0; i < raw.length; i++) {
    const prev = i === 0 ? raw[0].users : raw[i - 1].users;
    const dropoff = prev > 0 ? 1 - raw[i].users / prev : 0;
    steps.push({
      step: raw[i].step,
      stepNumber: raw[i].stepNumber,
      startedAt: raw[i].users,
      dropoff: Math.max(0, dropoff),
    });
  }
  return steps;
}

/* -------------------------------------------------------------------------- */
/*  Form funnel (open → start → success por form_type)                         */
/* -------------------------------------------------------------------------- */

export type FormFunnelRow = {
  formType: string;
  opens: number;
  starts: number;
  successes: number;
  openToStart: number;    // 0..1
  startToSuccess: number; // 0..1
};

export async function getFormFunnel(days = 30): Promise<FormFunnelRow[]> {
  const report = await runReportPublic({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:form_type' },
    ],
    metrics: [{ name: 'eventCount' }],
    limit: '500',
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['form_open', 'form_submit_start', 'form_submit_success'],
                caseSensitive: false,
              },
            },
          },
        ],
      },
    },
  });

  const byForm = new Map<string, { opens: number; starts: number; successes: number }>();
  for (const row of report?.rows ?? []) {
    const eventName = row.dimensionValues[0]?.value ?? '';
    const formType = row.dimensionValues[1]?.value ?? '';
    const count = parseInt(row.metricValues[0]?.value ?? '0', 10);
    if (!formType || formType === '(not set)') continue;

    const existing = byForm.get(formType) ?? { opens: 0, starts: 0, successes: 0 };
    if (eventName === 'form_open') existing.opens += count;
    else if (eventName === 'form_submit_start') existing.starts += count;
    else if (eventName === 'form_submit_success') existing.successes += count;
    byForm.set(formType, existing);
  }

  const rows: FormFunnelRow[] = [];
  for (const [formType, v] of byForm) {
    rows.push({
      formType,
      opens: v.opens,
      starts: v.starts,
      successes: v.successes,
      // Alguns forms não disparam form_open (LPs onde o form já fica na
      // página) — pra esses, opens=0 e openToStart fica como N/A no UI.
      openToStart: v.opens > 0 ? v.starts / v.opens : 0,
      startToSuccess: v.starts > 0 ? v.successes / v.starts : 0,
    });
  }
  rows.sort((a, b) => b.successes - a.successes);
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Top páginas com engajamento (eventos não-pageview)                         */
/* -------------------------------------------------------------------------- */

export type EngagedPageRow = {
  page: string;
  eventCount: number;
  uniqueUsers: number;
};

/**
 * Lista páginas onde os usuários mais executam ações (cliques, expansões,
 * forms abertos). Diferente de top pageviews, mede engajamento real.
 */
export async function getEngagedPages(days = 30, limit = 15): Promise<EngagedPageRow[]> {
  const report = await runReportPublic({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: String(limit * 4), // pega mais e filtra
    dimensionFilter: {
      andGroup: {
        expressions: [
          EXCLUDE_INTERNAL_DIMENSION_FILTER,
          {
            notExpression: {
              filter: {
                fieldName: 'eventName',
                inListFilter: {
                  values: [
                    'page_view', 'session_start', 'first_visit',
                    'user_engagement', 'scroll',
                  ],
                  caseSensitive: false,
                },
              },
            },
          },
        ],
      },
    },
  });

  return (report?.rows ?? [])
    .map((row) => ({
      page: row.dimensionValues[0]?.value ?? '/',
      eventCount: parseInt(row.metricValues[0]?.value ?? '0', 10),
      uniqueUsers: parseInt(row.metricValues[1]?.value ?? '0', 10),
    }))
    .slice(0, limit);
}
