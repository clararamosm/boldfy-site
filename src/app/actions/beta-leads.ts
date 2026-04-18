'use server';

// Server action to send beta test leads to Notion + ActiveCampaign

import { syncContact, addNoteToContact } from '@/lib/activecampaign';
import { buildACTags } from '@/lib/ac-tags';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_BETA_DB_ID = process.env.NOTION_BETA_DB_ID;

type BetaLeadInput = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  setor: string;
  colaboradores: string;
  objetivoPrincipal: string;
  comoConheceu: string;
  observacoes?: string;
  origem?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export async function sendBetaLeadToNotion(input: BetaLeadInput): Promise<{ success: boolean; error?: string }> {
  if (!NOTION_API_KEY || !NOTION_BETA_DB_ID) {
    console.error('Notion beta leads credentials not configured');
    return { success: false, error: 'Integração com Notion não configurada.' };
  }

  try {
    // Discover database schema
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_BETA_DB_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    });

    let dbProperties: Record<string, { type: string }> = {};
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      dbProperties = dbData.properties || {};
    }

    // Title is always required by Notion — use Nome as title
    const properties: Record<string, unknown> = {
      'Nome': {
        title: [{ text: { content: input.nome } }],
      },
    };

    // Helper to add properties only if they exist in the database
    const addSelectIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'select') {
        properties[name] = { select: { name: value } };
      }
    };

    const addRichTextIfExists = (name: string, value: string) => {
      if (dbProperties[name]?.type === 'rich_text') {
        properties[name] = { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
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

    addEmailIfExists('Email', input.email);
    addPhoneIfExists('Telefone', input.telefone);
    addSelectIfExists('Cargo', input.cargo);
    addRichTextIfExists('Empresa', input.empresa);
    addSelectIfExists('Setor', input.setor);
    addSelectIfExists('Colaboradores', input.colaboradores);
    addSelectIfExists('Objetivo Principal', input.objetivoPrincipal);
    addSelectIfExists('Como Conheceu', input.comoConheceu);
    addSelectIfExists('Status', 'Novo');

    if (input.observacoes) {
      addRichTextIfExists('Observações', input.observacoes);
    }

    if (dbProperties['Data']?.type === 'date') {
      properties['Data'] = { date: { start: new Date().toISOString().split('T')[0] } };
    }

    // Page content body
    const contentBlocks = [
      { object: 'block' as const, type: 'heading_3' as const, heading_3: { rich_text: [{ type: 'text' as const, text: { content: `Lead Beta: ${input.nome}` } }] } },
      { object: 'block' as const, type: 'paragraph' as const, paragraph: { rich_text: [{ type: 'text' as const, text: { content: `📧 ${input.email} | 📱 ${input.telefone} | 🏢 ${input.empresa} (${input.setor})` } }] } },
      { object: 'block' as const, type: 'paragraph' as const, paragraph: { rich_text: [{ type: 'text' as const, text: { content: `👤 ${input.cargo} | 👥 ${input.colaboradores} colaboradores | 🎯 ${input.objetivoPrincipal} | 📍 ${input.comoConheceu}` } }] } },
      { object: 'block' as const, type: 'divider' as const, divider: {} },
      { object: 'block' as const, type: 'paragraph' as const, paragraph: { rich_text: [{ type: 'text' as const, text: { content: `📅 ${new Date().toLocaleDateString('pt-BR')}${input.observacoes ? ` | 💬 ${input.observacoes}` : ''}` } }] } },
    ];

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_BETA_DB_ID },
        properties,
        children: contentBlocks,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Notion Beta Lead API error:', response.status, errorData);
      return { success: false, error: `Erro ao enviar para o Notion (${response.status}).` };
    }

    // Sync to ActiveCampaign (non-blocking — lead já está salvo no Notion)
    const nameParts = input.nome.trim().split(/\s+/);
    const firstName = nameParts[0] ?? input.nome;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const acTags = buildACTags({
      formType: 'Beta Program',
      origem: input.origem || 'Beta Test',
      utms: {
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
      },
      extraTags: [
        'Beta Tester',
        input.setor ? `Setor: ${input.setor}` : null,
        input.colaboradores ? `Porte: ${input.colaboradores}` : null,
        input.objetivoPrincipal ? `Objetivo: ${input.objetivoPrincipal}` : null,
      ].filter((t): t is string => !!t),
    });

    // AWAIT essencial em serverless — fire-and-forget e descartado quando
    // a funcao retorna, entao leads nao chegavam no AC antes desse fix.
    try {
      const acId = await syncContact({
        email: input.email,
        firstName,
        lastName,
        phone: input.telefone,
        empresa: input.empresa,
        cargo: input.cargo,
        origem: input.origem || 'Beta Test',
        tags: acTags,
      });

      if (acId) {
        const note = [
          `🧪 Inscrição no Programa Beta`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          `WhatsApp: ${input.telefone}`,
          `Cargo: ${input.cargo}`,
          `Empresa: ${input.empresa}`,
          `Setor: ${input.setor}`,
          `Colaboradores: ${input.colaboradores}`,
          `Objetivo principal: ${input.objetivoPrincipal}`,
          `Como conheceu: ${input.comoConheceu}`,
          input.observacoes ? `\n💬 ${input.observacoes}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acId, note);
      } else {
        console.warn('[beta-leads] AC syncContact returned null — verificar env vars.');
      }
    } catch (err) {
      console.error('[beta-leads] AC sync error (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending beta lead to Notion:', error);
    return { success: false, error: 'Erro de conexão com o Notion.' };
  }
}
