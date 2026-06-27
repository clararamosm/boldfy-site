'use server';

/**
 * Server action para capturar leads do Simulador de Proposta.
 *
 * Arquitetura atual (mai/2026 — refactor "kill Notion-de-proposta"):
 *  - Proposta vive em tabela própria `proposals` no nosso Postgres.
 *  - URL pública /proposta/[uuid] resolve pra row na tabela proposals.
 *  - CRM Boldfy é source-of-truth pro lead (people + activities + proposals).
 *  - AC recebe sync via recordLeadFromForm + nota descritiva best-effort.
 *
 * Fluxo:
 *   1. Valida Zod.
 *   2. recordLeadFromForm — cria/atualiza pessoa+empresa+activity.
 *   3. createProposal — insere row na tabela proposals com snapshot do JSON.
 *   4. Atualiza people.proposal_url com a URL pública final.
 *   5. Nota descritiva no AC (best-effort, não bloqueia).
 *   6. Retorna {proposalUrl, propostaId} pro proposal-builder.tsx exibir.
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { db, people } from '@/db';
import { eq } from 'drizzle-orm';
import { adaptProposal } from '@/lib/form-adapters/proposal';
import { createProposal, type ProposalData } from '@/lib/proposals';
import { ProposalLeadSchema, parseInput } from './_schemas';
import { buildProposalUrl } from '@/lib/proposal-token';
import type { z } from 'zod';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://boldfy.com.br';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

// Tipo de input público — o que o caller (proposal-builder.tsx) constrói.
export type ProposalLeadInput = z.input<typeof ProposalLeadSchema>;

// Tipo após validação/normalização — usado internamente pelas funções helper.
type ProposalLeadData = z.infer<typeof ProposalLeadSchema>;

export type ProposalLeadResult = {
  success: boolean;
  error?: string;
  proposalUrl?: string;
  propostaId?: string;
};

/* -------------------------------------------------------------------------- */
/*  Build proposal JSON + summary                                              */
/* -------------------------------------------------------------------------- */

function buildProposalJSON(input: ProposalLeadData): ProposalData {
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

function buildProposalSummary(input: ProposalLeadData): string {
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
      growth: 'Growth (7 peças)',
      scale: 'Scale (10 peças)',
    };
    lines.push(`Design on Demand: ${planLabels[input.designPlan] ?? input.designPlan} = R$ ${fmt(input.designPrice)}/mês`);
  }

  if (input.fsTls > 0 && input.fsFreq > 0) {
    lines.push(`Modo Executivo: ${input.fsTls} executivo(s) × ${input.fsFreq}x/semana = R$ ${fmt(input.fsPrice)}/mês`);
  }

  lines.push(`Total mensal: R$ ${fmt(input.totalCurrent)}${input.savings > 0 ? ` (economia beta: R$ ${fmt(input.savings)}/mês)` : ''}`);
  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/*  Main export                                                                */
/* -------------------------------------------------------------------------- */

export async function submitProposalLead(
  rawInput: ProposalLeadInput,
): Promise<ProposalLeadResult> {
  // 1. Validação Zod — bloqueia inputs malformados antes de qualquer call.
  const parsed = parseInput(ProposalLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    // 2. recordLeadFromForm — CRM-first. Cria pessoa+empresa+activity e
    //    sincroniza pro AC. Passamos sem proposalUrl ainda — adicionamos no
    //    passo 4 depois que a row em `proposals` é criada e gera o UUID.
    const leadForCrm = adaptProposal(input, {
      proposalUrl: undefined,
      propostaNotionId: undefined,
    });
    const crmResult = await recordLeadFromForm(leadForCrm);
    if (!crmResult.ok) {
      console.error('[proposal-leads] recordLeadFromForm failed:', crmResult.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }
    const personId = crmResult.data.personId;

    // 3. createProposal — insere row na tabela proposals, retorna id (UUID).
    //    Esse UUID vira o slug da URL pública /proposta/{id}.
    const proposalJSON = buildProposalJSON(input);
    const { id: propostaId } = await createProposal({
      personId,
      data: proposalJSON,
      totalCurrent: input.totalCurrent,
      totalFull: input.totalFull,
      betaActive: input.betaActive,
    });

    // URL com token HMAC quando PROPOSAL_TOKEN_SECRET estiver configurada.
    // Sem secret = URL sem token (modo legado, ainda funcional).
    const proposalUrl = buildProposalUrl(SITE_URL, propostaId);

    // 4. UPDATE people.proposal_url — botão "Ver proposta" no perfil do CRM
    //    aponta pra última proposta gerada. Não-bloqueante: se falhar, a
    //    proposta continua acessível pelo link no AC + Notion legado.
    try {
      await db.update(people).set({ proposalUrl }).where(eq(people.id, personId));
    } catch (urlErr) {
      console.error('[proposal-leads] people.proposal_url update failed:', urlErr);
    }

    // 5. Nota descritiva no AC com link da proposta + resumo (best-effort).
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const summary = buildProposalSummary(input);
        const note = [
          `📋 Proposta gerada via Simulador`,
          ``,
          summary,
          ``,
          `🔗 Ver proposta: ${proposalUrl}`,
          ``,
          `— Tracking —`,
          `Origem no site: ${input.origem}`,
          input.utm_source ? `utm_source: ${input.utm_source}` : '',
          input.utm_medium ? `utm_medium: ${input.utm_medium}` : '',
          input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        await addNoteToContact(acContactId, note);
      }
    } catch (acErr) {
      console.error('[proposal-leads] AC note error (non-blocking):', acErr);
    }

    return {
      success: true,
      proposalUrl,
      propostaId,
    };
  } catch (error) {
    console.error('[proposal-leads] Error:', error);
    return { success: false, error: 'Erro ao salvar a proposta.' };
  }
}
