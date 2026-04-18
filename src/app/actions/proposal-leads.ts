'use server';

/**
 * Server action to capture proposal builder leads.
 *
 * Arquitetura simplificada (a partir de Abr/2026):
 * - UM único database no Notion: "Propostas" — recebe cada proposta como uma page
 * - O link da proposta (/proposta/[id]) é salvo em uma propriedade URL do DB
 * - CRM fica no ActiveCampaign (fonte de verdade) — syncContact taggeia tudo
 */

import type { ProposalData } from '@/lib/notion-crm';
import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
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
  betaActive: boolean;
  plataformaEnabled: boolean;
  plataformaSeats: number;
  plataformaEnterprise: boolean;
  plataformaPriceFull: number;
  plataformaPriceBeta: number;
  designPlan: string | null;
  designPrice: number;
  fsTls: number;
  fsFreq: number;
  fsPrice: number;
  totalCurrent: number;
  totalFull: number;
  savings: number;
  origem: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
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

  const properties: Record<string, unknown> = {};

  // 1. Title (required by Notion) — find the title property (any name)
  const titleKey = Object.keys(dbProperties).find(
    (k) => dbProperties[k].type === 'title',
  );
  if (titleKey) {
    properties[titleKey] = { title: [{ text: { content: title } }] };
  }

  // Helpers — só preenche propriedades que existem no DB
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
 * Preenche a propriedade do tipo URL no row com o link da proposta.
 * Precisa rodar depois que a page foi criada (dependemos do ID pra montar a URL).
 *
 * Descobre automaticamente a propriedade URL — aceita qualquer nome
 * (ex: "URL", "Link", "Link da proposta", "Proposta").
 * Se o DB tiver mais de uma URL, usa a primeira.
 */
async function setUrlProperty(pageId: string, proposalUrl: string): Promise<void> {
  if (!NOTION_PROPOSTAS_DB_ID) return;

  const dbRes = await fetch(
    `${NOTION_API}/databases/${NOTION_PROPOSTAS_DB_ID}`,
    { headers: NOTION_HEADERS() },
  );
  if (!dbRes.ok) return;
  const dbData = await dbRes.json();
  const dbProperties: Record<string, { type: string }> = dbData.properties || {};

  const urlKey = Object.keys(dbProperties).find(
    (k) => dbProperties[k].type === 'url',
  );
  if (!urlKey) {
    console.warn(
      '[proposal-leads] No "url" property found in Propostas DB — proposal link not attached to row.',
    );
    return;
  }

  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      properties: {
        [urlKey]: { url: proposalUrl },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(
      '[proposal-leads] Error setting url property:',
      res.status,
      errText,
    );
  }
}

/**
 * Append only the JSON block to the page body.
 * A rota /proposta/[id] lê esse bloco pra renderizar a proposta compartilhável.
 */
async function appendProposalJSON(
  pageId: string,
  proposalJSON: ProposalData,
): Promise<void> {
  await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      children: [
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
    const propostaId = await createPropostaPage(input);

    const cleanId = propostaId ? propostaId.replace(/-/g, '') : '';
    const proposalUrl = cleanId ? `${SITE_URL}/proposta/${cleanId}` : '';

    // 2. Preenche a URL no campo do row + guarda o JSON no corpo (non-blocking)
    if (propostaId && proposalUrl) {
      Promise.allSettled([
        setUrlProperty(propostaId, proposalUrl),
        appendProposalJSON(propostaId, proposalJSON),
      ]).catch((err) => {
        console.error('[proposal-leads] Error enriching Notion page:', err);
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

    // Fire-and-forget pro AC — não deve bloquear a resposta do usuário
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
            proposalUrl ? `🔗 Ver proposta: ${proposalUrl}` : '',
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
