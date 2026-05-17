/**
 * Side nav fixo pra pages longas (Aquisição, Conversão).
 *
 * Recebe lista de seções com {id, label, icon?} e renderiza coluna lateral
 * sticky com âncoras. Highlight da seção visível via IntersectionObserver.
 *
 * Usar:
 *   <div className="dash-page-with-nav">
 *     <SectionNav sections={[{ id: 'trafego', label: 'Tráfego' }, ...]} />
 *     <div className="dash-page-main">...conteúdo com id={each}...</div>
 *   </div>
 */

'use client';

import { useEffect, useState } from 'react';

export type SectionItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
};

export function SectionNav({ sections }: { sections: SectionItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  }

  return (
    <nav className="dash-section-nav" aria-label="Navegar entre seções">
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={`dash-section-nav-link ${activeId === s.id ? 'active' : ''}`}
          >
            {Icon ? <Icon size={14} /> : null}
            <span>{s.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
