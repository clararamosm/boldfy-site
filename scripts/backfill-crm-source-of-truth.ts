/**
 * Backfill Task 3 — popula colunas novas em `people` a partir do estado
 * histórico (acTags + activities). RUN-ONCE.
 *
 * Spec: crm-source-of-truth-fluxo-form §10 (Task 3 — Migração de dados).
 *
 * O que faz, por pessoa em people:
 *  1. segment        — deriva de acTags antigas (Segmento: Líderes B2B,
 *                       Parceiros estratégicos, Profissionais Individuais).
 *                       Pula se segment já está preenchido (idempotente).
 *  2. newsletter_opt_in — true se tem tag 'Segmento: Newsletter Boldfy'.
 *  3. forms_submitted — coleta slugs únicos de activities form_submit_*
 *                       da pessoa (form_submit_report → 'report', etc).
 *  4. proposal_url   — se houver activity form_submit_proposta com
 *                       data.proposal_url ou data.url_proposta, grava aqui.
 *  5. metadata.backfill_at — timestamp pra auditoria do que foi backfillado.
 *
 * O que NÃO faz (escopo de tasks futuras):
 *  - last_touch_source/campaign histórico — preserva null pra não inventar
 *    dados (seria derivado de UTMs da última activity, mas várias activities
 *    importadas não têm UTM granular). Próximo form que a pessoa preencher
 *    popula esses campos naturalmente via recordLeadFromForm.
 *  - acTags rebuild com nomes novos legíveis (Líder B2B etc) — fica pra
 *    Task 3 cleanup AC (Chrome MCP one-shot).
 *  - Empresas órfãs — postponed (task #82 da Clara).
 *
 * Como rodar:
 *   1. Garantir DATABASE_URL no .env.local (vercel env pull .env.local)
 *   2. npm run backfill:crm-source-of-truth
 *      (que é: node --env-file=.env.local --import 'tsx' scripts/...)
 *   3. Validar output: "Done. processed=N, segment_set=X, opt_in_set=Y, ..."
 *   4. Spot-check 2-3 pessoas conhecidas (Patricia, Vini) no /internal/crm/forms
 *
 * Idempotente: rodar de novo não duplica/sobrescreve dados já preenchidos.
 */

import { db, people, activities } from '../src/db';
import { eq, like, and, isNull, sql } from 'drizzle-orm';

type Counters = {
  processed: number;
  segment_set: number;
  opt_in_set: number;
  forms_appended: number;
  proposal_url_set: number;
  skipped_no_changes: number;
  errors: number;
};

/* -------------------------------------------------------------------------- */
/*  Tag mapping — alinhado com routeSegments() antigo em ac-tags.ts          */
/* -------------------------------------------------------------------------- */

function deriveSegmentFromTags(tags: string[] | null): 'lider_b2b' | 'parceiro' | 'profissional_individual' | null {
  if (!tags || tags.length === 0) return null;
  if (tags.includes('Segmento: Líderes B2B')) return 'lider_b2b';
  if (tags.includes('Segmento: Parceiros estratégicos')) return 'parceiro';
  if (tags.includes('Segmento: Profissionais Individuais')) return 'profissional_individual';
  return null;
}

function deriveOptInFromTags(tags: string[] | null): boolean {
  if (!tags || tags.length === 0) return false;
  return tags.includes('Segmento: Newsletter Boldfy');
}

function activityTypeToSlug(type: string): string | null {
  if (type === 'form_submit_report') return 'report';
  if (type === 'form_submit_beta') return 'beta';
  if (type === 'form_submit_demo') return 'demo';
  if (type === 'form_submit_proposta') return 'proposta';
  if (type === 'form_submit_extension_linkedin') return 'linkedin_extension';
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const counters: Counters = {
    processed: 0,
    segment_set: 0,
    opt_in_set: 0,
    forms_appended: 0,
    proposal_url_set: 0,
    skipped_no_changes: 0,
    errors: 0,
  };

  console.log('[backfill] starting backfill of CRM source-of-truth columns...');

  // Pega todas as pessoas não-archived, não-merged.
  const rows = await db
    .select({
      id: people.id,
      email: people.email,
      acTags: people.acTags,
      segment: people.segment,
      newsletterOptIn: people.newsletterOptIn,
      formsSubmitted: people.formsSubmitted,
      proposalUrl: people.proposalUrl,
      metadata: people.metadata,
    })
    .from(people)
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId)));

  console.log(`[backfill] ${rows.length} people to process`);

  for (const person of rows) {
    counters.processed++;
    const updates: Record<string, unknown> = {};

    try {
      /* ---- 1. segment ---- */
      if (!person.segment) {
        const derived = deriveSegmentFromTags(person.acTags);
        if (derived) {
          updates.segment = derived;
          counters.segment_set++;
        }
      }

      /* ---- 2. newsletter_opt_in ---- */
      // Idempotente: só seta se hoje está false e tag indica true.
      const tagSaysOptIn = deriveOptInFromTags(person.acTags);
      if (tagSaysOptIn && !person.newsletterOptIn) {
        updates.newsletterOptIn = true;
        counters.opt_in_set++;
      }

      /* ---- 3. forms_submitted (append de slugs únicos) ---- */
      const formActs = await db
        .select({ type: activities.type, data: activities.data })
        .from(activities)
        .where(and(eq(activities.personId, person.id), like(activities.type, 'form_submit_%')));

      const existingFormsSet = new Set(person.formsSubmitted ?? []);
      const newFormsSet = new Set<string>(existingFormsSet);
      let proposalUrlCandidate: string | undefined;

      for (const act of formActs) {
        const slug = activityTypeToSlug(act.type);
        if (slug) newFormsSet.add(slug);

        // Captura proposal_url da activity de proposta (se existir no payload)
        if (act.type === 'form_submit_proposta' && act.data) {
          const d = act.data as Record<string, unknown>;
          const url = (d.proposal_url as string | undefined)
            ?? (d.url_proposta as string | undefined)
            ?? ((d.utms as Record<string, unknown> | undefined)?.proposal_url as string | undefined);
          if (url && typeof url === 'string' && url.length > 0) {
            proposalUrlCandidate = url;
          }
        }
      }

      if (newFormsSet.size > existingFormsSet.size) {
        updates.formsSubmitted = Array.from(newFormsSet);
        counters.forms_appended += newFormsSet.size - existingFormsSet.size;
      }

      /* ---- 4. proposal_url ---- */
      if (!person.proposalUrl && proposalUrlCandidate) {
        updates.proposalUrl = proposalUrlCandidate;
        counters.proposal_url_set++;
      }

      if (Object.keys(updates).length === 0) {
        counters.skipped_no_changes++;
        continue;
      }

      /* ---- 5. metadata audit + persist ---- */
      const auditPatch = {
        backfill_at: new Date().toISOString(),
        backfill_fields: Object.keys(updates),
      };
      const newMetadata = {
        ...(person.metadata as Record<string, unknown> | null ?? {}),
        backfill_crm_source_of_truth: auditPatch,
      };

      await db
        .update(people)
        .set({ ...updates, metadata: newMetadata, updatedAt: new Date() })
        .where(eq(people.id, person.id));

      if (counters.processed % 20 === 0) {
        console.log(`[backfill] progress: ${counters.processed}/${rows.length}...`);
      }
    } catch (err) {
      counters.errors++;
      console.error(`[backfill] error on person ${person.email}:`, err);
    }
  }

  console.log('\n[backfill] DONE');
  console.log(JSON.stringify(counters, null, 2));

  // Sanity: confere distribuição final de segments
  const dist = await db
    .select({
      segment: people.segment,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(people)
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
    .groupBy(people.segment);

  console.log('\n[backfill] segment distribution after backfill:');
  for (const d of dist) {
    console.log(`  ${d.segment ?? '(null)'}: ${d.count}`);
  }

  const optInCount = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(people)
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      eq(people.newsletterOptIn, true),
    ));
  console.log(`\n[backfill] newsletter_opt_in=true: ${optInCount[0]?.n ?? 0}`);

  const formsDist = await db
    .select({
      slug: sql<string>`unnest(forms_submitted)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(people)
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
    .groupBy(sql`unnest(forms_submitted)`);
  console.log('\n[backfill] forms_submitted distribution:');
  for (const f of formsDist) {
    console.log(`  ${f.slug}: ${f.count}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] fatal:', err);
    process.exit(1);
  });
