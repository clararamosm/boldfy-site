'use server';

/**
 * Server action para capturar leads do report Algoritmo LinkedIn 2026
 * (LP /algoritmo-linkedin).
 *
 * Naming: arquivo + função espelham o slug da URL pública. Não usar termos
 * genéricos tipo 'report' — quando o segundo material chegar, deixa de
 * identificar de qual estamos falando. Ver AGENTS.md.
 *
 * Task 1 (mai/2026 — spec crm-source-of-truth):
 *  - Fluxo CRM-first: ClassifiedLead canônico via adapter → recordLeadFromForm
 *    grava no CRM ANTES de tentar AC. Se AC falhar, lead já está salvo.
 *  - syncContact pro AC roda DENTRO de recordLeadFromForm (com try/catch que
 *    emite activity ac_sync_failed). Esse arquivo só lida com Zod + nota
 *    no AC pra contexto da equipe (a nota é opcional, não bloqueia).
 *  - PDF do report é entregue na tela de sucesso + email transacional via
 *    cadência do AC (gate: tag 'Form: Algoritmo LinkedIn 2026').
 */

import { addNoteToContact, findContactByEmail } from '@/lib/activecampaign';
import { recordLeadFromForm } from '@/lib/crm';
import { adaptAlgoritmoLinkedin } from '@/lib/form-adapters/algoritmo-linkedin';
import { AlgoritmoLinkedinLeadSchema, parseInput } from './_schemas';
import type { z } from 'zod';

export type AlgoritmoLinkedinLeadInput = z.input<typeof AlgoritmoLinkedinLeadSchema>;

export async function submitAlgoritmoLinkedinLead(
  rawInput: AlgoritmoLinkedinLeadInput,
): Promise<{ success: boolean; error?: string }> {
  // 1. Validação Zod — bloqueia inputs malformados antes de qualquer call.
  const parsed = parseInput(AlgoritmoLinkedinLeadSchema, rawInput);
  if (!parsed.ok) {
    return { success: false, error: 'Dados inválidos. Verifique o formulário.' };
  }
  const input = parsed.data;

  try {
    // 2. Adapter — payload do form → ClassifiedLead canônico.
    const lead = adaptAlgoritmoLinkedin(input);

    // 3. recordLeadFromForm faz TUDO: upsertCompany → upsertPerson →
    //    logActivity (form_submit + field_changed + ac_sync_*) →
    //    classifyPersonBySourceMethod → syncContact (com fallback).
    const result = await recordLeadFromForm(lead);
    if (!result.ok) {
      console.error('[algoritmo-linkedin-leads] recordLeadFromForm failed:', result.error);
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
        const empresaInformada =
          input.intencaoUso === 'marca-empresa' ? input.empresa?.trim() || '' : '';
        const note = [
          `📥 Download do Report Algoritmo LinkedIn 2026`,
          ``,
          `Nome: ${input.nome}`,
          `Email: ${input.email}`,
          `Intenção: ${intencaoLabel}`,
          empresaInformada ? `Empresa: ${empresaInformada}` : '',
          `Opt-in newsletter: ${input.newsletterOptIn ? 'SIM' : 'não'}`,
          ``,
          `— Tracking —`,
          `Origem: ${input.origem || 'LP Algoritmo LinkedIn'}`,
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
      console.error('[algoritmo-linkedin-leads] Error adding note (non-blocking):', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[algoritmo-linkedin-leads] Error:', error);
    return { success: false, error: 'Erro de conexão. Tente novamente.' };
  }
}
