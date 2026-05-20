'use server';

/**
 * Server action para capturar leads da LP do Case Semrush ELG
 * (/case-semrush).
 *
 * Fluxo CRM-first (idêntico ao report-leads.ts):
 *  - ClassifiedLead canônico via adaptCase → recordLeadFromForm grava no CRM
 *    ANTES de tentar AC. Se AC falhar, lead já está salvo no Postgres.
 *  - syncContact pro AC roda DENTRO de recordLeadFromForm (com try/catch que
 *    emite activity ac_sync_failed).
 *  - Nota descritiva no AC pra equipe ver contexto rápido (best-effort, não
 *    bloqueia em caso de falha).
 *  - Cadência do AC pra tag 'Form: Case Semrush ELG' ainda NÃO está
 *    configurada (Clara cria depois). Por enquanto, o lead só recebe o PDF
 *    pelo botão de download na tela de sucesso da LP.
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptCase } from '@/lib/form-adapters/case';
import { CaseLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type CaseLeadInput = z.input<typeof CaseLeadSchema>;

export async function sendCaseLead(
  rawInput: CaseLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // 1. Validação Zod — bloqueia inputs malformados antes de qualquer call.
  const parsed = parseInput(CaseLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    // 2. Adapter — payload do form → ClassifiedLead canônico.
    const lead = adaptCase(input);

    // 3. recordLeadFromForm faz TUDO: upsertCompany → upsertPerson →
    //    logActivity (form_submit_case + field_changed + ac_sync_*) →
    //    classifyPersonBySourceMethod → syncContact (com fallback).
    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[case-leads] recordLeadFromForm failed:', result.error);
      return { success: false, error: 'Erro ao salvar seu contato. Tente novamente.' };
    }

    // 4. (Best-effort) Nota descritiva no AC pra equipe ver contexto rápido.
    //    Roda só se AC já tem contato — não criamos contato aqui (já feito).
    //    Falha aqui não impacta UX nem CRM (continua salvo).
    try {
      const acContactId = await findContactByEmail(input.email);
      if (acContactId) {
        const intencaoLabel =
          input.intencaoUso === 'marca-empresa'
            ? 'Marca da empresa onde trabalha'
            : input.intencaoUso === 'marca-clientes'
              ? 'Marca dos clientes (agência/consultor)'
              : 'Marca pessoal (criador/autônomo)';
        const isB2B = input.intencaoUso === 'marca-empresa';
        const note = [
          `📑 Download do Case Semrush Employee-Led Growth`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          `Intenção: ${intencaoLabel}`,
          isB2B && input.empresa ? `Empresa: ${input.empresa.trim()}` : '',
          isB2B && input.cargo ? `Cargo: ${input.cargo.trim()}` : '',
          isB2B && input.tamanhoEmpresa ? `Tamanho da empresa: ${input.tamanhoEmpresa}` : '',
          `Opt-in newsletter: ${input.newsletterOptIn ? 'SIM' : 'não'}`,
          ``,
          `— Tracking —`,
          `Origem: ${input.origem || 'LP Case Semrush ELG'}`,
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
      console.error('[case-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[case-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
