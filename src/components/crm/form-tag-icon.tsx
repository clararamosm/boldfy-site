/**
 * Ícone de tag de formulário (CRM).
 *
 * Fonte única dos ícones usados nas tags/chips de formulário — substitui os
 * emojis antigos (decisão Clara, mai/2026). Usado na aba Formulários
 * (filtros + coluna da tabela) e nas tags de form de cada pessoa
 * (FormsSubmittedChipList + lead detail).
 *
 * Lógica "um ícone por tipo" (Clara):
 *  - Gerais (Demo / Beta / Proposta / Todos) → cada um com seu próprio ícone.
 *  - Materiais ricos (Algoritmo LinkedIn report + Case Semrush) → MESMO ícone
 *    de material (FileText). O label diz qual é — o ícone identifica que é
 *    material rico.
 *  - Ferramentas (Playbook TLG) → ícone de ferramenta (Wrench).
 *  - linkedin_extension → ícone de link (captura interna, não é form do site).
 *
 * Ícones Lucide outline (padrão da identidade Boldfy — nunca solid).
 */

'use client';

import {
  Users,
  Target,
  FlaskConical,
  Briefcase,
  FileText,
  Wrench,
  Link2,
  File,
  BellOff,
  CalendarPlus,
} from 'lucide-react';

/** Chave semântica de ícone — agrupa por TIPO, não por form individual. */
export type FormTagIconKey =
  | 'all'
  | 'demo'
  | 'beta'
  | 'proposta'
  | 'material'
  | 'ferramenta'
  | 'evento'
  | 'linkedin'
  | 'unsubscribed'
  | 'fallback';

const ICONS: Record<FormTagIconKey, typeof Users> = {
  all: Users,
  demo: Target,
  beta: FlaskConical,
  proposta: Briefcase,
  material: FileText,
  ferramenta: Wrench,
  evento: CalendarPlus,
  linkedin: Link2,
  unsubscribed: BellOff,
  fallback: File,
};

/**
 * activities.type (`form_submit_*`) ou 'all' → chave de ícone.
 * Usado pelos chips de filtro e pela coluna "Formulários" da tabela.
 */
export function iconKeyForFormType(formType: string): FormTagIconKey {
  switch (formType) {
    case 'all': return 'all';
    case 'form_submit_demo': return 'demo';
    case 'form_submit_beta': return 'beta';
    case 'form_submit_proposta': return 'proposta';
    case 'form_submit_eventosbh': return 'evento';
    case 'form_submit_algoritmo_linkedin':
    case 'form_submit_case_semrush':
      return 'material';
    case 'form_submit_playbook_team_led_growth':
      return 'ferramenta';
    default: return 'fallback';
  }
}

/**
 * Slug de people.forms_submitted (kebab/snake-case) → chave de ícone.
 * Usado nas tags de form de cada pessoa.
 */
export function iconKeyForFormSlug(slug: string): FormTagIconKey {
  switch (slug) {
    case 'demo': return 'demo';
    case 'beta': return 'beta';
    case 'proposta': return 'proposta';
    case 'eventosbh': return 'evento';
    case 'algoritmo-linkedin':
    case 'case-semrush':
      return 'material';
    case 'playbook-team-led-growth':
      return 'ferramenta';
    case 'linkedin_extension': return 'linkedin';
    default: return 'fallback';
  }
}

type Props = {
  name: FormTagIconKey;
  size?: number;
};

/** Renderiza o ícone Lucide outline pra uma chave semântica. Herda a cor (currentColor). */
export function FormTagIcon({ name, size = 13 }: Props) {
  const Icon = ICONS[name] ?? File;
  return <Icon size={size} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />;
}
