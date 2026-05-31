import 'server-only';
import { upsertPerson, upsertCompany } from './crm';
import { segmentToTag } from './ac-tags';
import { getCampaignAttributionBySlug } from './events';
import { syncContact } from './activecampaign';

// Campos do CRM que uma coluna do CSV pode mapear. `name` é o identificador
// principal (com fallback pro email quando ausente).
export const IMPORT_TARGET_FIELDS = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'companyName', label: 'Empresa' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
] as const;

export type ImportTargetKey = (typeof IMPORT_TARGET_FIELDS)[number]['key'];

type LeadSegment = 'lider_b2b' | 'parceiro' | 'profissional_individual';

export type ImportLeadsInput = {
  // crmField -> índice da coluna no CSV (ou null = não mapeado)
  mapping: Partial<Record<ImportTargetKey, number | null>>;
  rows: string[][];
  campaignSlug?: string | null;
  tags?: string[];
  segment?: string | null;
};

export type ImportLeadsResult = {
  ok: boolean;
  processed: number;
  skipped: number;
  error?: string;
};

function cell(row: string[], idx: number | null | undefined): string | undefined {
  if (idx === null || idx === undefined || idx < 0) return undefined;
  const v = row[idx];
  if (v === undefined || v === null) return undefined;
  const t = String(v).trim();
  return t.length > 0 ? t : undefined;
}

function normalizeSegment(seg: string | null | undefined): LeadSegment | null {
  if (seg === 'lider_b2b' || seg === 'parceiro' || seg === 'profissional_individual') return seg;
  return null;
}

export async function importLeads(input: ImportLeadsInput): Promise<ImportLeadsResult> {
  const { mapping, rows } = input;
  if (!rows || rows.length === 0) {
    return { ok: false, processed: 0, skipped: 0, error: 'Nenhuma linha pra importar' };
  }

  // Atributos aplicados a TODOS os leads do lote.
  const segment = normalizeSegment(input.segment);
  const extraTags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);
  const attribution = await getCampaignAttributionBySlug(input.campaignSlug);

  const baseTags: string[] = [...extraTags];
  const segTag = segmentToTag(segment);
  if (segTag) baseTags.push(segTag);
  if (attribution) baseTags.push(attribution.eventTag);

  const campaignMembershipsAppend = attribution ? [attribution.slug] : undefined;

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = cell(row, mapping.email);
    const name = cell(row, mapping.name) ?? email; // fallback: usa email como nome
    if (!name && !email) {
      skipped++;
      continue; // sem nome nem email não dá pra identificar
    }

    try {
      // Empresa (se a coluna foi mapeada) — entidade própria, igual ao fluxo de form.
      let companyId: string | undefined;
      const companyName = cell(row, mapping.companyName);
      if (companyName) {
        const c = await upsertCompany({ name: companyName });
        if (c.ok) companyId = c.data.id;
      }

      const res = await upsertPerson(
        {
          name: name ?? email!,
          email,
          phone: cell(row, mapping.phone),
          jobTitle: cell(row, mapping.jobTitle),
          linkedinUrl: cell(row, mapping.linkedinUrl),
          segment,
          sourceChannel: 'manual',
          sourceMethod: 'manual',
          acTagsSet: baseTags.length > 0 ? [...baseTags] : undefined,
          campaignMembershipsAppend,
          metadataPatch: { imported: true, imported_at: new Date().toISOString() },
        },
        companyId,
      );

      if (!res.ok) {
        skipped++;
        continue;
      }

      // AC sync (best-effort) — só quando há email. Aplica a tag de evento +
      // segmento + tags avulsas pra alimentar a cadência pós-evento no AC.
      if (email && baseTags.length > 0) {
        try {
          await syncContact({
            email,
            firstName: (name ?? '').split(/\s+/)[0],
            lastName: (name ?? '').split(/\s+/).slice(1).join(' '),
            tags: [...baseTags],
          });
        } catch (e) {
          console.error('[import-leads] AC sync failed (non-blocking):', e);
        }
      }

      processed++;
    } catch (e) {
      console.error('[import-leads] row failed:', e);
      skipped++;
    }
  }

  return { ok: true, processed, skipped };
}
