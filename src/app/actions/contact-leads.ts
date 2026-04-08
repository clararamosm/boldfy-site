'use server';

// Server action to send contact form leads to Notion

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_CONTACT_DB_ID = process.env.NOTION_CONTACT_DB_ID;

type ContactLeadInput = {
  nome: string;
  email: string;
  telefone?: string;
  empresa: string;
  colaboradores?: string;
  mensagem?: string;
};

export async function sendContactLeadToNotion(
  input: ContactLeadInput,
): Promise<{ success: boolean; error?: string }> {
  if (!NOTION_API_KEY || !NOTION_CONTACT_DB_ID) {
    console.error('Notion contact leads credentials not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    // Discover database schema
    const dbResponse = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_CONTACT_DB_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      },
    );

    let dbProperties: Record<string, { type: string }> = {};
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      dbProperties = dbData.properties || {};
    }

    // Title is always required by Notion — use Nome as title
    const properties: Record<string, unknown> = {
      Nome: {
        title: [{ text: { content: input.nome } }],
      },
    };

    // Helper to add properties only if they exist in the database
    const addRichTextIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'rich_text') {
        properties[name] = {
          rich_text: [{ text: { content: value.slice(0, 2000) } }],
        };
      }
    };

    const addEmailIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'email') {
        properties[name] = { email: value };
      }
    };

    const addPhoneIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'phone_number') {
        properties[name] = { phone_number: value };
      }
    };

    const addSelectIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'select') {
        properties[name] = { select: { name: value } };
      }
    };

    addEmailIfExists('Email', input.email);
    if (input.telefone) addPhoneIfExists('Telefone', input.telefone);
    addRichTextIfExists('Empresa', input.empresa);
    if (input.colaboradores)
      addSelectIfExists('Colaboradores', input.colaboradores);
    if (input.mensagem) addRichTextIfExists('Mensagem', input.mensagem);
    addSelectIfExists('Status', 'Novo');
    addSelectIfExists('Origem', 'Site - Contato');

    if (dbProperties['Data']?.type === 'date') {
      properties['Data'] = {
        date: { start: new Date().toISOString().split('T')[0] },
      };
    }

    // Page content body
    const contentBlocks = [
      {
        object: 'block' as const,
        type: 'heading_3' as const,
        heading_3: {
          rich_text: [
            {
              type: 'text' as const,
              text: { content: `Lead Contato: ${input.nome}` },
            },
          ],
        },
      },
      {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: `📧 ${input.email}${input.telefone ? ` | 📱 ${input.telefone}` : ''} | 🏢 ${input.empresa}${input.colaboradores ? ` (${input.colaboradores} colaboradores)` : ''}`,
              },
            },
          ],
        },
      },
      {
        object: 'block' as const,
        type: 'divider' as const,
        divider: {},
      },
      {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: `📅 ${new Date().toLocaleDateString('pt-BR')}${input.mensagem ? `\n\n💬 ${input.mensagem}` : ''}`,
              },
            },
          ],
        },
      },
    ];

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_CONTACT_DB_ID },
        properties,
        children: contentBlocks,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        'Notion Contact Lead API error:',
        response.status,
        errorData,
      );
      return {
        success: false,
        error: `Erro ao enviar para o Notion (${response.status}).`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending contact lead to Notion:', error);
    return { success: false, error: 'Erro de conexão com o Notion.' };
  }
}
