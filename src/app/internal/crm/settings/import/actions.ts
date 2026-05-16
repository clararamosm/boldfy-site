/**
 * Import inicial do ActiveCampaign pro nosso CRM.
 *
 * GATE: SÓ traz contatos com tag "Segmento: Líderes B2B".
 * Profissionais individuais e parceiros (agências) ficam só no AC pra
 * cadência editorial — não poluem o CRM de vendas.
 *
 * Estratégia:
 *  - Lê todos os contatos do AC (paginado)
 *  - Pra cada um: checa tags. Se NÃO tem "Segmento: Líderes B2B", pula.
 *  - Senão: upsert Person no nosso DB com custom fields + tags
 *  - Cria activity 'imported_from_ac' (peso 0)
 *
 * Idempotent: roda quantas vezes precisar — upsert por email não duplica.
 *
 * Limitação: AC API pode rate-limit (5 req/s). Vamos com cuidado (sleep 200ms
 * entre lotes). Pra base com 100 contatos: ~30s. Pra 1000: ~5min.
 */

'use server';

import { listAllContacts, getContactFieldValues, getContactTags } from '@/lib/activecampaign';
import { upsertPerson, upsertCompany, logActivity } from '@/lib/crm';
import { db, people } from '@/db';
import { eq } from 'drizzle-orm';

type Result = { ok: true; imported: number; skipped: number; skippedNotB2B: number; errors: number } | { ok: false; error: string };

const SLEEP_MS = 200;
const B2B_TAG = 'Segmento: Líderes B2B';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function importFromAC(): Promise<Result> {
  if (!process.env.ACTIVECAMPAIGN_API_URL || !process.env.ACTIVECAMPAIGN_API_KEY) {
    return { ok: false, error: 'AC não configurado (env vars ausentes)' };
  }

  let imported = 0;
  let skipped = 0;
  let skippedNotB2B = 0;
  let errors = 0;

  try {
    for await (const batch of listAllContacts()) {
      for (const c of batch) {
        try {
          // Pula se já existe no nosso DB (evita refazer trabalho)
          const existing = await db
            .select({ id: people.id, acContactId: people.acContactId })
            .from(people)
            .where(eq(people.email, c.email.toLowerCase()))
            .limit(1);

          if (existing[0]) {
            // Atualiza só ac_contact_id se faltar
            if (!existing[0].acContactId) {
              await db.update(people).set({ acContactId: c.id, updatedAt: new Date() }).where(eq(people.id, existing[0].id));
            }
            skipped++;
            continue;
          }

          // Pega custom fields + tags do AC
          const [fields, tags] = await Promise.all([
            getContactFieldValues(c.id),
            getContactTags(c.id),
          ]);

          // GATE B2B: só importa contatos com tag "Segmento: Líderes B2B".
          // Resto fica só no AC (profissionais individuais, agências, etc).
          if (!tags.includes(B2B_TAG)) {
            skippedNotB2B++;
            continue;
          }

          // Resolve company se tiver
          let companyId: string | undefined;
          const empresa = fields['empresa'] || fields['company'];
          if (empresa && typeof empresa === 'string' && empresa.trim().length > 0) {
            const cc = await upsertCompany({
              name: empresa.trim(),
              size: fields['porte'] || fields['colaboradores'] || fields['funcionarios'],
              industry: fields['setor'] || fields['industry'],
            });
            if (cc.ok) companyId = cc.data.id;
          }

          // Determina source method a partir das tags (Form: X)
          let sourceMethod: 'form_demo' | 'form_beta' | 'form_report' | 'form_proposta' | 'manual' = 'manual';
          if (tags.some((t) => t.includes('Form: Demo'))) sourceMethod = 'form_demo';
          else if (tags.some((t) => t.includes('Form: Beta'))) sourceMethod = 'form_beta';
          else if (tags.some((t) => t.includes('Form: Algoritmo') || t.includes('Form: Report'))) sourceMethod = 'form_report';

          const sourceChannel = (fields['utm_source_first'] as
            'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'pr' | 'manual' | 'unknown' | undefined
          ) ?? 'unknown';

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
          }, companyId);

          if (!p.ok) {
            errors++;
            continue;
          }

          // Persiste ac_tags denormalizado
          if (tags.length > 0) {
            await db.update(people).set({ acTags: tags, updatedAt: new Date() }).where(eq(people.id, p.data.id));
          }

          // Activity de importação (peso 0)
          await logActivity({
            personId: p.data.id,
            type: 'imported_from_ac',
            weight: 0,
            source: 'system',
            data: { ac_contact_id: c.id, tags, imported_at: new Date().toISOString() },
          });

          imported++;
        } catch (err) {
          console.error('[import-ac] contact error:', c.email, err);
          errors++;
        }
      }
      // Rate-limit friendly
      await sleep(SLEEP_MS);
    }

    return { ok: true, imported, skipped, skippedNotB2B, errors };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
