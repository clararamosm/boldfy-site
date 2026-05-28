/**
 * GA4 — engajamento por pessoa (via client_id).
 *
 * Usa a Analytics Data API filtrando pela dimensão `clientId` pra puxar
 * tudo que o GA4 sabe daquela pessoa específica (cruzando com o
 * `ga4_client_id` que salvamos no submit do form).
 *
 * Resultado alimenta:
 *   - Aba "Engajamento" do perfil do lead (sessões totais, primeira/última
 *     visita, top páginas)
 *   - Sessões inline na timeline da pessoa (uma entrada por dia visitado)
 *
 * Limites:
 *   - Só funciona pra pessoas que deram consent (granted) — sem cookie
 *     `_ga`, não temos client_id pra cruzar
 *   - Client_id é per-browser: mesma pessoa no celular + desktop = 2 IDs
 *     diferentes (sem cross-device matching nativo)
 *   - GA4 retém raw events só por 14 meses no plano free (data retention
 *     setting). Janelas mais longas viram dado agregado sem clientId.
 */

import { runReportPublic, EXCLUDE_INTERNAL_DIMENSION_FILTER } from './ga4';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { Activity } from '@/db';

export type Ga4PersonDailyVisit = {
  date: string;         // YYYY-MM-DD
  sessions: number;
  pageViews: number;
  pages: string[];      // páginas distintas vistas nesse dia
};

export type Ga4PersonTopPage = {
  page: string;
  pageViews: number;
};

export type Ga4PersonEngagement = {
  totalSessions: number;
  totalPageViews: number;
  firstSeen: string | null;  // YYYY-MM-DD
  lastSeen: string | null;
  topPages: Ga4PersonTopPage[];
  dailyVisits: Ga4PersonDailyVisit[];
};

/**
 * Puxa engajamento de uma pessoa específica via GA4 client_id.
 *
 * Janela default: últimos 90 dias (suficiente pro perfil do lead sem
 * estourar quota). Pra pessoas com longa relação, dá pra estender pra
 * 365d, mas raw events GA4 só vão até 14 meses.
 *
 * Retorna null se GA4 não tá configurado, client_id ausente, ou sem
 * dado no período (não confunde com erro — chamador trata os 3 casos
 * como "sem engajamento mensurado pelo GA4").
 *
 * @param clientId   — formato `<random>.<firstSeenTs>` (já sem prefixo GA1)
 * @param days       — janela em dias (default 90)
 */
export async function getEngagementByClientId(
  clientId: string,
  days = 90,
): Promise<Ga4PersonEngagement | null> {
  if (!clientId) return null;

  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
  const clientIdFilter = {
    andGroup: {
      expressions: [
        EXCLUDE_INTERNAL_DIMENSION_FILTER,
        {
          filter: {
            fieldName: 'clientId',
            stringFilter: { matchType: 'EXACT', value: clientId, caseSensitive: false },
          },
        },
      ],
    },
  };

  // Query 1: agregados + top pages
  const summary = await runReportPublic({
    dateRanges,
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: '100',
    dimensionFilter: clientIdFilter,
  });

  if (!summary?.rows || summary.rows.length === 0) return null;

  let totalSessions = 0;
  let totalPageViews = 0;
  const topPages: Ga4PersonTopPage[] = [];
  for (const row of summary.rows) {
    const page = row.dimensionValues[0]?.value ?? '/';
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const pv = parseInt(row.metricValues[1]?.value ?? '0', 10);
    totalSessions += sessions;
    totalPageViews += pv;
    topPages.push({ page, pageViews: pv });
  }
  // GA4 conta a mesma sessão em N linhas (uma por página visitada nessa
  // sessão), então `totalSessions` aqui infla. Pegamos sessions ÚNICAS
  // via query separada sem dimensão pagePath logo abaixo.
  const sessionTotal = await runReportPublic({
    dateRanges,
    metrics: [{ name: 'sessions' }],
    dimensionFilter: clientIdFilter,
  });
  const realSessions = sessionTotal?.rows?.[0]?.metricValues?.[0]?.value
    ?? sessionTotal?.totals?.[0]?.metricValues?.[0]?.value
    ?? '0';
  totalSessions = parseInt(realSessions, 10);

  // Query 2: série diária
  const daily = await runReportPublic({
    dateRanges,
    dimensions: [{ name: 'date' }, { name: 'pagePath' }],
    metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '5000',
    dimensionFilter: clientIdFilter,
  });

  const dailyMap = new Map<string, { sessions: number; pageViews: number; pages: Set<string> }>();
  for (const row of daily?.rows ?? []) {
    const dateRaw = row.dimensionValues[0]?.value ?? '';
    const date = dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : dateRaw;
    const page = row.dimensionValues[1]?.value ?? '/';
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10);
    const pv = parseInt(row.metricValues[1]?.value ?? '0', 10);

    const existing = dailyMap.get(date);
    if (existing) {
      existing.pageViews += pv;
      existing.pages.add(page);
      // sessions: o GA4 conta a mesma sessão em cada linha de pagePath,
      // então pra evitar duplicação por dia usamos `max` em vez de sum.
      // (aproximação razoável — uma pessoa raramente tem 2+ sessões no
      // mesmo dia visitando páginas DIFERENTES sem overlap.)
      existing.sessions = Math.max(existing.sessions, sessions);
    } else {
      dailyMap.set(date, { sessions, pageViews: pv, pages: new Set([page]) });
    }
  }

  const dailyVisits: Ga4PersonDailyVisit[] = Array.from(dailyMap.entries())
    .map(([date, v]) => ({
      date,
      sessions: v.sessions,
      pageViews: v.pageViews,
      pages: Array.from(v.pages),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const firstSeen = dailyVisits[0]?.date ?? null;
  const lastSeen = dailyVisits[dailyVisits.length - 1]?.date ?? null;

  return {
    totalSessions,
    totalPageViews,
    firstSeen,
    lastSeen,
    topPages: topPages.slice(0, 10),
    dailyVisits,
  };
}

/* -------------------------------------------------------------------------- */
/*  Eventos GA4 da pessoa (cliques, modais, CTAs etc.)                        */
/* -------------------------------------------------------------------------- */

export type Ga4PersonEvent = {
  date: string;       // YYYY-MM-DD
  eventName: string;  // ex: 'cta_demo_clicked', 'modal_opened'
  page: string;       // pagePath onde o evento ocorreu
  count: number;      // quantas vezes esse evento disparou no dia
};

/**
 * Lista eventos GA4 customizados de uma pessoa específica (filtra por
 * clientId). Exclui eventos automáticos do GA4 — `page_view`, `session_start`,
 * `first_visit`, `user_engagement` — pra timeline mostrar só ações
 * deliberadas (cliques, abertura de modal, scroll milestones).
 *
 * Como cada `trackEvent()` que disparamos no site (form_submit_start,
 * cta_*, modal_*) chega aqui como uma row, isso vira a fonte de
 * "ações do usuário" pra timeline do CRM.
 *
 * Retorna `[]` se sem dado ou GA4 indisponível — chamador trata como
 * "nenhum evento conhecido", sem erro.
 *
 * @param clientId — `<random>.<firstSeenTs>` (sem prefixo GA1)
 * @param days     — janela em dias (default 90)
 */
export async function getEventsByClientId(
  clientId: string,
  days = 90,
): Promise<Ga4PersonEvent[]> {
  if (!clientId) return [];

  // Filtra: clientId match AND eventName NOT IN (auto events do GA4)
  const filter = {
    andGroup: {
      expressions: [
        EXCLUDE_INTERNAL_DIMENSION_FILTER,
        {
          filter: {
            fieldName: 'clientId',
            stringFilter: { matchType: 'EXACT', value: clientId, caseSensitive: false },
          },
        },
        {
          notExpression: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: [
                  'page_view',
                  'session_start',
                  'first_visit',
                  'user_engagement',
                  'scroll',
                ],
                caseSensitive: false,
              },
            },
          },
        },
      ],
    },
  };

  const report = await runReportPublic({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [
      { name: 'date' },
      { name: 'eventName' },
      { name: 'pagePath' },
    ],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '5000',
    dimensionFilter: filter,
  });

  if (!report?.rows) return [];

  const events: Ga4PersonEvent[] = [];
  for (const row of report.rows) {
    const dateRaw = row.dimensionValues[0]?.value ?? '';
    const date = dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : dateRaw;
    const eventName = row.dimensionValues[1]?.value ?? '';
    const page = row.dimensionValues[2]?.value ?? '/';
    const count = parseInt(row.metricValues[0]?.value ?? '0', 10);
    if (eventName) {
      events.push({ date, eventName, page, count });
    }
  }
  return events;
}

/* -------------------------------------------------------------------------- */
/*  Activities virtuais (timeline merge)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Lê o último ga4_client_id salvo nas activities da pessoa. Compartilha
 * a mesma lógica do <EngagementSection /> — duplicada aqui pra esse módulo
 * ficar self-contained (chamável de qualquer page sem prop drilling).
 */
async function getLatestGa4ClientId(personId: string): Promise<string | null> {
  try {
    const rows = await db.execute<{ ga4_client_id: string | null }>(sql`
      SELECT data->'engagement'->>'ga4_client_id' AS ga4_client_id
      FROM activities
      WHERE person_id = ${personId}
        AND data->'engagement'->>'ga4_client_id' IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return rows.rows[0]?.ga4_client_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Gera "activities virtuais" da pessoa pro timeline merge.
 *
 * Não cria nada no DB — só shapes compatíveis com Activity pra a timeline
 * existente consumir sem modificação. Cada dia de browsing vira UMA entry
 * `ga4_session` (com `data.pages` agregando todas as páginas vistas), e
 * cada evento GA4 customizado vira UMA entry `ga4_event` (cliques de CTA,
 * FAQs abertos, modais).
 *
 * Timestamp: usamos meio-dia local (UTC-3 SP) do dia visitado pra ordenar
 * cronologicamente sem precisar do timestamp exato (que o GA4 não expõe
 * via Data API sem custo alto).
 *
 * Retorna array vazio se: pessoa sem consent, GA4 sem dado, ou erro.
 * Chamador trata como "timeline GA4 não disponível" — não bloqueia.
 */
export async function getGa4TimelineEntriesForPerson(
  personId: string,
  days = 90,
): Promise<Activity[]> {
  const clientId = await getLatestGa4ClientId(personId);
  if (!clientId) return [];

  const [engagement, events] = await Promise.all([
    getEngagementByClientId(clientId, days).catch(() => null),
    getEventsByClientId(clientId, days).catch(() => []),
  ]);

  const entries: Activity[] = [];

  // Sessões por dia → uma virtual activity por dia
  if (engagement?.dailyVisits) {
    for (const v of engagement.dailyVisits) {
      entries.push({
        id: `ga4-session-${v.date}`,
        personId,
        companyId: null,
        type: 'ga4_session',
        weight: 0,
        source: 'ga4',
        data: {
          sessions: v.sessions,
          pageViews: v.pageViews,
          pages: v.pages,
        },
        createdAt: new Date(`${v.date}T12:00:00-03:00`),
      });
    }
  }

  // Eventos GA4 customizados
  for (const e of events) {
    entries.push({
      id: `ga4-event-${e.date}-${e.eventName}-${e.page}`,
      personId,
      companyId: null,
      type: 'ga4_event',
      weight: 0,
      source: 'ga4',
      data: {
        eventName: e.eventName,
        page: e.page,
        count: e.count,
      },
      // Eventos meia-hora depois das sessões pra ordenar logicamente
      createdAt: new Date(`${e.date}T12:30:00-03:00`),
    });
  }

  return entries;
}
