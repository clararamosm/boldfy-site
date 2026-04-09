'use server';

/**
 * Server action to capture proposal builder leads into Notion CRM.
 *
 * Flow:
 * 1. Search Person DB by email — if found, reuse; if not, create.
 * 2. Search Company DB by name — if found, reuse; if not, create.
 * 3. Link person ↔ company.
 * 4. Create an Interaction entry to log this specific event.
 *
 * Handles deduplication so the same person can fill out multiple forms
 * without creating duplicate pages.
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
  telefone: string;
  cargo: string;
  empresa: string;
  funcionarios: string;
  // Proposal details
  plataformaSeats: number;
  plataformaPrice: number;
  designPlan: string | null; // 'starter' | 'growth' | 'scale' | null
  designPrice: number;
  executiveProfiles: number;
  executiveFrequency: string | null; // '2x' | '3x' | '4x' | null
  executivePrice: number;
  totalMensal: number;
  origem: string; // 'Simulador de Proposta'
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function findPersonByEmail(email: string): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/databases/${NOTION_PERSON_DB_ID}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      filter: {
        property: 'Email',
        email: { equals: email },
      },
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
      filter: {
        property: 'Nome',
        title: { equals: name },
      },
      page_size: 1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.results.length > 0 ? data.results[0].id : null;
}

async function createCompany(
  input: ProposalLeadInput,
): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      parent: { database_id: NOTION_COMPANY_DB_ID },
      properties: {
        Nome: {
          title: [{ text: { content: input.empresa } }],
        },
        'Porte (funcionários)': {
          select: { name: input.funcionarios },
        },
        'Botão gatilho do formulário': {
          select: { name: 'Simulador de Proposta' },
        },
      },
    }),
  });

  if (!res.ok) {
    console.error('[proposal-leads] Error creating company:', res.status);
    return null;
  }

  const data = await res.json();
  return data.id;
}

async function createPerson(
  input: ProposalLeadInput,
  companyId: string,
): Promise<string | null> {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: NOTION_HEADERS(),
    body: JSON.stringify({
      parent: { database_id: NOTION_PERSON_DB_ID },
      properties: {
        Nome: {
          title: [{ text: { content: input.nome } }],
        },
        Email: {
          email: input.email,
        },
        WhatsApp: {
          phone_number: input.telefone,
        },
        Cargo: {
          rich_text: [{ text: { content: input.cargo } }],
        },
        Empresa: {
          relation: [{ id: companyId }],
        },
      },
    }),
  });

  if (!res.ok) {
    console.error('[proposal-leads] Error creating person:', res.status);
    return null;
  }

  const data = await res.json();
  return data.id;
}

function buildProposalSummary(input: ProposalLeadInput): string {
  const lines: string[] = [];
  lines.push(`Proposta montada via Simulador`);
  lines.push(`Plataforma SaaS: ${input.plataformaSeats} seats × R$ ${input.plataformaPrice}/seat = R$ ${(input.plataformaSeats * input.plataformaPrice).toLocaleString('pt-BR')}/mês`);

  if (input.designPlan) {
    const planLabels: Record<string, string> = {
      starter: 'Starter (4 peças)',
      growth: 'Growth (8 peças)',
      scale: 'Scale (12 peças)',
    };
    lines.push(`Design as a Service: ${planLabels[input.designPlan] ?? input.designPlan} = R$ ${input.designPrice.toLocaleString('pt-BR')}/mês`);
  }

  if (input.executiveProfiles > 0 && input.executiveFrequency) {
    const freqLabels: Record<string, string> = {
      '2x': '2x/semana',
      '3x': '3x/semana',
      '4x': '4x/semana',
    };
    lines.push(`Full-Service: ${input.executiveProfiles} perfil(is) × ${freqLabels[input.executiveFrequency] ?? input.executiveFrequency} = R$ ${input.executivePrice.toLocaleString('pt-BR')}/mês`);
  }

  lines.push(`Total mensal: R$ ${input.totalMensal.toLocaleString('pt-BR')}`);
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
    let companyId = await findCompanyByName(input.empresa);
    if (!companyId) {
      companyId = await createCompany(input);
    }
    if (!companyId) {
      return { success: false, error: 'Erro ao criar empresa no Notion.' };
    }

    // 2. Find or create person (dedup by email)
    let personId = await findPersonByEmail(input.email);
    if (!personId) {
      personId = await createPerson(input, companyId);
    }
    if (!personId) {
      return { success: false, error: 'Erro ao criar contato no Notion.' };
    }

    // 3. Add proposal summary as a comment/block on the person's page
    const summary = buildProposalSummary(input);
    await fetch(`${NOTION_API}/blocks/${personId}/children`, {
      method: 'PATCH',
      headers: NOTION_HEADERS(),
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'divider',
            divider: {},
          },
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Proposta — ${new Date().toLocaleDateString('pt-BR')}`,
                  },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: summary },
                },
              ],
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
