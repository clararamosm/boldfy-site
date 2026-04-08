'use server';

// Server action to send Demo leads to Notion (Company and Person)

const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Fallback to the exact IDs provided by the user if environment variables are not set
const NOTION_PERSON_DB_ID =
  process.env.NOTION_PERSON_DB_ID || 'e3841003fdc34b9e9d973bd62d39f5bb';
const NOTION_COMPANY_DB_ID =
  process.env.NOTION_COMPANY_DB_ID || '696f9f291beb40919f9d93a2de939c45';

export type DemoLeadInput = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  funcionarios: string;
};

export async function sendDemoLeadToNotion(
  input: DemoLeadInput,
): Promise<{ success: boolean; error?: string }> {
  if (!NOTION_API_KEY || !NOTION_PERSON_DB_ID || !NOTION_COMPANY_DB_ID) {
    console.error('Notion credentials or Database IDs not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    // 1. Create Company entry in COMPANY_DB
    const companyResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_COMPANY_DB_ID },
        properties: {
          Nome: {
            title: [{ text: { content: input.empresa } }],
          },
          'Porte (funcionários)': {
             select: { name: input.funcionarios }
          },
          'Botão gatilho do formulário': {
             select: { name: 'Popup Demo' }
          }
        },
      }),
    });

    if (!companyResponse.ok) {
      const errorData = await companyResponse.json().catch(() => ({}));
      console.error('Error creating Company in Notion:', companyResponse.status, errorData);
      return { success: false, error: 'Erro ao criar a empresa no Notion.' };
    }

    const companyData = await companyResponse.json();
    const newCompanyId = companyData.id;

    // 2. Create Person entry in PERSON_DB, linked to the newly created Company
    const personResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
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
            relation: [{ id: newCompanyId }],
          },
          // Origem helps trace back where they came from
          Sinais: {
            relation: [] // We dont enforce it unless we have an ID for 'Demo Form' in signs
          }
        },
      }),
    });

    if (!personResponse.ok) {
      const errorData = await personResponse.json().catch(() => ({}));
      console.error('Error creating Person in Notion:', personResponse.status, errorData);
      return { success: false, error: 'Erro ao criar o contato no Notion.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending demo lead to Notion:', error);
    return { success: false, error: 'Erro de conexão com o Notion.' };
  }
}
