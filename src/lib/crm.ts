/**
 * Lib core do CRM Boldfy — upserts de Person/Company + log de activities.
 *
 * Sprint 3a: Status virou tabela editável (`statuses`). Promoção automática
 * lê thresholds dinamicamente via lib/statuses.ts.
 *
 * Task 1 (mai/2026, spec crm-source-of-truth): CRM é source-of-truth.
 *  - upsertPerson aceita segment, newsletterOptIn, unsubscribed*, formsSubmitted,
 *    acTagsSet, metadataPatch — retorna {person, isNew, fieldChanges}.
 *  - recordLeadFromForm aceita ClassifiedLead direto (vem de form-adapters).
 *  - Ordem invertida: CRM grava SEMPRE; AC sync tenta depois e nunca bloqueia.
 *  - classifyPersonBySourceMethod skipa activity 'no_regression' pra pessoa
 *    recém-criada (suprime ruído na timeline).
 *
 * Falhas: NUNCA throw — sempre retorna { ok, ... } pra caller decidir.
 */

import { db, people, companies, activities } from '@/db';
import type { Person, Company, NewActivity } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { getDefaultStatus, statusForScore, shouldAutoPromote, classifyByMethod, getStatuses, hasClassificationLadder } from './statuses';
import { syncCompanyFromPeople } from './crm-sync';
import { syncContact } from './activecampaign';
import type { ClassifiedLead } from './form-adapters/types';
import { formSlugToActivityType, FORM_DEFS_SEED, type FormSlug } from './form-definitions';

/* -------------------------------------------------------------------------- */
/*  Pesos pré-definidos por tipo de activity                                  */
/* -------------------------------------------------------------------------- */

const ACTIVITY_WEIGHTS: Record<string, number> = {
  page_view: 1,
  page_view_precos: 5,
  page_view_solucoes: 3,
  page_view_agendar_demo: 5,
  blog_read: 2,
  form_submit_algoritmo_linkedin: 10,
  form_submit_case_semrush: 15,  // Case é meio-funil — mais qualificado que algoritmo-linkedin, menos que beta
  form_submit_playbook_employee_led_growth: 25,  // Quem termina quiz de 11 perguntas é lead bem qualificado — peso igual ao beta
  form_submit_beta: 25,
  form_submit_demo: 50,
  form_submit_proposta: 50,
  material_download: 5,
  email_sent: 0,           // Email disparado pela cadência — só tracking (AC não dispara webhook individual por contato)
  email_open: 1,
  email_click: 3,
  email_forwarded: 8,      // Forward = advocacy, alguém compartilhou com terceiros
  email_reply: 15,         // Resposta direta = engajamento máximo, prioridade pra follow-up
  email_bounce: 0,         // Pessoa pode ter bounce sem culpa — não desconta
  email_unsubscribed: 0,   // Descadastrou — só flagra na timeline
  cal_scheduled: 30,
  cal_attended: 30,
  cal_noshow: -10,
  cal_cancelled: 0,
  extension_save: 0,
  linkedin_engagement: 5,
  status_change: 0,
};

export function weightForActivity(type: string, subtype?: string): number {
  const key = subtype ? `${type}_${subtype}` : type;
  if (ACTIVITY_WEIGHTS[key] !== undefined) return ACTIVITY_WEIGHTS[key];
  if (ACTIVITY_WEIGHTS[type] !== undefined) return ACTIVITY_WEIGHTS[type];
  return 0;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SourceChannel = 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown';
export type SourceMethod = 'form_demo' | 'form_beta' | 'form_algoritmo_linkedin' | 'form_case_semrush' | 'form_proposta' | 'form_playbook_employee_led_growth' | 'extension_linkedin' | 'manual' | 'imported_folk';

export type UpsertPersonInput = {
  name: string;
  /**
   * Email opcional desde a extensão Chrome (mai/2026). Forms do site sempre
   * passam — Zod hardcoded deles exige. Captura LinkedIn pode omitir, nesse
   * caso dedup acontece por `linkedinUrl` (que vira obrigatório no input).
   * Validação: caller precisa fornecer pelo menos um (email OU linkedinUrl).
   */
  email?: string;
  phone?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  headline?: string;
  location?: string;
  acContactId?: string;
  sourceChannel?: SourceChannel;
  sourcePage?: string;
  sourceMethod?: SourceMethod;
  firstTouchSource?: string;
  firstTouchCampaign?: string;
  /**
   * Quando informado, usa esse timestamp como firstTouchAt da pessoa nova.
   * Útil pra re-import do AC (passa cdate do contato) ou pra preservar a data
   * real do primeiro contato em qualquer import. Default = new Date() (hoje).
   * Só aplica em INSERT — pessoa existente não tem firstTouchAt sobrescrito.
   */
  firstTouchAt?: Date;
  /* ----------------- Task 1 — CRM source of truth ----------------- */
  /** Tipo de lead derivado do form. Override em cada submit (última-resposta). */
  segment?: 'lider_b2b' | 'parceiro' | 'profissional_individual' | null;
  /** Opt-in de newsletter (checkbox em forms topo de funil). */
  newsletterOptIn?: boolean;
  /** URL da proposta HTML (form Proposta). */
  proposalUrl?: string;
  /** UTM source do último toque (atualiza a cada submit). */
  lastTouchSource?: string;
  /** UTM campaign do último toque. */
  lastTouchCampaign?: string;
  /**
   * Slug do form acabado de preencher — vai ser appended em
   * people.forms_submitted (dedup atômico via SQL).
   */
  formsSubmittedAppend?: string;
  /**
   * Senioridade do cargo (introduzida no form Playbook ELG, mai/2026).
   * Sobrescreve em cada submit que carregue essa info — última resposta vence.
   * Enums vão pra colunas dedicadas em people (não JSONB) — virou padrão
   * recorrente. Forms que NÃO coletam cargo (Algoritmo LinkedIn, etc) podem
   * deixar undefined.
   */
  jobSeniority?: 'analista' | 'coordenador' | 'gerente' | 'diretor' | 'c_level' | null;
  /**
   * Área funcional (introduzida no form Playbook ELG, mai/2026).
   * Mesma regra do jobSeniority — overwrite por submit, nullable.
   */
  jobArea?:
    | 'marketing'
    | 'growth'
    | 'vendas'
    | 'rh'
    | 'employer_branding'
    | 'comunicacao'
    | 'outro'
    | null;
  /**
   * Set EXPLÍCITO de acTags (rebuild — não merge). Quando passado,
   * substitui completamente o array. Quando undefined, mantém atual.
   */
  acTagsSet?: string[];
  /**
   * Patch de metadata (merge jsonb via `metadata || patch`). Substitui
   * chaves top-level coincidentes, preserva outras. Quando undefined,
   * mantém metadata atual.
   */
  metadataPatch?: Record<string, unknown>;
};

/**
 * Resultado de upsertPerson — sinaliza criação vs atualização e lista
 * mudanças em campos canônicos pra que o caller (recordLeadFromForm)
 * possa emitir activities 'field_changed' correspondentes.
 */
export type UpsertPersonResult = {
  person: Person;
  isNew: boolean;
  fieldChanges: Array<{ field: string; oldValue: string | null; newValue: string | null }>;
  resubscribed: boolean;
};

export type UpsertCompanyInput = {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  linkedinUrl?: string;
  /** Default = new Date(). Mesma semântica do upsertPerson — só aplica em INSERT. */
  firstTouchAt?: Date;
  /**
   * Patch de metadata (merge jsonb). Usado pra empacotar Beta `colaboradores`
   * em `metadata.beta_data.seats_requested` (≠ company.size).
   */
  metadataPatch?: Record<string, unknown>;
};

export type LogActivityInput = {
  personId?: string;
  companyId?: string;
  type: string;
  subtype?: string;
  /**
   * Override do timestamp da activity. Default = now() (default do Drizzle).
   * Pra IMPORT: passar o timestamp original do evento no AC (ev.tstamp pra
   * email events, pv.tstamp pra page views, cdate da nota pra form submits).
   * Sem isso, todas as activities importadas ficam com createdAt=horário
   * do import e a timeline mostra tudo como "X min atrás" (irreal).
   */
  createdAt?: Date;
  weight?: number;
  source?: 'web' | 'email' | 'cal' | 'linkedin' | 'manual' | 'system';
  data?: Record<string, unknown>;
};

export type CrmResult<T> = { ok: true; data: T } | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/*  upsertCompany                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Blacklist de strings que aparecem no campo "empresa" do AC mas NÃO são
 * empresas reais — são tipos de lead que usuários digitaram errado quando
 * preencheram o form Report (ex: marcou "Profissional Individual" no select
 * de intenção mas também escreveu "Profissional Individual" no input de
 * empresa). Bug de dado histórico; defesa aqui pra evitar criar entries
 * fantasma de empresa que poluem o kanban.
 *
 * Comparação case-insensitive, trim antes.
 */
const COMPANY_NAME_BLACKLIST = new Set([
  'agência / consultor',
  'agencia / consultor',
  'agência',
  'agencia',
  'profissional individual',
  'profissionais individuais',
  'líder b2b',
  'lider b2b',
  'líderes b2b',
  'lideres b2b',
  'icp b2b',
  'criador',
  'criadores',
  'parceiro',
  'parceiros',
  'parceiros estratégicos',
  'parceiros estrategicos',
  'newsletter',
  'newsletter boldfy',
  'n/a',
  'na',
  'nao tenho',
  'não tenho',
  'pessoa física',
  'pessoa fisica',
  '-',
  '—',
  '–',
]);

export async function upsertCompany(input: UpsertCompanyInput): Promise<CrmResult<Company>> {
  try {
    const name = input.name.trim();
    if (name.length === 0) return { ok: false, error: 'Nome de empresa vazio' };

    // Defesa contra valores não-empresa que vazaram do campo "empresa" do AC.
    // Comparação case-insensitive.
    if (COMPANY_NAME_BLACKLIST.has(name.toLowerCase())) {
      console.warn(`[crm.upsertCompany] Skipping non-company name: "${name}"`);
      return { ok: false, error: `Nome "${name}" está na blacklist (não é empresa real)` };
    }

    // Ordem de dedup (mai/2026 — captura LinkedIn revelou problema de duplicação):
    //   1. linkedin_url (chave forte, vem da captura de /company/<slug>)
    //   2. LOWER(name) exato (fallback p/ casos sem linkedinUrl)
    //
    // Match em duas etapas evita que captura de empresa via /company/ crie
    // duplicata de empresa "órfã" criada antes pela captura de pessoa
    // (nome parseado do headline diverge do nome oficial no LinkedIn).
    let existing: Company[] = [];
    if (input.linkedinUrl) {
      existing = await db
        .select()
        .from(companies)
        .where(eq(companies.linkedinUrl, input.linkedinUrl))
        .limit(1);
    }
    if (existing.length === 0) {
      existing = await db
        .select()
        .from(companies)
        .where(sql`LOWER(${companies.name}) = LOWER(${name})`)
        .limit(1);
    }

    if (existing[0]) {
      const updates: Partial<Company> = {};
      if (input.industry && !existing[0].industry) updates.industry = input.industry;
      if (input.size && !existing[0].size) updates.size = input.size;
      if (input.website && !existing[0].website) updates.website = input.website;
      if (input.linkedinUrl && !existing[0].linkedinUrl) updates.linkedinUrl = input.linkedinUrl;

      const hasFieldUpdates = Object.keys(updates).length > 0;
      const hasMetaPatch = input.metadataPatch && Object.keys(input.metadataPatch).length > 0;

      if (hasFieldUpdates || hasMetaPatch) {
        // metadata patch via jsonb || — preserva chaves não-coincidentes.
        // Drizzle não tem operador nativo, então uso sql template.
        const patchSql = hasMetaPatch
          ? sql`COALESCE(${companies.metadata}, '{}'::jsonb) || ${JSON.stringify(input.metadataPatch)}::jsonb`
          : undefined;

        const setObj: Record<string, unknown> = { ...updates, updatedAt: new Date() };
        if (patchSql) setObj.metadata = patchSql;

        const [updated] = await db
          .update(companies)
          .set(setObj)
          .where(eq(companies.id, existing[0].id))
          .returning();
        return { ok: true, data: updated };
      }
      return { ok: true, data: existing[0] };
    }

    const defaultStatus = await getDefaultStatus('company');
    const [created] = await db
      .insert(companies)
      .values({
        name,
        industry: input.industry,
        size: input.size,
        website: input.website,
        linkedinUrl: input.linkedinUrl,
        statusId: defaultStatus?.id ?? null,
        firstTouchAt: input.firstTouchAt ?? new Date(),
        metadata: input.metadataPatch ?? null,
      })
      .returning();
    return { ok: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.upsertCompany] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  upsertPerson                                                               */
/* -------------------------------------------------------------------------- */

export async function upsertPerson(
  input: UpsertPersonInput,
  companyId?: string,
): Promise<CrmResult<UpsertPersonResult>> {
  try {
    // Normaliza ambas as chaves de dedup. Pelo menos UMA precisa estar presente.
    const email = input.email?.trim().toLowerCase() || null;
    const linkedinUrl = input.linkedinUrl?.trim() || null;

    if (!email && !linkedinUrl) {
      return { ok: false, error: 'É preciso informar email ou linkedinUrl pra identificar a pessoa' };
    }

    // Lookup: email é a chave primária de dedup (case-insensitive, lower).
    // Quando ausente (captura LinkedIn sem email), cai pra linkedinUrl —
    // que tem unique constraint via idx_people_linkedin desde a 0001.
    const existing = await db
      .select()
      .from(people)
      .where(
        email
          ? eq(people.email, email)
          : eq(people.linkedinUrl, linkedinUrl!),
      )
      .limit(1);

    if (existing[0]) {
      const prev = existing[0];
      const fieldChanges: UpsertPersonResult['fieldChanges'] = [];

      // lastTouchAt: pra captura LIVE (sem firstTouchAt = sem indicação de
      // import histórico), atualiza pra agora. Pra IMPORT (firstTouchAt
      // passado), NÃO sobrescreve — preserva o último contato real que já
      // foi computado via activities. Re-import não deve resetar lastTouch.
      const updates: Partial<Person> = {};
      if (!input.firstTouchAt) {
        updates.lastTouchAt = new Date();
      }
      // Campos canônicos: preenche se vazio + emite field_changed quando
      // troca valor (jobTitle especificamente — outros campos seguem regra
      // "preenche se vazio" hoje pra evitar regressão por dado pior).
      if (input.phone && !prev.phone) updates.phone = input.phone;
      if (input.linkedinUrl && !prev.linkedinUrl) updates.linkedinUrl = input.linkedinUrl;
      if (input.photoUrl && !prev.photoUrl) updates.photoUrl = input.photoUrl;
      if (input.headline && !prev.headline) updates.headline = input.headline;
      if (input.location && !prev.location) updates.location = input.location;
      if (input.acContactId && !prev.acContactId) updates.acContactId = input.acContactId;
      if (companyId && !prev.companyId) updates.companyId = companyId;

      // jobTitle especial — sobrescreve E emite field_changed quando muda
      if (input.jobTitle && input.jobTitle !== prev.jobTitle) {
        updates.jobTitle = input.jobTitle;
        fieldChanges.push({
          field: 'jobTitle',
          oldValue: prev.jobTitle,
          newValue: input.jobTitle,
        });
      }

      // Task 1: segment é última-resposta (sobrescreve sempre que informado).
      // Emite field_changed quando muda pra ter trilha de mudança de intenção.
      if (input.segment !== undefined && input.segment !== prev.segment) {
        updates.segment = input.segment;
        fieldChanges.push({
          field: 'segment',
          oldValue: prev.segment,
          newValue: input.segment,
        });
      }

      // newsletter_opt_in: também sobrescreve. Sem field_changed pra evitar
      // ruído (true→false é mudança normal entre forms diferentes).
      if (input.newsletterOptIn !== undefined && input.newsletterOptIn !== prev.newsletterOptIn) {
        updates.newsletterOptIn = input.newsletterOptIn;
      }

      // proposal_url: sobrescreve quando vier (forma mais recente prevalece).
      if (input.proposalUrl !== undefined) {
        updates.proposalUrl = input.proposalUrl;
      }

      // last_touch_* sempre atualiza quando vier (first_touch_* nunca toca).
      if (input.lastTouchSource !== undefined) updates.lastTouchSource = input.lastTouchSource;
      if (input.lastTouchCampaign !== undefined) updates.lastTouchCampaign = input.lastTouchCampaign;

      // jobSeniority + jobArea (mai/2026): última-resposta vence. Emite
      // field_changed quando muda — útil pra trilha de promoção (pessoa
      // virou C-level entre forms, mudou de área, etc).
      if (input.jobSeniority !== undefined && input.jobSeniority !== prev.jobSeniority) {
        updates.jobSeniority = input.jobSeniority;
        fieldChanges.push({
          field: 'jobSeniority',
          oldValue: prev.jobSeniority,
          newValue: input.jobSeniority,
        });
      }
      if (input.jobArea !== undefined && input.jobArea !== prev.jobArea) {
        updates.jobArea = input.jobArea;
        fieldChanges.push({
          field: 'jobArea',
          oldValue: prev.jobArea,
          newValue: input.jobArea,
        });
      }

      // Resubscribe: form novo numa pessoa unsubscribed = volta pra ativo.
      let resubscribed = false;
      if (prev.unsubscribed && input.formsSubmittedAppend) {
        updates.unsubscribed = false;
        updates.resubscribedAt = new Date();
        resubscribed = true;
      }

      // acTagsSet: rebuild explícito do array (não merge).
      if (input.acTagsSet !== undefined) {
        updates.acTags = input.acTagsSet;
      }

      /* ----- SQL-level updates pra forms_submitted (atômico, dedup) ----- */
      // formsSubmittedAppend: ARRAY(SELECT DISTINCT unnest(coalesce(...) || ARRAY[slug]))
      // — atômico no UPDATE, sobrevive a submits simultâneos.
      const setObj: Record<string, unknown> = { ...updates, updatedAt: new Date() };
      if (input.formsSubmittedAppend) {
        const slug = input.formsSubmittedAppend;
        setObj.formsSubmitted = sql`ARRAY(SELECT DISTINCT unnest(COALESCE(${people.formsSubmitted}, '{}'::text[]) || ARRAY[${slug}]::text[]))`;
      }

      // metadata patch via jsonb || — preserva chaves não-coincidentes.
      if (input.metadataPatch && Object.keys(input.metadataPatch).length > 0) {
        setObj.metadata = sql`COALESCE(${people.metadata}, '{}'::jsonb) || ${JSON.stringify(input.metadataPatch)}::jsonb`;
      }

      const [updated] = await db
        .update(people)
        .set(setObj)
        .where(eq(people.id, prev.id))
        .returning();
      return { ok: true, data: { person: updated, isNew: false, fieldChanges, resubscribed } };
    }

    /* ------------------------------------------------------------------ */
    /*  INSERT — pessoa nova                                              */
    /* ------------------------------------------------------------------ */
    const defaultStatus = await getDefaultStatus('person');
    const firstTouch = input.firstTouchAt ?? new Date();
    const [created] = await db
      .insert(people)
      .values({
        name: input.name.trim(),
        email,
        phone: input.phone,
        jobTitle: input.jobTitle,
        linkedinUrl,
        photoUrl: input.photoUrl,
        headline: input.headline,
        location: input.location,
        companyId,
        statusId: defaultStatus?.id ?? null,
        leadScore: 0,
        sourceChannel: input.sourceChannel ?? 'unknown',
        sourcePage: input.sourcePage,
        sourceMethod: input.sourceMethod ?? 'manual',
        firstTouchAt: firstTouch,
        firstTouchSource: input.firstTouchSource ?? input.sourceChannel,
        firstTouchCampaign: input.firstTouchCampaign,
        // lastTouchAt = firstTouch quando importando histórico, pra timeline
        // não desalinhar (lastTouch nunca anterior a firstTouch).
        lastTouchAt: firstTouch,
        lastTouchSource: input.lastTouchSource ?? input.firstTouchSource ?? input.sourceChannel,
        lastTouchCampaign: input.lastTouchCampaign ?? input.firstTouchCampaign,
        acContactId: input.acContactId,
        // Task 1 — campos novos
        segment: input.segment ?? null,
        newsletterOptIn: input.newsletterOptIn ?? false,
        formsSubmitted: input.formsSubmittedAppend ? [input.formsSubmittedAppend] : [],
        proposalUrl: input.proposalUrl,
        acTags: input.acTagsSet ?? null,
        metadata: input.metadataPatch ?? null,
        // Playbook ELG (mai/2026) — enums novos. Nullable em INSERT.
        jobSeniority: input.jobSeniority ?? null,
        jobArea: input.jobArea ?? null,
      })
      .returning();
    return {
      ok: true,
      data: { person: created, isNew: true, fieldChanges: [], resubscribed: false },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.upsertPerson] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  logActivity — atualiza score + auto-promote status                        */
/* -------------------------------------------------------------------------- */

export async function logActivity(
  input: LogActivityInput,
): Promise<CrmResult<{ activityId: string; newScore?: number; newStatusId?: string }>> {
  try {
    const weight = input.weight ?? weightForActivity(input.type, input.subtype);

    const activityValues: NewActivity = {
      personId: input.personId,
      companyId: input.companyId,
      type: input.type,
      weight,
      source: input.source,
      data: input.subtype
        ? { subtype: input.subtype, ...input.data }
        : input.data,
      // Override createdAt quando passado (ex: import histórico). Sem isso,
      // todas as activities importadas ficam com createdAt=now e a timeline
      // mostra tudo como "X min atrás" mesmo pra eventos de meses atrás.
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    };

    const [activity] = await db
      .insert(activities)
      .values(activityValues)
      .returning({ id: activities.id });

    let newScore: number | undefined;
    let newStatusId: string | undefined;

    if (weight !== 0 && input.personId) {
      // lastTouchAt: pra activity nova (em tempo real), usa now().
      // Pra activity HISTÓRICA (import com createdAt passado), preserva o
      // que já está no banco — evita que um re-import jogue lastTouchAt pra
      // "agora" e crie a falsa sensação de que o lead interagiu hoje.
      const setClause: Record<string, unknown> = {
        leadScore: sql`GREATEST(0, ${people.leadScore} + ${weight})`,
        updatedAt: new Date(),
      };
      if (!input.createdAt) {
        setClause.lastTouchAt = new Date();
      } else {
        // Activity histórica: atualiza lastTouchAt SÓ se o novo timestamp é
        // mais recente que o atual (preserva o último contato real).
        setClause.lastTouchAt = sql`GREATEST(COALESCE(${people.lastTouchAt}, ${input.createdAt.toISOString()}::timestamptz), ${input.createdAt.toISOString()}::timestamptz)`;
      }
      const [updated] = await db
        .update(people)
        .set(setClause)
        .where(eq(people.id, input.personId))
        .returning({ leadScore: people.leadScore, statusId: people.statusId });

      if (updated) {
        newScore = updated.leadScore;
        const desiredStatus = await statusForScore(newScore);
        if (desiredStatus) {
          const shouldPromote = await shouldAutoPromote(updated.statusId, desiredStatus.id);
          if (shouldPromote) {
            // Resolve fromLabel antes de mudar (pra activity ter labels reais)
            const all = await getStatuses('person');
            const fromStatus = updated.statusId ? all.find((s) => s.id === updated.statusId) : null;

            await db
              .update(people)
              .set({ statusId: desiredStatus.id, updatedAt: new Date() })
              .where(eq(people.id, input.personId));
            newStatusId = desiredStatus.id;

            await db.insert(activities).values({
              personId: input.personId,
              type: 'status_change',
              weight: 0,
              source: 'system',
              data: {
                fromId: updated.statusId,
                toId: desiredStatus.id,
                fromLabel: fromStatus?.label ?? null,
                toLabel: desiredStatus.label,
                reason: 'auto_score_threshold',
              },
            });

            // Auto-promote da pessoa → tenta promover empresa também (monotônico)
            const [personRow] = await db
              .select({ companyId: people.companyId })
              .from(people)
              .where(eq(people.id, input.personId))
              .limit(1);
            if (personRow?.companyId) {
              await syncCompanyFromPeople(personRow.companyId);
            }
          }
        }
      }
    }

    return { ok: true, data: { activityId: activity.id, newScore, newStatusId } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm.logActivity] failed:', msg);
    return { ok: false, error: msg };
  }
}

/* -------------------------------------------------------------------------- */
/*  buildAcListNames — resolve as listas de AC pra inscrever um lead          */
/*                                                                             */
/*  Caminho 2 (mai/2026): CRM é source of truth. Em vez de depender de         */
/*  automations do AC ("Tag X → adiciona em Lista Y") que ficaram inativas     */
/*  depois do refactor de tags em 22/05, código resolve direto baseado em:     */
/*    1. segment → lista de segmento                                           */
/*    2. formSlug → lista de cadência (FORM_DEFS_SEED.acListName)              */
/*    3. newsletterOptIn → "Newsletter Boldfy"                                 */
/*                                                                             */
/*  Listas que não existem no AC são silenciosamente puladas pelo activecampaign.ts */
/*  via getListIdByNameMap() — sem erro, só warning no console.                */
/*                                                                             */
/*  Order matters apenas pra log/debug — AC trata o POST como idempotente.     */
/* -------------------------------------------------------------------------- */

function buildAcListNames(lead: ClassifiedLead): string[] {
  const names: string[] = [];

  // 1. Lista de segmento (Líderes B2B / Profissionais Individuais / Parceiros)
  switch (lead.segment) {
    case 'lider_b2b':
      names.push('Líderes B2B');
      break;
    case 'profissional_individual':
      names.push('Profissionais Individuais');
      break;
    case 'parceiro':
      names.push('Parceiros estratégicos');
      break;
    default:
      // segment=null → nenhuma lista de segmento (form lider_b2b_only sem
      // intenção declarada, ou erro de classificação — não bloqueia o resto)
      break;
  }

  // 2. Lista de cadência do form (algoritmo-linkedin, case-semrush, beta, etc)
  const formDef = FORM_DEFS_SEED[lead.formSlug as FormSlug];
  if (formDef?.acListName) {
    names.push(formDef.acListName);
  }

  // 3. Newsletter Boldfy (opt-in explícito no form — futuro `opt_news`)
  if (lead.newsletterOptIn) {
    names.push('Newsletter Boldfy');
  }

  return names;
}

/* -------------------------------------------------------------------------- */
/*  recordLeadFromForm — wrapper alto-nível pros server actions de form        */
/*                                                                             */
/*  Task 1 (mai/2026): aceita ClassifiedLead direto (vem de form-adapters).    */
/*  Fluxo:                                                                     */
/*    1. upsertCompany (se aplicável)                                          */
/*    2. upsertPerson com tudo (segment, opt-in, acTags, metadata, etc)        */
/*    3. logActivity 'form_submit_<slug>' com payload completo                 */
/*    4. logActivity 'field_changed' por mudança detectada                     */
/*    5. logActivity 'lead_resubscribed' se voltou pra ativo                   */
/*    6. classifyPersonBySourceMethod (com isNew pra suprimir no_regression    */
/*       em pessoa recém-criada)                                               */
/*    7. AC syncContact (try/catch — emit 'ac_sync_failed' se falhar; nunca    */
/*       propaga erro pro caller)                                              */
/* -------------------------------------------------------------------------- */

export async function recordLeadFromForm(
  lead: ClassifiedLead,
): Promise<CrmResult<{ personId: string; companyId?: string }>> {
  /* ---------- 1. Empresa ---------- */
  let companyId: string | undefined;
  if (lead.companyName) {
    const c = await upsertCompany({
      name: lead.companyName,
      industry: lead.companyIndustry,
      size: lead.companySize,
      metadataPatch: lead.companyMetadataPatch,
    });
    if (c.ok) companyId = c.data.id;
  }

  /* ---------- 2. Pessoa ---------- */
  const p = await upsertPerson(
    {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      jobTitle: lead.jobTitle,
      linkedinUrl: lead.linkedinUrl,
      photoUrl: lead.photoUrl,
      headline: lead.headline,
      location: lead.location,
      acContactId: lead.acContactId,
      sourceChannel: lead.sourceChannel,
      sourcePage: lead.sourcePage,
      sourceMethod: lead.sourceMethod,
      firstTouchSource: lead.firstTouchSource ?? lead.sourceChannel,
      firstTouchCampaign: lead.firstTouchCampaign,
      lastTouchSource: lead.lastTouchSource ?? lead.sourceChannel,
      lastTouchCampaign: lead.lastTouchCampaign ?? lead.firstTouchCampaign,
      segment: lead.segment,
      newsletterOptIn: lead.newsletterOptIn,
      proposalUrl: lead.proposalUrl,
      formsSubmittedAppend: lead.formSlug,
      acTagsSet: lead.acTags,
      metadataPatch: lead.personMetadataPatch,
      // Playbook ELG (mai/2026): forms que coletam cargo passam aqui.
      jobSeniority: lead.jobSeniority,
      jobArea: lead.jobArea,
    },
    companyId,
  );
  if (!p.ok) return { ok: false, error: p.error };
  const { person, isNew, fieldChanges, resubscribed } = p.data;

  /* ---------- 3. Activity de form_submit (timeline) ---------- */
  // Activity type preserva format atual `form_submit_<slug>` pra manter
  // compat com ACTIVITY_WEIGHTS e filtros do kanban. Payload tem form_slug
  // explícito + todos os campos do form pra render da timeline rica (Task 2).
  await logActivity({
    personId: person.id,
    companyId,
    type: formSlugToActivityType(lead.formSlug),
    source: lead.source ?? 'web',
    data: {
      form_slug: lead.formSlug,
      ...lead.activityData,
    },
  });

  /* ---------- 4. field_changed activities ---------- */
  for (const change of fieldChanges) {
    await db.insert(activities).values({
      personId: person.id,
      type: 'field_changed',
      weight: 0,
      source: 'system',
      data: {
        field: change.field,
        old_value: change.oldValue,
        new_value: change.newValue,
        source_form: lead.formSlug,
      },
    });
  }

  /* ---------- 5. lead_resubscribed (se aplicável) ---------- */
  if (resubscribed) {
    await db.insert(activities).values({
      personId: person.id,
      type: 'lead_resubscribed',
      weight: 0,
      source: 'system',
      data: { form_slug: lead.formSlug },
    });
  }

  /* ---------- 6. Classificação por sourceMethod ---------- */
  // isNew=true suprime activity 'classification_skipped reason=no_regression'
  // (era ruído pra pessoa recém-criada, sem promoção real).
  await classifyPersonBySourceMethod(person.id, lead.sourceMethod, isNew);

  /* ---------- 7. AC sync (try/catch — nunca bloqueia) ---------- */
  // Ordem invertida: CRM gravou primeiro (princípio 1 da spec — source of
  // truth). AC vem depois. Se falhar, emite activity ac_sync_failed e segue.
  //
  // Email null (capturas LinkedIn sem email) pula sync — AC é fundamentalmente
  // email-based e contato sem email não tem o que receber. Decisão registrada
  // em SPEC-extension-linkedin.md §8.
  if (lead.syncToAC !== false && person.email) {
    try {
      // Listas do AC pra inscrever automaticamente (mai/2026 — Caminho 2):
      // - Lista de segmento (Líderes B2B / Profissionais Individuais /
      //   Parceiros estratégicos) baseada em lead.segment
      // - Lista de cadência do form (form-definitions.acListName)
      // - Newsletter Boldfy se opt-news=true
      //
      // Source of truth = CRM. Quando contato muda de segment ou marca
      // newsletter, próximo sync reflete via re-inscrição. AC trata o
      // POST /api/3/contactLists como idempotente — sem duplicação.
      const listNames = buildAcListNames(lead);

      const acContactId = await syncContact({
        email: person.email,
        firstName: lead.acFirstName ?? lead.name.split(/\s+/)[0],
        lastName: lead.acLastName ?? lead.name.split(/\s+/).slice(1).join(' '),
        phone: lead.phone,
        tags: lead.acTags,
        fields: lead.acFields,
        listNames,
      });
      if (acContactId && !person.acContactId) {
        // Cacheia contactId no people pra futuros syncs serem diretos
        await db
          .update(people)
          .set({ acContactId, updatedAt: new Date() })
          .where(eq(people.id, person.id));
      }
      if (!acContactId) {
        // syncContact retornou null (AC down ou config faltando)
        await db.insert(activities).values({
          personId: person.id,
          type: 'ac_sync_failed',
          weight: 0,
          source: 'system',
          data: { reason: 'sync_returned_null', form_slug: lead.formSlug },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[recordLeadFromForm] AC sync error (non-blocking):', msg);
      await db.insert(activities).values({
        personId: person.id,
        type: 'ac_sync_failed',
        weight: 0,
        source: 'system',
        data: { reason: 'sync_threw', error: msg, form_slug: lead.formSlug },
      });
    }
  }

  return { ok: true, data: { personId: person.id, companyId } };
}

/**
 * Aplica regra de classificação de pessoa por sourceMethod, respeitando
 * não-regressão e auto-promotion.
 *
 * Exposto pra uso pela extensão futura também (que vai passar
 * sourceMethod='extension_linkedin').
 *
 * Comportamento:
 *  1. Resolve target status via classifyByMethod (lib/statuses.ts)
 *  2. Lê status atual da pessoa
 *  3. Se target tem sortOrder MAIOR que current OU pessoa não tem status → muda
 *  4. Caso contrário → não mexe (registra reason='no_regression' em activity de auditoria)
 *
 * Status atual é considerado "mais avançado" se: tem sortOrder maior, OU é
 * terminal (terminal sempre vence — não regride mesmo se sortOrder menor).
 *
 * Task 1 (mai/2026): novo param `isNewlyCreated` suprime a activity
 * `classification_skipped reason='no_regression'` pra pessoa recém-criada.
 * Sem isso, todo lead novo do Report ganha logo de cara um item ruidoso
 * "Form X — mantido em Ativo" na timeline (não há "anterior" pra manter).
 */
export async function classifyPersonBySourceMethod(
  personId: string,
  sourceMethod: SourceMethod,
  isNewlyCreated = false,
): Promise<void> {
  try {
    const [current] = await db
      .select({ statusId: people.statusId })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);
    if (!current) return;

    const all = await getStatuses('person');
    const currentStatus = current.statusId ? all.find((s) => s.id === current.statusId) : null;

    // Pessoa em terminal (Fechado/Perdido) — nunca mexe. Loga skip.
    if (currentStatus?.isTerminal) {
      await db.insert(activities).values({
        personId,
        type: 'classification_skipped',
        weight: 0,
        source: 'system',
        data: { reason: 'is_terminal', sourceMethod, currentStatus: currentStatus.label },
      });
      return;
    }

    // Método sem cadeia de classificação (ex: form_demo) — Cal webhook é
    // quem cuida do próximo passo. Loga skip com reason explícito.
    if (!hasClassificationLadder(sourceMethod as Parameters<typeof hasClassificationLadder>[0])) {
      await db.insert(activities).values({
        personId,
        type: 'classification_skipped',
        weight: 0,
        source: 'system',
        data: { reason: 'no_classification_by_design', sourceMethod, currentStatus: currentStatus?.label ?? null },
      });
      return;
    }

    // Resolve target via cadeia de promoção. Passa o sortOrder atual pra
    // classifyByMethod decidir qual elo da cadeia se aplica (Quente vs
    // Em andamento etc).
    const target = await classifyByMethod(sourceMethod, currentStatus?.sortOrder ?? null);

    if (!target) {
      // Cadeia toda menor que current — não promove (não regride).
      // Task 1: pra pessoa recém-criada, esse skip é ruído (não há "anterior"
      // pra manter — promoção foi feita no INSERT via defaultStatus). Skipa
      // a activity. Pra pessoa já avançada que preenche form de baixo nível
      // (ex: lead em Reunião marcada preenche Report), continua logando pra
      // auditoria — aí tem valor real entender que o lead voltou a engajar.
      if (!isNewlyCreated) {
        await db.insert(activities).values({
          personId,
          type: 'classification_skipped',
          weight: 0,
          source: 'system',
          data: {
            reason: 'no_regression',
            sourceMethod,
            currentStatus: currentStatus?.label ?? null,
          },
        });
      }
      return;
    }

    // Aplica mudança + activity
    await db
      .update(people)
      .set({ statusId: target.id, updatedAt: new Date() })
      .where(eq(people.id, personId));

    await db.insert(activities).values({
      personId,
      type: 'status_change',
      weight: 0,
      source: 'system',
      data: {
        fromId: currentStatus?.id ?? null,
        toId: target.id,
        fromLabel: currentStatus?.label ?? null,
        toLabel: target.label,
        reason: 'classify_by_method',
        sourceMethod,
      },
    });

    // Sync empresa linkada — classificação de pessoa pode mudar empresa também
    const [personRow] = await db
      .select({ companyId: people.companyId })
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);
    if (personRow?.companyId) {
      await syncCompanyFromPeople(personRow.companyId);
    }
  } catch (err) {
    console.error('[crm.classifyPersonBySourceMethod] failed:', err);
    // Não-fatal — não bloqueia o fluxo de captação de lead
  }
}
