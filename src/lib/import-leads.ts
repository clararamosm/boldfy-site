import 'server-only';
import { upsertPerson, upsertCompany } from './crm';
import { segmentToTag } from './ac-tags';
import { getCampaignAttributionBySlug } from './events';
import { syncContact } from './activecampaign';

// Campos do CRM que uma coluna do CSV pode mapear. `name` é o identificador
// principal (com fallback pro email quando ausente). `companySize` = porte
// (colaboradores), grava em companies.size — mesmo campo dos forms = "porte" no AC.
export const IMPORT_TARGET_FIELDS = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'companyName', label: 'Empresa' },
  { key: 'companySize', label: 'Colaboradores' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
] as const;

export type ImportTargetKey = (typeof IMPORT_TARGET_FIELDS)[number]['key'];

type LeadSegment = 'lider_b2b' | 'parceiro' | 'profissional_individual';

// Valor especial do dropdown de segmento: deriva por linha a partir do porte
// da empresa (ver regra em importLeads).
const AUTO_BY_COMPANY = 'auto_by_company';

// Corte de porte pro modo automático: empresa com menos de N colaboradores não
// vira Líder B2B (vira Profissional individual). 10+ (ou nº não informado) =
// Líder B2B. Mesma fonte de dado do "porte" no AC → companies.size.
const HEADCOUNT_LIDER_B2B_MIN = 10;

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

// Extrai o primeiro inteiro de uma string de porte ("25", "11-50", "201+",
// "51 a 200"). Retorna null quando não há número (ex: vazio ou texto livre).
function parseHeadcount(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.replace(/\./g, '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

export async function importLeads(input: ImportLeadsInput): Promise<ImportLeadsResult> {
  const { mapping, rows } = input;
  if (!rows || rows.length === 0) {
    return { ok: false, processed: 0, skipped: 0, error: 'Nenhuma linha pra importar' };
  }

  const autoByCompany = input.segment === AUTO_BY_COMPANY;
  // Segmento fixo do lote (quando não for modo automático).
  const fixedSegment = autoByCompany ? null : normalizeSegment(input.segment);
  const extraTags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);
  const attribution = await getCampaignAttributionBySlug(input.campaignSlug);

  // Tags constantes do lote (tags avulsas + evento). O segmento entra por linha
  // mais abaixo, porque no modo automático ele varia.
  const batchTags: string[] = [...extraTags];
  if (attribution) batchTags.push(attribution.eventTag);

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
      // Empresa (se a coluna foi mapeada) — entidade própria, igual ao fluxo de
      // form. O porte (colaboradores) vai pra companies.size (= "porte" no AC).
      let companyId: string | undefined;
      const companyName = cell(row, mapping.companyName);
      const companySizeRaw = cell(row, mapping.companySize);
      if (companyName) {
        const c = await upsertCompany({ name: companyName, size: companySizeRaw });
        if (c.ok) companyId = c.data.id;
      }

      // Segmento da linha no modo automático:
      //  - sem empresa → profissional_individual
      //  - empresa com < HEADCOUNT_LIDER_B2B_MIN colaboradores → profissional_individual
      //  - empresa com >= N (ou porte não informado) → lider_b2b
      // Senão, usa o segmento fixo do lote (pode ser null).
      let rowSegment: LeadSegment | null = fixedSegment;
      if (autoByCompany) {
        if (!companyName) {
          rowSegment = 'profissional_individual';
        } else {
          const headcount = parseHeadcount(companySizeRaw);
          rowSegment =
            headcount !== null && headcount < HEADCOUNT_LIDER_B2B_MIN
              ? 'profissional_individual'
              : 'lider_b2b';
        }
      }

      // Tags da linha = tags do lote + tag de segmento (varia no modo auto).
      const rowTags = [...batchTags];
      const segTag = segmentToTag(rowSegment);
      if (segTag) rowTags.push(segTag);

      const res = await upsertPerson(
        {
          name: name ?? email!,
          email,
          phone: cell(row, mapping.phone),
          jobTitle: cell(row, mapping.jobTitle),
          linkedinUrl: cell(row, mapping.linkedinUrl),
          segment: rowSegment,
          sourceChannel: 'manual',
          sourceMethod: 'manual',
          acTagsSet: rowTags.length > 0 ? rowTags : undefined,
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
      if (email && rowTags.length > 0) {
        try {
          await syncContact({
            email,
            firstName: (name ?? '').split(/\s+/)[0],
            lastName: (name ?? '').split(/\s+/).slice(1).join(' '),
            tags: rowTags,
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
