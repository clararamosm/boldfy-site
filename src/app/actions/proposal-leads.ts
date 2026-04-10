'use server';

/**
 * Server action to capture proposal builder leads into Notion CRM.
 *
 * Flow:
 * 1. Search Person DB by email — if found, reuse; if not, create.
 * 2. Search Company DB by name — if found, reuse; if not, create.
 * 3. Link person ↔ company.
 * 4. Add proposal summary as blocks on the person's page.
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;

const NOTION_PERSON_DB_ID =
  process.env.NOTION_PERSON_DB_ID || 'e3841003fdc34b9e9d973bd62d39f5bb';
const NOTION_COMPANY_DB_ID =
  process.env.NOTION_COMPANY_DB_ID || '696f9f291beb40919f9d93a2de939c45';

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
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function findPersonByEmail(email: string): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/databases/${NOTION_PERSON_DB_ID}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      filter: { property: 'Email', email: { equals: email } },
      page_size: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results.length > 0 ? data.results[0].id : null;
}

async function findCompanyByName(name: string): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/databases/${NOTION_COMPANY_DB_ID}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      filter: { property: 'Nome', title: { equals: name } },
      page_size: 1,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results.length > 0 ? data.results[0].id : null;
}

async function createCompany(input: ProposalLeadInput): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      parent: { database_id: NOTION_COMPANY_DB_ID },
      properties: {
        Nome: { title: [{ text: { content: input.empresa } }] },
        'Botão gatilho do formulário': { select: { name: 'Simulador de Proposta' } },
      },
    }),
  });
  if (!res.ok) {
    console.error('[proposal-leads] Error creating company:', res.status);
    return null;
  }
  return (await res.json()).id;
}

async function createPerson(input: ProposalLeadInput, companyId: string | null): Promise<string | null> {
  const properties: Record<string, unknown> = {
    Nome: { title: [{ text: { content: input.nome } }] },
    Email: { email: input.email },
  };
  if (input.cargo && input.cargo !== '—') {
    properties['Cargo'] = { rich_text: [{ text: { content: input.cargo } }] };
  }
  if (companyId) {
    properties['Empresa'] = { relation: [{ id: companyId }] };
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      parent: { database_id: NOTION_PERSON_DB_ID },
      properties,
    }),
  });
  if (!res.ok) {
    console.error('[proposal-leads] Error creating person:', res.status);
    return null;
  }
  return (await res.json()).id;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

function buildProposalSummary(input: ProposalLeadInput): string {
  const lines: string[] = [];
  lines.push(`Proposta montada via Simulador`);
  lines.push(`Beta ativo: ${input.betaActive ? 'Sim (30% off plataforma)' : 'Não'}`);

  if (input.plataformaEnabled) {
    if (input.plataformaEnterprise) {
      lines.push(`Plataforma: ${input.plataformaSeats} seats — Enterprise (sob medida)`);
    } else {
      const perSeat = input.betaActive ? input.plataformaPriceBeta : input.plataformaPriceFull;
      const total = input.plataformaSeats * perSeat;
      const totalFull = input.plataformaSeats * input.plataformaPriceFull;
      lines.push(`Plataforma: ${input.plataformaSeats} seats × R$ ${perSeat}/seat = R$ ${fmt(total)}/mês${input.betaActive ? ` (cheio: R$ ${fmt(totalFull)}/mês)` : ''}`);
    }
  }

  if (input.designPlan) {
    const planLabels: Record<string, string> = {
      starter: 'Starter (4 peças)',
      growth: 'Growth (8 peças)',
      scale: 'Scale (12 peças)',
    };
    lines.push(`Design as a Service: ${planLabels[input.designPlan] ?? input.designPlan} = R$ ${fmt(input.designPrice)}/mês`);
  }

  if (input.fsTls > 0 && input.fsFreq > 0) {
    lines.push(`Content Full-Service: ${input.fsTls} executivo(s) × ${input.fsFreq}x/semana = R$ ${fmt(input.fsPrice)}/mês`);
  }

  lines.push(`Total mensal: R$ ${fmt(input.totalCurrent)}${input.savings > 0 ? ` (economia beta: R$ ${fmt(input.savings)}/mês)` : ''}`);
  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

export async function sendProposalLeadToNotion(
  input: ProposalLeadInput,
): Promise<{ success: boolean; error?: string }> {
  if (!NOTION_API_KEY) {
    console.error('[proposal-leads] NOTION_API_KEY not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    // 1. Find or create company
    let companyId: string | null = null;
    if (input.empresa && input.empresa !== '—') {
      companyId = await findCompanyByName(input.empresa);
      if (!companyId) companyId = await createCompany(input);
    }

    // 2. Find or create person (dedup by email)
    let personId = await findPersonByEmail(input.email);
    if (!personId) {
      personId = await createPerson(input, companyId);
    }
    if (!personId) {
      return { success: false, error: 'Erro ao criar contato no Notion.' };
    }

    // 3. Add proposal summary as blocks on the person's page
    const summary = buildProposalSummary(input);
    await fetch(`${NOTION_API}/blocks/${personId}/children`, {
      method: 'PATCH',
      headers: NOTION_HEADERS(),
      body: JSON.stringify({
        children: [
          { object: 'block', type: 'divider', divider: {} },
          {
            object: 'block', type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: `Proposta — ${new Date().toLocaleDateString('pt-BR')}` } }],
            },
          },
          {
            object: 'block', type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: summary } }],
            },
          },
        ],
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('[proposal-leads] Error:', error);
    return { success: false, error: 'Erro de conexão com o Notion.' };
  }
}
