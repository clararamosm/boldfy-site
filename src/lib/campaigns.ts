/**
 * CRUD de Campanhas — substitui o catálogo hardcoded em src/data/campaigns.ts.
 *
 * Mantém o tipo `Campaign` compatível pra UI não precisar mudar muito.
 * Se a tabela `campaigns` no DB estiver vazia, faz seed do Web Summit Rio
 * (compat com o estado anterior — Clara não perde nada na transição).
 */

import { db, campaigns, type CampaignRow } from '@/db';
import { eq, asc } from 'drizzle-orm';

export type CampaignStatus = 'planejada' | 'ativa' | 'encerrada';

export type Campaign = {
  id: string;
  slug: string;
  name: string;
  objective: string;
  utmCampaign: string; // = slug (compat com a UI antiga)
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  channels: string[];
  shortlinks?: string[];
  notes?: string;
};

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    objective: r.objective,
    utmCampaign: r.slug,
    startDate: new Date(r.startDate).toISOString().split('T')[0],
    endDate: new Date(r.endDate).toISOString().split('T')[0],
    channels: r.channels,
    shortlinks: r.shortlinks ?? undefined,
    notes: r.notes ?? undefined,
  };
}

/** Seed inicial — só roda se a tabela estiver vazia. */
async function seedIfEmpty(): Promise<void> {
  const existing = await db.select({ id: campaigns.id }).from(campaigns).limit(1);
  if (existing.length > 0) return;

  await db.insert(campaigns).values({
    slug: 'web-summit-rio-2026',
    name: 'Web Summit Rio 2026',
    objective: 'Posicionar Boldfy como o player de Employee Advocacy B2B no maior evento de tech LatAm. Gerar 50 leads qualificados + 10 reuniões pós-evento.',
    startDate: new Date('2026-05-01T00:00:00-03:00'),
    endDate: new Date('2026-06-15T23:59:59-03:00'),
    channels: ['Eventos', 'LinkedIn', 'PR'],
    shortlinks: ['ws-card', 'ws-keynote', 'ws-stand'],
    notes: 'Pré-evento: cards QR no stand · LinkedIn ads pra atendentes confirmados · post-evento: cadência de nurturing 7d/14d/30d.',
  });
}

export async function listCampaigns(): Promise<Campaign[]> {
  try {
    await seedIfEmpty();
    const rows = await db.select().from(campaigns).orderBy(asc(campaigns.startDate));
    return rows.map(rowToCampaign);
  } catch (err) {
    console.error('[campaigns] listCampaigns error:', err);
    return [];
  }
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  try {
    const rows = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    return rows[0] ? rowToCampaign(rows[0]) : null;
  } catch {
    return null;
  }
}

export function getCampaignStatus(c: Campaign, now = new Date()): CampaignStatus {
  const start = new Date(`${c.startDate}T00:00:00`);
  const end = new Date(`${c.endDate}T23:59:59`);
  if (now < start) return 'planejada';
  if (now > end) return 'encerrada';
  return 'ativa';
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export type CreateCampaignInput = {
  slug: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  channels: string[];
  shortlinks?: string[];
  notes?: string;
};

export async function createCampaign(input: CreateCampaignInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    // Slug-friendly (kebab-case, alfanum + hifen)
    const cleanSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!cleanSlug) return { ok: false, error: 'Slug inválido' };
    if (!input.name.trim()) return { ok: false, error: 'Nome obrigatório' };
    if (!input.objective.trim()) return { ok: false, error: 'Objetivo obrigatório' };

    const existing = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, cleanSlug)).limit(1);
    if (existing[0]) return { ok: false, error: `Já existe uma campanha com slug "${cleanSlug}"` };

    const [row] = await db.insert(campaigns).values({
      slug: cleanSlug,
      name: input.name.trim(),
      objective: input.objective.trim(),
      startDate: new Date(`${input.startDate}T00:00:00-03:00`),
      endDate: new Date(`${input.endDate}T23:59:59-03:00`),
      channels: input.channels.filter(Boolean),
      shortlinks: input.shortlinks?.filter(Boolean) ?? null,
      notes: input.notes?.trim() || null,
    }).returning({ id: campaigns.id });

    return { ok: true, id: row.id };
  } catch (err) {
    console.error('[campaigns] createCampaign error:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.delete(campaigns).where(eq(campaigns.id, id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
