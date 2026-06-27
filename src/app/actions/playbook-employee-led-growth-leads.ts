'use server';

/**
 * Server action pro form do Playbook de Employee-Led Growth
 * (LP `/ferramentas/playbook-employee-led-growth`).
 *
 * Pipeline (spec §8.2):
 *   1. Zod validate — bloqueia inputs malformados ANTES de qualquer call.
 *   2. Honeypot — campo `website` preenchido = bot, descarta silenciosamente
 *      (retorna success fake pra não dar feedback comportamental ao bot).
 *   3. Rate limit — 3 submits/hora por IP via Vercel KV. Limite estourou =
 *      mensagem direta ao usuário.
 *   4. Adapter — payload do form → ClassifiedLead canônico.
 *   5. recordLeadFromForm — faz tudo no CRM (upsertCompany → upsertPerson →
 *      logActivity → classifyPersonBySourceMethod → syncContact AC).
 *   6. Gera slug + template_key + rendered_data e cria row em playbook_outputs.
 *   7. Best-effort: nota descritiva no AC com contexto rápido pra equipe.
 *   8. Retorna playbookUrl pro client redirecionar pra `/playbook/[slug]`.
 *
 * Naming: arquivo + função espelham o slug da URL pública. Ver AGENTS.md.
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth.md
 */

import { headers } from 'next/headers';
import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptPlaybookEmployeeLedGrowth } from '@/lib/form-adapters/playbook-employee-led-growth';
import { checkRateLimit } from '@/lib/rate-limit';
import { generatePlaybookSlug } from '@/lib/playbook/slug';
import { resolveTemplateKey, renderPlaybookData } from '@/lib/playbook/render';
import type { PlaybookQuizData } from '@/lib/playbook/render';
import { db, playbookOutputs } from '@/db';
import { PlaybookEmployeeLedGrowthLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type PlaybookEmployeeLedGrowthLeadInput =
  z.input<typeof PlaybookEmployeeLedGrowthLeadSchema>;

export type SubmitPlaybookResult =
  | { success: true; playbookUrl: string }
  | { success: false; error: string };

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                 */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MAX = 3;            // 3 submits por janela
const RATE_LIMIT_WINDOW_SEC = 3600;  // 1 hora
const SLUG_COLLISION_RETRIES = 2;    // chance ~36^-12 de falhar 2x — improvável

/* -------------------------------------------------------------------------- */
/*  Helper: cria playbook_outputs row com retry em colisão de slug            */
/* -------------------------------------------------------------------------- */

async function createPlaybookOutput(params: {
  personId: string;
  companyId: string | undefined;
  quizData: PlaybookQuizData;
  empresa: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const templateKey = resolveTemplateKey(params.quizData);
  const renderedData = renderPlaybookData(params.quizData, templateKey, params.empresa);

  for (let attempt = 0; attempt <= SLUG_COLLISION_RETRIES; attempt++) {
    const slug = generatePlaybookSlug(params.empresa);
    try {
      await db.insert(playbookOutputs).values({
        slug,
        personId: params.personId,
        companyId: params.companyId,
        quizData: params.quizData,
        templateKey,
        renderedData,
      });
      return { ok: true, slug };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // unique constraint violation no slug — retry com novo hash
      if (msg.includes('unique') || msg.includes('duplicate key')) {
        console.warn(`[playbook-leads] slug collision on attempt ${attempt + 1}: ${slug}`);
        continue;
      }
      // Outro erro = bug. Propaga.
      console.error('[playbook-leads] createPlaybookOutput unexpected:', msg);
      return { ok: false, error: msg };
    }
  }
  return { ok: false, error: 'Falha ao gerar slug único após retries' };
}

/* -------------------------------------------------------------------------- */
/*  submitPlaybookEmployeeLedGrowthLead                                        */
/* -------------------------------------------------------------------------- */

export async function submitPlaybookEmployeeLedGrowthLead(
  rawInput: PlaybookEmployeeLedGrowthLeadInput,
): Promise<SubmitPlaybookResult> {
  /* ---------- 1. Validação Zod ---------- */
  const parsed = parseInput(PlaybookEmployeeLedGrowthLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  /* ---------- 2. Honeypot ---------- */
  // Campo `website` é hidden no HTML — humanos não veem nem tabulam. Bots
  // simples preenchem qualquer input visível ao DOM. Se vier preenchido,
  // engana o bot retornando success fake (sem URL real) — evita análise
  // comportamental por parte de scrapers.
  if (input.website && input.website.length > 0) {
    console.warn('[playbook-leads] honeypot triggered — dropping silently');
    return { success: true, playbookUrl: '/' };
  }

  /* ---------- 3. Rate limit ---------- */
  try {
    const hdrs = await headers();
    const fwd = hdrs.get('x-forwarded-for') ?? '';
    const ip = fwd.split(',')[0]?.trim() || 'unknown';
    const limit = await checkRateLimit(
      `playbook:${ip}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_SEC,
    );
    if (!limit.ok) {
      return {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.',
      };
    }
  } catch (err) {
    // headers() pode falhar em test env — não bloqueia fluxo
    console.warn('[playbook-leads] rate limit check failed (non-blocking):', err);
  }

  try {
    /* ---------- 4. Adapter ---------- */
    const lead = adaptPlaybookEmployeeLedGrowth(input);

    /* ---------- 5. recordLeadFromForm (CRM completo) ---------- */
    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[playbook-leads] recordLeadFromForm failed:', result.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    /* ---------- 6. playbook_outputs (página personalizada) ---------- */
    const quizData: PlaybookQuizData = {
      porteColaboradores: input.porteColaboradores,
      // Compromisso 3 ativos (jun/2026): só vem populado pra porte 4-20.
      // Snapshot do output usa pra decidir se mostra explicação do piso.
      porteCompromisso5Ativos: input.porteCompromisso5Ativos,
      cargoSenioridade: input.cargoSenioridade,
      cargoArea: input.cargoArea,
      setor: input.setor,
      vozAtual: input.vozAtual,
      tentativasAnteriores: input.tentativasAnteriores,
      doresPrincipais: input.doresPrincipais,
      budgetStatus: input.budgetStatus,
      sponsorshipLideranca: input.sponsorshipLideranca,
      // Gasto em ads (jun/2026, opcional): alimenta o gráfico Ads vs ELG.
      gastoMensalAds: input.gastoMensalAds,
      observacoesLivres: input.observacoesLivres,
    };

    const output = await createPlaybookOutput({
      personId: result.data.personId,
      companyId: result.data.companyId,
      quizData,
      empresa: input.empresa,
    });

    if (!output.ok) {
      // Lead já está salvo no CRM, mas a página /playbook não foi criada.
      // Reportamos erro pro usuário pra ele tentar de novo — segundo submit
      // vai dar match no email existente e criar o playbook output.
      return {
        success: false,
        error: 'Geramos seu contato mas falhamos ao montar a página. Tente novamente em alguns segundos.',
      };
    }

    /* ---------- 7. (Best-effort) Nota descritiva no AC ---------- */
    // Roda só se AC já tem o contato — não criamos contato aqui (já feito).
    // Falha aqui não impacta UX nem CRM (continua salvo).
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const note = [
          `🗺️  Playbook de Employee-Led Growth gerado`,
          ``,
          `Página: https://boldfy.com.br/playbook/${output.slug}`,
          ``,
          `Nome: ${input.nome}`,
          `Empresa: ${input.empresa}`,
          `Cargo: ${labelSeniority(input.cargoSenioridade)} de ${labelArea(input.cargoArea)}`,
          `Porte: ${input.porteColaboradores} colaboradores`,
          `Setor: ${input.setor}`,
          ``,
          `— Diagnóstico —`,
          `Voz atual: ${input.vozAtual}`,
          `Tentativas anteriores: ${input.tentativasAnteriores}`,
          `Dores principais: ${input.doresPrincipais.join(', ')}`,
          // P9 removida na curadoria mai/2026 — só inclui na nota se vier (compat retroativa).
          input.resultadosPrioritarios && input.resultadosPrioritarios.length > 0
            ? `Resultados prioritários: ${input.resultadosPrioritarios.join(', ')}`
            : '',
          `Budget: ${input.budgetStatus}`,
          `Sponsorship liderança: ${input.sponsorshipLideranca}`,
          input.observacoesLivres ? `\n💬 ${input.observacoesLivres}` : '',
          ``,
          `— Tracking —`,
          `Origem: ${input.origem || 'LP Playbook ELG'}`,
          input.utm_source ? `utm_source: ${input.utm_source}` : '',
          input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
          input.utm_content ? `utm_content: ${input.utm_content}` : '',
          input.utm_term ? `utm_term: ${input.utm_term}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acContactId, note);
      }
    } catch (err) {
      console.error('[playbook-leads] Error adding note (non-blocking):', err);
    }

    /* ---------- 8. Sucesso ---------- */
    return {
      success: true,
      playbookUrl: `/playbook/${output.slug}`,
    };
  } catch (error) {
    console.error('[playbook-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}

/* -------------------------------------------------------------------------- */
/*  Pretty labels (replica do adapter — não exportar pra fora)                */
/* -------------------------------------------------------------------------- */

function labelSeniority(s: PlaybookEmployeeLedGrowthLeadInput['cargoSenioridade']): string {
  return ({
    analista: 'Analista',
    coordenador: 'Coordenador',
    gerente: 'Gerente',
    diretor: 'Diretor',
    c_level: 'C-Level',
  } as const)[s];
}

function labelArea(a: PlaybookEmployeeLedGrowthLeadInput['cargoArea']): string {
  return ({
    marketing: 'Marketing',
    growth: 'Growth',
    vendas: 'Vendas',
    rh: 'RH / People',
    employer_branding: 'Employer Branding',
    comunicacao: 'Comunicação',
    outro: 'Outro',
  } as const)[a];
}
