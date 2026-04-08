'use client';

import { useT } from '@/lib/i18n/context';

export default function TermosClient() {
  const t = useT();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-headline text-3xl font-bold text-accent-foreground mb-8">{t.termos.title}</h1>

        <div className="prose-boldfy space-y-6 text-sm text-foreground leading-relaxed">
          <p>{t.termos.lastUpdated}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section1Title}</h2>
          <p>{t.termos.section1Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section2Title}</h2>
          <p>{t.termos.section2Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section3Title}</h2>
          <p>{t.termos.section3Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section4Title}</h2>
          <p>{t.termos.section4Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section5Title}</h2>
          <p>{t.termos.section5Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section6Title}</h2>
          <p>{t.termos.section6Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.termos.section7Title}</h2>
          <p>{t.termos.section7Text}</p>
        </div>
      </div>
    </section>
  );
}
