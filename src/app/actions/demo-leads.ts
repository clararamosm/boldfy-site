'use server';

/**
 * Server action to send Demo leads to Notion CRM + ActiveCampaign.
 *
 * Deduplication:
 * - Searches Person DB by email first. If found, appends interaction.
 * - Searches Company DB by name first. If found, reuses.
 * - Creates new entries only when needed.
 */

import { syncContact, addNoteToContact } from '@/lib/activecampaign';

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

export type DemoLeadInput = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  funcionarios: string;
  origem?: string;
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

/* -------------------------------------------------------------------------- */
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

export async function sendDemoLeadToNotion(
  input: DemoLeadInput,
): Promise<{ success: boolean; error?: string }> {
  if (!NOTION_API_KEY || !NOTION_PERSON_DB_ID || !NOTION_COMPANY_DB_ID) {
    console.error('Notion credentials or Database IDs not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    // 1. Find or create Company (minimal — only title)
    let companyId = await findCompanyByName(input.empresa);
    if (!companyId) {
      const companyResponse = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({
          parent: { database_id: NOTION_COMPANY_DB_ID },
          properties: {
            Nome: {
              title: [{ text: { content: input.empresa } }],
            },
          },
        }),
      });

      if (!companyResponse.ok) {
        const errText = await companyResponse.text().catch(() => '');
        console.error('[demo-leads] Error creating Company:', companyResponse.status, errText);
        // Continue without company — don't block the whole flow
        companyId = null;
      } else {
        const companyData = await companyResponse.json();
        companyId = companyData.id;
      }
    }

    // 2. Find or create Person (dedup by email)
    let personId = await findPersonByEmail(input.email);

    if (!personId) {
      const properties: Record<string, unknown> = {
        Nome: { title: [{ text: { content: input.nome } }] },
        Email: { email: input.email },
      };
      if (input.telefone) {
        properties['WhatsApp'] = { phone_number: input.telefone };
      }
      if (input.cargo) {
        properties['Cargo'] = { rich_text: [{ text: { content: input.cargo } }] };
      }
      if (companyId) {
        properties['Empresa'] = { relation: [{ id: companyId }] };
      }

      const personResponse = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({
          parent: { database_id: NOTION_PERSON_DB_ID },
          properties,
        }),
      });

      if (!personResponse.ok) {
        const errText = await personResponse.text().catch(() => '');
        console.error('[demo-leads] Error creating Person:', personResponse.status, errText);
        return { success: false, error: 'Erro ao criar o contato no Notion.' };
      }

      const personData = await personResponse.json();
      personId = personData.id;
    }

    // 3. Log interaction as content block on person's page
    const origemLabel = input.origem || 'Popup Demo';
    await fetch(`${NOTION_API}/blocks/${personId}/children`, {
      method: 'PATCH',
      headers: NOTION_HEADERS(),
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `${origemLabel} — ${new Date().toLocaleDateString('pt-BR')} — ${input.nome} (${input.email})`,
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    // 4. Sync to ActiveCampaign (non-blocking)
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags: string[] = ['Demo Agendada'];
    if (input.origem) acTags.push(input.origem);
    if (input.funcionarios) acTags.push(`porte:${input.funcionarios}`);

    syncContact({
      email: input.email,
      firstName,
      lastName,
      phone: input.telefone,
      empresa: input.empresa,
      cargo: input.cargo,
      origem: origemLabel,
      tags: acTags,
    })
      .then((acContactId) => {
        if (acContactId) {
          const note = [
            `📅 Demo agendada via ${origemLabel}`,
            `Nome: ${input.nome}`,
            `Email: ${input.email}`,
            `WhatsApp: ${input.telefone}`,
            `Cargo: ${input.cargo}`,
            `Empresa: ${input.empresa}`,
            `Porte: ${input.funcionarios}`,
          ].join('\n');
          addNoteToContact(acContactId, note);
        }
      })
      .catch((err) => {
        console.error('[demo-leads] ActiveCampaign sync error:', err);
      });

    return { success: true };
  } catch (error) {
    console.error('[demo-leads] Error:', error);
    return { success: false, error: 'Erro de conexão com o Notion.' };
  }
}
