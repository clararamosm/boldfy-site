/**
 * Server actions da aba Formulários.
 *
 * deleteRespondents — exclusão DEFINITIVA de respondentes selecionados.
 *
 * Caso de uso (Clara, mai/2026): limpar contatos de teste (emails pessoais /
 * de teste usados pra validar forms) pra não manchar o CRM. A exclusão remove
 * o lead de TODOS os lugares:
 *   - banco do CRM: people + activities + meetings + proposals + playbook_outputs
 *   - ActiveCampaign: DELETE do contato (best-effort — não trava se o AC falhar)
 *   - empresas órfãs: empresa que ficar sem nenhuma pessoa é removida junto
 *
 * Sem soft-delete — é hard delete mesmo (não deixa "coisa fantasma"). O
 * snapshot da Danger Zone segue sendo a rede de proteção pra recuperação.
 *
 * neon-http não tem transação interativa: deletamos em sequência respeitando
 * a ordem das FKs (filhos antes de people; activities da empresa antes da
 * empresa). Mesmo padrão do nukeCrm da Danger Zone.
 */

'use server';

import {
  db,
  people,
  companies,
  activities,
  meetings,
  proposals,
  playbookOutputs,
} from '@/db';
import { inArray, eq } from 'drizzle-orm';
import { deleteContactFromAC } from '@/lib/activecampaign';
import { revalidatePath } from 'next/cache';

export type DeleteRespondentsResult =
  | {
      ok: true;
      deleted: {
        people: number;
        activities: number;
        meetings: number;
        proposals: number;
        playbookOutputs: number;
        companies: number;
      };
      ac: { deleted: number; failed: number; skipped: number };
    }
  | { ok: false; error: string };

const MAX_BATCH = 500;

export async function deleteRespondents(personIds: string[]): Promise<DeleteRespondentsResult> {
  const ids = Array.from(new Set((personIds ?? []).filter((id) => typeof id === 'string' && id.length > 0)));
  if (ids.length === 0) return { ok: false, error: 'Nenhuma pessoa selecionada.' };
  if (ids.length > MAX_BATCH) {
    return { ok: false, error: `Seleção grande demais (${ids.length}). Máximo ${MAX_BATCH} por vez.` };
  }

  try {
    // 1. Snapshot dos dados que precisamos antes de apagar: ac_contact_id (pra
    //    remover do AC) e company_id (pra detectar empresa órfã depois).
    const targets = await db
      .select({ id: people.id, acContactId: people.acContactId, companyId: people.companyId })
      .from(people)
      .where(inArray(people.id, ids));

    if (targets.length === 0) return { ok: false, error: 'Pessoas não encontradas (já excluídas?).' };

    const foundIds = targets.map((t) => t.id);
    const acContactIds = targets.map((t) => t.acContactId).filter((v): v is string => !!v);
    const affectedCompanyIds = Array.from(
      new Set(targets.map((t) => t.companyId).filter((v): v is string => !!v)),
    );

    // 2. Apaga filhos diretos da pessoa (ordem: tudo que referencia people.id).
    const activitiesDeleted = await db.delete(activities).where(inArray(activities.personId, foundIds)).returning({ id: activities.id });
    const meetingsDeleted = await db.delete(meetings).where(inArray(meetings.personId, foundIds)).returning({ id: meetings.id });
    const proposalsDeleted = await db.delete(proposals).where(inArray(proposals.personId, foundIds)).returning({ id: proposals.id });
    const playbooksDeleted = await db.delete(playbookOutputs).where(inArray(playbookOutputs.personId, foundIds)).returning({ id: playbookOutputs.id });

    // 3. Apaga as pessoas.
    const peopleDeleted = await db.delete(people).where(inArray(people.id, foundIds)).returning({ id: people.id });

    // 4. Empresas órfãs: pra cada empresa afetada, se não sobrou nenhuma pessoa
    //    vinculada, remove a empresa (e o que aponta pra ela).
    let companiesDeleted = 0;
    for (const cid of affectedCompanyIds) {
      const remaining = await db
        .select({ id: people.id })
        .from(people)
        .where(eq(people.companyId, cid))
        .limit(1);
      if (remaining.length > 0) continue; // ainda tem gente — mantém a empresa

      // Limpa o que referencia a empresa antes de removê-la (não dependemos de
      // ON DELETE no DB estar configurado).
      await db.delete(activities).where(inArray(activities.companyId, [cid]));
      await db.update(playbookOutputs).set({ companyId: null }).where(eq(playbookOutputs.companyId, cid));
      const delCo = await db.delete(companies).where(eq(companies.id, cid)).returning({ id: companies.id });
      companiesDeleted += delCo.length;
    }

    // 5. ActiveCampaign — best-effort, em paralelo. Não trava a exclusão local.
    let acDeleted = 0;
    let acFailed = 0;
    if (acContactIds.length > 0) {
      const results = await Promise.all(acContactIds.map((cid) => deleteContactFromAC(cid)));
      acDeleted = results.filter(Boolean).length;
      acFailed = results.filter((r) => !r).length;
    }
    const acSkipped = peopleDeleted.length - acContactIds.length;

    revalidatePath('/internal/crm/forms');
    revalidatePath('/internal/crm');
    revalidatePath('/internal/crm/feed');
    revalidatePath('/internal/crm/empresas');

    return {
      ok: true,
      deleted: {
        people: peopleDeleted.length,
        activities: activitiesDeleted.length,
        meetings: meetingsDeleted.length,
        proposals: proposalsDeleted.length,
        playbookOutputs: playbooksDeleted.length,
        companies: companiesDeleted,
      },
      ac: { deleted: acDeleted, failed: acFailed, skipped: Math.max(0, acSkipped) },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[deleteRespondents] failed:', msg);
    return { ok: false, error: msg };
  }
}
