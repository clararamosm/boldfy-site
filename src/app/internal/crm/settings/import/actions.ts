/**
 * Import enriquecido do ActiveCampaign pro nosso CRM.
 *
 * GATE: SÓ traz contatos com tag "Segmento: Líderes B2B".
 *
 * Pra cada lead importado:
 *  1. Cria/atualiza Person + Company
 *  2. Puxa custom field values (cargo, empresa, porte, objetivo, etc) → metadata.ac_custom_fields
 *  3. Puxa tags do AC → ac_tags array
 *  4. Puxa email events (opens/clicks) → cria activities datadas com peso
 *  5. Puxa page views via VGO → cria activities datadas com peso
 *  6. Cria activity sintética imported_from_ac
 *  7. Score é recalculado naturalmente porque cada activity tem peso
 *
 * Idempotent: roda quantas vezes precisar — email match. Substitui dados.
 *
 * Demora: ~5-10s por lead (5+ API calls). 500 leads = ~1h.
 */

'use server';

import {
  listAllContacts,
  getContactFieldValues,
  getContactTags,
  getContactEmailEvents,
  getContactPageViews,
  getContactNotes,
  getContactListIds,
  getAllListsById,
  getContactGeo,
  parseFormNote,
} from '@/lib/activecampaign';
import { upsertPerson, upsertCompany, logActivity, weightForActivity, classifyPersonBySourceMethod } from '@/lib/crm';
import { db, people } from '@/db';
import { eq } from 'drizzle-orm';

type Result =
  | {
      ok: true;
      imported: number;
      updated: number;
      errors: number;
      activitiesCreated: number;
      /**
       * Mai/2026 ciclo 3 — agora importa TODOS os contatos (gate B2B removido).
       * Pra debug, conta por segmento principal detectado nas tags.
       */
      bySegment: {
        liderB2B: number;
        parceiro: number;
        profissionalIndividual: number;
        newsletterOnly: number;
        semSegmento: number;
      };
    }
  | { ok: false; error: string };

const SLEEP_MS = 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mapeia URL de page view → tipo de activity com peso adequado.
 */
function pageViewActivityType(url: string): { type: string; weight: number } {
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  if (path.includes('/precos')) return { type: 'page_view_precos', weight: 5 };
  if (path.includes('/solucoes')) return { type: 'page_view_solucoes', weight: 3 };
  if (path.includes('/agendar-demo')) return { type: 'page_view_agendar_demo', weight: 5 };
  if (path.includes('/blog/')) return { type: 'blog_read', weight: 2 };
  return { type: 'page_view', weight: 1 };
}

/**
 * Determina source method a partir das tags AC. Lead pode ter MÚLTIPLOS forms;
 * sourceMethod é único então pega o mais "avançado" no funil
 * (proposta > demo > beta > report). Activities individuais são criadas pra
 * cada form preenchido — ver activityTypesForFormTags.
 */
function inferSourceMethod(tags: string[]): 'form_demo' | 'form_beta' | 'form_report' | 'form_proposta' | 'manual' {
  if (tags.some((t) => t.includes('Form: Simulador') || t.includes('Form: Proposta'))) return 'form_proposta';
  if (tags.some((t) => t.includes('Form: Demo'))) return 'form_demo';
  if (tags.some((t) => t.includes('Form: Beta'))) return 'form_beta';
  if (tags.some((t) => t.includes('Algoritmo') || t.includes('Form: Report'))) return 'form_report';
  return 'manual';
}

/**
 * TODOS os forms preenchidos pelo lead, derivados das tags AC. Cria
 * activities sintéticas — uma por form — pra timeline mostrar histórico
 * completo de cada form que tocou aquele lead.
 *
 * Sem duplicar: se o AC tem tag "Form: Demo", cria 1 activity form_submit_demo
 * (não 1 por menção). Pesos seguem ACTIVITY_WEIGHTS em lib/crm.ts.
 */
function activityTypesForFormTags(tags: string[]): Array<{ type: string; weight: number }> {
  const acts: Array<{ type: string; weight: number }> = [];
  if (tags.some((t) => t.includes('Form: Demo'))) acts.push({ type: 'form_submit_demo', weight: 50 });
  if (tags.some((t) => t.includes('Form: Beta'))) acts.push({ type: 'form_submit_beta', weight: 25 });
  if (tags.some((t) => t.includes('Algoritmo') || t.includes('Form: Report'))) acts.push({ type: 'form_submit_report', weight: 10 });
  if (tags.some((t) => t.includes('Simulador') || t.includes('Proposta'))) acts.push({ type: 'form_submit_proposta', weight: 50 });
  return acts;
}

/**
 * Detecta segmento principal pra contador de debug. Hierarquia:
 * Líder B2B > Parceiro > Profissional Individual > Newsletter only > Nenhum.
 */
function detectSegment(tags: string[]): 'liderB2B' | 'parceiro' | 'profissionalIndividual' | 'newsletterOnly' | 'semSegmento' {
  if (tags.includes('Segmento: Líderes B2B')) return 'liderB2B';
  if (tags.includes('Segmento: Parceiros estratégicos')) return 'parceiro';
  if (tags.includes('Segmento: Profissionais Individuais')) return 'profissionalIndividual';
  if (tags.includes('Segmento: Newsletter Boldfy')) return 'newsletterOnly';
  return 'semSegmento';
}

export async function importFromAC(): Promise<Result> {
  if (!process.env.ACTIVECAMPAIGN_API_URL || !process.env.ACTIVECAMPAIGN_API_KEY) {
    return { ok: false, error: 'AC não configurado (env vars ausentes)' };
  }

  let imported = 0;
  let updated = 0;
  let errors = 0;
  let activitiesCreated = 0;
  const bySegment = {
    liderB2B: 0,
    parceiro: 0,
    profissionalIndividual: 0,
    newsletterOnly: 0,
    semSegmento: 0,
  };

  try {
    for await (const batch of listAllContacts()) {
      for (const c of batch) {
        try {
          // Gate B2B removido em mai/2026 ciclo 3 — todos os 160 leads entram
          // no CRM. Kanban filtra visualmente por acTags em getPeopleByStatus.
          // Aba Forms mostra todos.
          const tags = await getContactTags(c.id);
          bySegment[detectSegment(tags)]++;

          // Puxa custom fields, events, page views, notas, listas e geo EM
          // PARALELO. +2 calls vs antes (listas + geo). Geo é best-effort
          // silencioso (vem null se conta AC não tem geo tracking).
          const [fields, emailEvents, pageViews, notes, listIds, geo] = await Promise.all([
            getContactFieldValues(c.id),
            getContactEmailEvents(c.id),
            getContactPageViews(c.id),
            getContactNotes(c.id),
            getContactListIds(c.id),
            getContactGeo(c.id),
          ]);

          // Parse das notas — extrai Intenção, Empresa, Opt-in newsletter, Origem
          // dos textos gerados pelos forms. Merge em ordem: nota mais antiga primeiro
          // (a mais recente sobrescreve campos repetidos).
          const formDataFromNotes: Record<string, string> = {};
          const sortedNotes = [...notes].sort((a, b) => a.cdate.localeCompare(b.cdate));
          for (const n of sortedNotes) {
            Object.assign(formDataFromNotes, parseFormNote(n.note));
          }

          // Resolve company se tiver no AC custom fields
          let companyId: string | undefined;
          const empresaName = fields['empresa'] || fields['company'];
          if (empresaName && typeof empresaName === 'string' && empresaName.trim().length > 0) {
            const cc = await upsertCompany({
              name: empresaName.trim(),
              industry: fields['setor'] || fields['industry'],
              size: fields['porte'] || fields['colaboradores'] || fields['funcionarios'],
            });
            if (cc.ok) {
              companyId = cc.data.id;
              // Atualiza metadata da company com custom fields
              await db
                .update((await import('@/db')).companies)
                .set({
                  metadata: {
                    ac_custom_fields: fields,
                    ac_contact_count: tags.length,
                  } as Record<string, unknown>,
                  updatedAt: new Date(),
                })
                .where(eq((await import('@/db')).companies.id, cc.data.id));
            }
          }

          const sourceMethod = inferSourceMethod(tags);
          const sourceChannel = (fields['utm_source_first'] as
            'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown' | undefined
          ) ?? 'unknown';

          // Verifica se já existia (pra contar imported vs updated)
          const existing = await db
            .select({ id: people.id })
            .from(people)
            .where(eq(people.email, c.email.toLowerCase()))
            .limit(1);
          const wasExisting = !!existing[0];

          // cdate do AC = quando o contato foi criado lá originalmente.
          // Pra leads importados, isso é o firstTouchAt real — quando a
          // pessoa baixou o primeiro material, abriu o primeiro email, etc.
          // Sem isso, todo lead importado fica com firstTouchAt = data do
          // re-import, o que distorce análises temporais.
          const cdateParsed = c.cdate ? new Date(c.cdate) : undefined;
          const firstTouchAt = cdateParsed && !Number.isNaN(cdateParsed.getTime())
            ? cdateParsed
            : undefined;

          const p = await upsertPerson({
            name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
            email: c.email,
            phone: c.phone || undefined,
            jobTitle: fields['cargo'] || fields['job_title'],
            acContactId: c.id,
            sourceChannel,
            sourceMethod,
            firstTouchCampaign: fields['utm_campaign_first'],
            firstTouchSource: fields['utm_source_first'],
            firstTouchAt,
          }, companyId);

          if (!p.ok) {
            errors++;
            continue;
          }

          // Merge form data: custom fields primeiro, notas por cima (notas têm tudo
          // que o form pediu — Intenção, Newsletter opt-in, Origem). Notas vencem
          // porque o form antigo não populava custom fields.
          const mergedFormData = {
            objetivo_principal: fields['objetivo_principal'] ?? formDataFromNotes['objetivo_principal'] ?? null,
            como_conheceu: fields['como_conheceu'] ?? formDataFromNotes['como_conheceu'] ?? null,
            intencao_uso: fields['intencao_uso'] ?? formDataFromNotes['intencao'] ?? formDataFromNotes['intencao_uso'] ?? null,
            tipo_de_lead: fields['tipo_de_lead'] ?? formDataFromNotes['tipo_de_lead'] ?? null,
            newsletter_opt_in: fields['newsletter_opt_in'] ?? formDataFromNotes['opt_in_newsletter'] ?? formDataFromNotes['newsletter_opt_in'] ?? null,
            observacoes: fields['observacoes'] ?? formDataFromNotes['observacoes'] ?? null,
            origem_lp: formDataFromNotes['origem'] ?? null,
          };

          // Resolve listIds → list names (mapa cacheado globalmente, 1 call/import)
          const listsById = await getAllListsById();
          const listNames = listIds.map((id) => listsById.get(id) ?? id).filter(Boolean);

          // Last engagement: deriva dos email events que já buscamos (max tstamp
          // de open/click). Não precisa call extra.
          const lastEngagementTs = emailEvents.length > 0
            ? emailEvents.reduce((max, e) => (e.tstamp > max ? e.tstamp : max), emailEvents[0].tstamp)
            : null;

          // location: city/state pra mostrar no card Contato; country pra
          // segmentação regional. Vem null se conta AC não tem geo tracking.
          const locationStr = geo && (geo.city || geo.state)
            ? [geo.city, geo.state].filter(Boolean).join(', ')
            : null;

          // Resetar score pra recalcular do zero (substituir = true)
          await db
            .update(people)
            .set({
              acTags: tags,
              ...(locationStr ? { location: locationStr } : {}),
              metadata: {
                ac_custom_fields: fields,
                form_data: mergedFormData,
                form_notes_raw: sortedNotes.map((n) => ({ id: n.id, cdate: n.cdate, note: n.note })),
                imported_from: {
                  ac_contact_id: c.id,
                  ac_imported_at: new Date().toISOString(),
                  notes_count: sortedNotes.length,
                },
                // Mai/2026 ciclo 3.1 — dados extras do AC pra debug e display
                ac_extra: {
                  udate: c.udate,
                  bounced_hard: c.bounced_hard === '1',
                  bounced_soft: c.bounced_soft === '1',
                  bounced_date: c.bounced_date,
                  last_engagement_at: lastEngagementTs,
                  ac_lists: listNames,
                  geo: geo,
                },
              } as Record<string, unknown>,
              leadScore: 0, // reset pra recalcular via activities
              updatedAt: new Date(),
            })
            .where(eq(people.id, p.data.id));

          // 1) Activities sintéticas — UMA por form preenchido (lead pode ter
          // preenchido Report + Beta + Demo, todos vão pra timeline).
          // Antes de mai/2026 ciclo 3 criava só 1 — bug que escondia múltiplas
          // submissões do mesmo lead na aba Formulários.
          const formActivities = activityTypesForFormTags(tags);
          for (const formActivity of formActivities) {
            await logActivity({
              personId: p.data.id,
              companyId,
              type: formActivity.type,
              weight: formActivity.weight,
              source: 'system',
              data: { reconstructed: true, from: 'ac_import_inferred_from_tag' },
            });
            activitiesCreated++;
          }

          // 2) Email events (opens/clicks)
          for (const ev of emailEvents) {
            const type = ev.type === 'open' ? 'email_open' : 'email_click';
            const weight = weightForActivity(type);
            await logActivity({
              personId: p.data.id,
              type,
              weight,
              source: 'email',
              data: {
                subject: ev.campaignName ?? undefined,
                url: ev.url,
                imported: true,
                original_tstamp: ev.tstamp,
              },
            });
            activitiesCreated++;
          }

          // 3) Page views (limitado a 50 mais recentes pra não estourar)
          const recentPageViews = pageViews.slice(0, 50);
          for (const pv of recentPageViews) {
            const { type, weight } = pageViewActivityType(pv.url);
            await logActivity({
              personId: p.data.id,
              type,
              weight,
              source: 'web',
              data: {
                page: pv.url,
                imported: true,
                original_tstamp: pv.tstamp,
              },
            });
            activitiesCreated++;
          }

          // 4) Activity de marcação do import (peso 0)
          await logActivity({
            personId: p.data.id,
            type: 'imported_from_ac',
            weight: 0,
            source: 'system',
            data: {
              ac_contact_id: c.id,
              tags_count: tags.length,
              email_events_count: emailEvents.length,
              page_views_count: pageViews.length,
              page_views_imported: recentPageViews.length,
            },
          });

          // 5) Classifica por sourceMethod (regra mai/2026):
          // forms beta/demo/proposta vão direto pra Quente mesmo sem o score
          // ter atingido o threshold; report fica em Ativo (acumula score).
          // Não-regressão respeitada — não baixa se já está em status mais avançado.
          await classifyPersonBySourceMethod(p.data.id, sourceMethod);
          activitiesCreated++;

          if (wasExisting) updated++;
          else imported++;
        } catch (err) {
          console.error('[import-ac] contact error:', c.email, err);
          errors++;
        }
      }
      // Rate-limit friendly: pausa entre lotes
      await sleep(SLEEP_MS);
    }

    return { ok: true, imported, updated, errors, activitiesCreated, bySegment };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
