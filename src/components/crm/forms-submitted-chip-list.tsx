/**
 * Lista de chips dos forms que uma pessoa preencheu.
 *
 * Spec §8 / §13: box na sidebar do lead detail. Cada chip linka via anchor
 * pra activity correspondente na timeline (`#form-{slug}`), permitindo
 * scroll rápido pro registro do form. Funciona como componente reusável
 * pra futura UI de empresas (agregação dos forms de todas as pessoas
 * linkadas) sem duplicação.
 *
 * Render vazio = retorna null (não polui sidebar quando lead nunca preencheu
 * form — caso comum pra leads importados manualmente).
 */

'use client';

import type { ReactNode } from 'react';
import { FormTagIcon, iconKeyForFormSlug } from './form-tag-icon';

type Props = {
  /** Array de slugs (people.forms_submitted ou agregado de companies). */
  formsSubmitted: string[];
  /**
   * Quando true (default), envolve em crm-side-card. False = só renderiza
   * os chips crus (pra embed em outros componentes).
   */
  withCard?: boolean;
  /**
   * Override do título quando withCard=true. Default: "📋 Formulários preenchidos".
   */
  title?: string;
};

// Label legível por slug. Slugs espelham people.forms_submitted (= FormSlug).
// O ÍCONE vem de iconKeyForFormSlug (um por tipo); aqui só o texto.
const SLUG_LABELS: Record<string, string> = {
  'algoritmo-linkedin': 'Algoritmo LinkedIn',
  'case-semrush': 'Case Semrush',
  'playbook-employee-led-growth': 'Playbook',
  beta: 'Beta',
  demo: 'Demo',
  proposta: 'Proposta',
  linkedin_extension: 'LinkedIn',
};

export function FormsSubmittedChipList({
  formsSubmitted,
  withCard = true,
  title = 'Formulários preenchidos',
}: Props): ReactNode {
  if (!formsSubmitted || formsSubmitted.length === 0) return null;

  const chips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {formsSubmitted.map((slug) => {
        const label = SLUG_LABELS[slug] ?? slug;
        return (
          <a
            key={slug}
            href={`#form-${slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(205, 80, 241, 0.1)',
              color: '#CD50F1',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
            }}
            title={`Ver registro do form ${label} na timeline`}
          >
            <FormTagIcon name={iconKeyForFormSlug(slug)} size={12} />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );

  if (!withCard) return chips;

  return (
    <div className="crm-side-card">
      <div className="crm-side-title">{title}</div>
      {chips}
    </div>
  );
}
