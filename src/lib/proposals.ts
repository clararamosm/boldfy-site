/**
 * Lib das propostas geradas pelo Simulador (/proposta-builder).
 *
 * Antes (mai/2026): proposta era criada como page no Notion DB "Propostas",
 * e a rota /proposta/[id] lia de lá. Agora vive em tabela própria `proposals`
 * no nosso Postgres — eliminamos a dependência do Notion pro fluxo de lead.
 *
 * Esse arquivo concentra:
 *  - Tipo canônico `ProposalData` (estrutura do snapshot do simulador,
 *    veio do antigo notion-crm.ts).
 *  - `getProposalById(id)` — consulta pra rota /proposta/[id].
 *  - `createProposal({...})` — insert chamado pelo proposal-leads action.
 */

import { db, proposals } from '@/db';
import type { Proposal } from '@/db';
import { eq } from 'drizzle-orm';

/* -------------------------------------------------------------------------- */
/*  Tipo canônico do payload da proposta                                       */
/* -------------------------------------------------------------------------- */
/**
 * Snapshot completo do payload do simulador no momento da geração.
 *
 * `version` controla evolução do schema — qualquer breaking change incrementa
 * o número e o reader (route handler) tem que ramificar baseado nele pra
 * manter compat com propostas antigas armazenadas no DB.
 *
 * Mantido em sincronia com o shape gerado por `buildProposalJSON` em
 * src/app/actions/proposal-leads.ts.
 */
export interface ProposalData {
  version: number;
  createdAt: string;
  lead: {
    nome: string;
    email: string;
    empresa: string;
    cargo: string;
  };
  betaActive: boolean;
  platform: {
    enabled: boolean;
    seats: number;
    perSeatFull: number;
    perSeatBeta: number;
  };
  design: {
    enabled: boolean;
    pack: string;
    price: number;
  };
  fullService: {
    enabled: boolean;
    tls: number;
    freq: number;
    price: number;
  };
  totals: {
    current: number;
    full: number;
    savings: number;
  };
  team: { text: string; dedicated: boolean }[];
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Busca a proposta por UUID (id na URL pública /proposta/[id]).
 * Retorna null quando não existe — caller decide entre 404 e fallback.
 *
 * Sem cache aqui: a rota /proposta/[id] já tem `revalidate = 3600` no nível
 * do route handler. Cache mais agressivo aqui pode mascarar updates.
 */
export async function getProposalById(id: string): Promise<Proposal | null> {
  try {
    const rows = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (err) {
    console.error('[proposals] getProposalById failed for', id, err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export type CreateProposalInput = {
  personId: string;
  data: ProposalData;
  totalCurrent: number;
  totalFull: number;
  betaActive: boolean;
};

/**
 * Insere proposta nova e retorna o id (UUID) — usado pra montar a URL
 * compartilhável /proposta/{id} (com token HMAC opcional).
 *
 * Erros propagam (caller decide o que fazer) — diferente de getProposalById,
 * uma falha aqui é crítica: o lead vai ver o submit "falhou" e tentar de novo.
 */
export async function createProposal(input: CreateProposalInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(proposals)
    .values({
      personId: input.personId,
      proposalData: input.data,
      totalCurrent: input.totalCurrent,
      totalFull: input.totalFull,
      betaActive: input.betaActive,
    })
    .returning({ id: proposals.id });

  if (!row?.id) {
    throw new Error('[proposals] insert returned no id');
  }

  return { id: row.id };
}
