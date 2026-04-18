'use server';

/**
 * Server action to capture proposal builder leads.
 *
 * Arquitetura simplificada (a partir de Abr/2026):
 * - UM único database no Notion: "Propostas" — recebe cada proposta como uma page
 * - CRM fica no ActiveCampaign (fonte de verdade) — syncContact taggeia tudo
 * - Notion serve só pra armazenar o snapshot da proposta e gerar o link compartilhável /proposta/[id]
 */

import type { ProposalData } from '@/lib/notion-crm';
import { syncContact, addNoteToContact } from '@/lib/activecampaign';

const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Single database that stores all proposals (1 page = 1 proposal submission)
const NOTION_PROPOSTAS_DB_ID = process.env.NOTION_PROPOSTAS_DB_ID;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://boldfy.com.br';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_HEADERS = () => ({
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
});

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProposalLeadInput = {
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  // Config
  betaActive: boolean;
  plataformaEnabled: boolean;
  plataformaSeats: number;
  plataformaEnterprise: boolean;
  plataformaPriceFull: number;
  plataformaPriceBeta: number;
  designPlan: string | null; // 'starter' | 'growth' | 'scale' | null
  designPrice: number;
  fsTls: number;   // 0 = off, 1–5 = TLs
  fsFreq: number;  // 0 = off, 2/3/4 = posts per week
  fsPrice: number;
  totalCurrent: number;
  totalFull: number;
  savings: number;
  origem: string;
  // UTM tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  // Team (computed in frontend)
  teamItems: { text: string; dedicated: boolean }[];
};

export type ProposalLeadResult = {
  success: boolean;
  error?: string;
  proposalUrl?: string;
  propostaId?: string;
};

/* -------------------------------------------------------------------------- */
/*  Build proposal JSON + summary                                              */
/* -------------------------------------------------------------------------- */

function buildProposalJSON(input: ProposalLeadInput): ProposalData {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    lead: {
      nome: input.nome,
      email: input.email,
      empresa: input.empresa,
      cargo: input.cargo,
    },
    betaActive: input.betaActive,
    platform: {
      enabled: input.plataformaEnabled,
      seats: input.plataformaSeats,
      perSeatFull: input.plataformaPriceFull,
      perSeatBeta: input.plataformaPriceBeta,
    },
    design: {
      enabled: !!input.designPlan,
      pack: input.designPlan ?? '',
      price: input.designPrice,
    },
    fullService: {
      enabled: input.fsTls > 0 && input.fsFreq > 0,
      tls: input.fsTls,
      freq: input.fsFreq,
      price: input.fsPrice,
    },
    totals: {
      current: input.totalCurrent,
      full: input.totalFull,
      savings: input.savings,
    },
    team: input.teamItems,
  };
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

function buildProposalSummary(input: ProposalLeadInput): string {
  const lines: string[] = [];
  lines.push(`Proposta montada via Simulador`);
  lines.push(`Beta ativo: ${input.betaActive ? 'Sim (30% off plataforma)' : 'Não'}`);

  if (input.plataformaEnabled) {
    const perSeat = input.betaActive ? input.plataformaPriceBeta : input.plataformaPriceFull;
    const total = input.plataformaSeats * perSeat;
    const totalFull = input.plataformaSeats * input.plataformaPriceFull;
    lines.push(`Plataforma: ${input.plataformaSeats} seats × R$ ${perSeat}/seat = R$ ${fmt(total)}/mês${input.betaActive ? ` (cheio: R$ ${fmt(totalFull)}/mês)` : ''}`);
  }

  if (input.designPlan) {
    const planLabels: Record<string, string> = {
      starter: 'Starter (4 peças)',
      growth: 'Growth (8 peças)',
      scale: 'Scale (12 peças)',
    };
    lines.push(`Design on Demand: ${planLabels[input.designPlan] ?? input.designPlan} = R$ ${fmt(input.designPrice)}/mês`);
  }

  if (input.fsTls > 0 && input.fsFreq > 0) {
    lines.push(`Content Full-Service: ${input.fsTls} executivo(s) × ${input.fsFreq}x/semana = R$ ${fmt(input.fsPrice)}/mês`);
  }

  lines.push(`Total mensal: R$ ${fmt(input.totalCurrent)}${input.savings > 0 ? ` (economia beta: R$ ${fmt(input.savings)}/mês)` : ''}`);
  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/*  Create proposal page in Notion (single database)                           */
/* -------------------------------------------------------------------------- */

async function createPropostaPage(
  input: ProposalLeadInput,
  proposalJSON: ProposalData,
): Promise<string | null> {
  if (!NOTION_PROPOSTAS_DB_ID) {
    console.error('[proposal-leads] NOTION_PROPOSTAS_DB_ID not configured');
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const title = `${input.nome} — ${input.empresa}`;
  const summary = buildProposalSummary(input);

  // Discover database schema so we only send properties that exist
  const dbRes = await fetch(
    `${NOTION_API}/databases/${NOTION_PROPOSTAS_DB_ID}`,
    { headers: NOTION_HEADERS() },
  );
  let dbProperties: Record<string, { type: string }> = {};
  if (dbRes.ok) {
    const dbData = await dbRes.json();
    dbProperties = dbData.properties || {};
  }

  // Build properties dynamically — always include title, but other props only if DB has them
  const properties: Record<string, unknown> = {};

  // 1. Title (required by Notion) — find the title property (any name)
  const titleKey = Object.keys(dbProperties).find(
    (k) => dbProperties[k].type === 'title',
  );
  if (titleKey) {
    properties[titleKey] = { title: [{ text: { content: title } }] };
  }

  const addEmail = (name: string, value?: string) => {
    if (value && dbProperties[name]?.type === 'email') {
      properties[name] = { email: value };
    }
  };
  const addRich = (name: string, value?: string) => {
    if (value && dbProperties[name]?.type === 'rich_text') {
      properties[name] = {
        rich_text: [{ text: { content: value.slice(0, 2000) } }],
      };
    }
  };
  const addSelect = (name: string, value?: string) => {
    if (value && dbProperties[name]?.type === 'select') {
      properties[name] = { select: { name: value } };
    }
  };
  const addMultiSelect = (name: string, values: string[]) => {
    if (values.length > 0 && dbProperties[name]?.type === 'multi_select') {
      properties[name] = {
        multi_select: values.map((v) => ({ name: v })),
      };
    }
  };
  const addNumber = (name: string, value?: number) => {
    if (value !== undefined && dbProperties[name]?.type === 'number') {
      properties[name] = { number: value };
    }
  };
  const addDate = (name: string, value: string) => {
    if (dbProperties[name]?.type === 'date') {
      properties[name] = { date: { start: value } };
    }
  };

  addEmail('Email', input.email);
  addRich('Empresa', input.empresa);
  addRich('Cargo', input.cargo);
  addRich('Resumo', summary);
  addDate('Data', today);
  addSelect('Status', 'Novo');
  addSelect('Origem', input.origem);
  addSelect('utm_source', input.utm_source);
  addSelect('utm_medium', input.utm_medium);
  addSelect('utm_campaign', input.utm_campaign);
  addNumber('Total mensal', input.totalCurrent);
  addNumber('Seats plataforma', input.plataformaSeats);

  // Módulos selecionados como multi_select
  const modulos: string[] = [];
  if (input.plataformaEnabled) modulos.push('SaaS');
  if (input.designPlan) modulos.push('Design on Demand');
  if (input.fsTls > 0 && input.fsFreq > 0) modulos.push('Content Full-Service');
  if (input.betaActive) modulos.push('Beta Tester');
  addMultiSelect('Módulos', modulos);

  // Step 1: Try with all properties
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      parent: { database_id: NOTION_PROPOSTAS_DB_ID },
      properties,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[proposal-leads] Error creating proposta:', res.status, errText);

    // Step 2: Fallback — minimum viable (just title)
    if (titleKey) {
      const fallbackRes = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({
          parent: { database_id: NOTION_PROPOSTAS_DB_ID },
          properties: {
            [titleKey]: { title: [{ text: { content: title } }] },
          },
        }),
      });
      if (fallbackRes.ok) {
        return (await fallbackRes.json()).id;
      }
    }
    return null;
  }

  return (await res.json()).id;
}

/**
 * Append proposal data blocks to the page:
 * - JSON with the full proposal (parsed by /proposta/[id] route)
 * - Bookmark with the proposal share URL
 */
async function appendProposalBlocks(
  pageId: string,
  proposalJSON: ProposalData,
  proposalUrl: string,
): Promise<void> {
  await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      children: [
        {
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: 'Dados da proposta' } }],
          },
        },
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'json',
            rich_text: [
              { type: 'text', text: { content: JSON.stringify(proposalJSON, null, 2) } },
            ],
          },
        },
        {
          object: 'block',
          type: 'bookmark',
          bookmark: { url: proposalUrl },
        },
      ],
    }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

export async function sendProposalLeadToNotion(
  input: ProposalLeadInput,
): Promise<ProposalLeadResult> {
  if (!NOTION_API_KEY || !NOTION_PROPOSTAS_DB_ID) {
    console.error('[proposal-leads] NOTION_API_KEY or NOTION_PROPOSTAS_DB_ID not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    const proposalJSON = buildProposalJSON(input);

    // 1. Create proposal page in Notion
    const propostaId = await createPropostaPage(input, proposalJSON);

    // Notion IDs come as UUIDs with dashes; the URL uses the raw ID
    const cleanId = propostaId ? propostaId.replace(/-/g, '') : '';
    const proposalUrl = cleanId ? `${SITE_URL}/proposta/${cleanId}` : '';

    // 2. Append JSON + bookmark blocks to the page (non-blocking)
    if (propostaId && proposalUrl) {
      await appendProposalBlocks(propostaId, proposalJSON, proposalUrl).catch((err) => {
        console.error('[proposal-leads] Error appending blocks:', err);
      });
    }

    // 3. Sync to ActiveCampaign (CRM — fonte de verdade)
    const acTags = buildACTags({
      formType: 'Simulador de Proposta',
      origem: input.origem,
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
      extraTags: [
        input.plataformaEnabled ? 'Módulo: SaaS' : null,
        input.designPlan ? 'Módulo: Design on Demand' : null,
        input.fsTls > 0 ? 'Módulo: Content Full-Service' : null,
        input.betaActive ? 'Beta Tester' : null,
      ].filter((t): t is string => !!t),
    });

    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Fire-and-forget to AC — CRM não deve bloquear resposta do usuário
    syncContact({
      email: input.email,
      firstName,
      lastName,
      empresa: input.empresa,
      cargo: input.cargo,
      origem: input.origem,
      tags: acTags,
    })
      .then((acContactId) => {
        if (acContactId) {
          const summary = buildProposalSummary(input);
          const note = [
            `📋 Proposta gerada via Simulador`,
            ``,
            summary,
            ``,
            proposalUrl ? `🔗 ${proposalUrl}` : '',
            ``,
            `— Tracking —`,
            `Origem no site: ${input.origem}`,
            input.utm_source ? `utm_source: ${input.utm_source}` : '',
            input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
            input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
          ]
            .filter(Boolean)
            .join('\n');
          addNoteToContact(acContactId, note);
        }
      })
      .catch((err) => {
        console.error('[proposal-leads] ActiveCampaign sync error:', err);
      });

    return {
      success: true,
      proposalUrl: proposalUrl || undefined,
      propostaId: propostaId ?? undefined,
    };
  } catch (error) {
    console.error('[proposal-leads] Error:', error);
    return { success: false, error: 'Erro ao salvar a proposta.' };
  }
}

/* -------------------------------------------------------------------------- */
/*  Tag builder compartilhado (pra garantir tags consistentes em todos os     */
/*  endpoints: proposal, demo, contact)                                        */
/* -------------------------------------------------------------------------- */

export function buildACTags(params: {
  formType: string;
  origem?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  extraTags?: string[];
}): string[] {
  const tags: string[] = [];

  // Sempre taggeia o tipo de form
  tags.push(`Form: ${params.formType}`);

  // Origem do botão no site (ex: "home:solutions", "precos:saas", "caas:hero")
  if (params.origem) tags.push(`Origem: ${params.origem}`);

  // UTMs — cada um vira uma tag separada pra facilitar segmentação no AC
  const u = params.utms ?? {};
  if (u.utm_source) tags.push(`utm_source:${u.utm_source}`);
  if (u.utm_medium) tags.push(`utm_medium:${u.utm_medium}`);
  if (u.utm_campaign) tags.push(`utm_campaign:${u.utm_campaign}`);
  if (u.utm_content) tags.push(`utm_content:${u.utm_content}`);
  if (u.utm_term) tags.push(`utm_term:${u.utm_term}`);

  // Extras específicos do form
  if (params.extraTags) tags.push(...params.extraTags);

  return tags;
}
