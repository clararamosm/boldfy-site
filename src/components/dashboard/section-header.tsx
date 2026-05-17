/**
 * Section header pras pages longas (Aquisição, Conversão).
 * Linha divisória + título + subtítulo opcional + icon lucide opcional.
 *
 * Server Component (sem 'use client').
 */

import type { LucideIcon } from 'lucide-react';

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ margin: '36px 0 12px 0', paddingTop: 18, borderTop: '1px solid #E4D8ED' }}>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 20, color: '#5E2A67', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon ? <Icon size={22} /> : null}
        {title}
      </h2>
      {subtitle ? <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 4 }}>{subtitle}</div> : null}
    </div>
  );
}
