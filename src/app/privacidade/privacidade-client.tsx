'use client';

import { useT } from '@/lib/i18n/context';

export default function PrivacidadeClient() {
  const t = useT();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-headline text-3xl font-bold text-accent-foreground mb-8">{t.privacidade.title}</h1>

        <div className="prose-boldfy space-y-6 text-sm text-foreground leading-relaxed">
          <p>{t.privacidade.lastUpdated}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section1Title}</h2>
          <p>{t.privacidade.section1Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section2Title}</h2>
          <p>{t.privacidade.section2Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section3Title}</h2>
          <p>{t.privacidade.section3Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section4Title}</h2>
          <p>{t.privacidade.section4Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section5Title}</h2>
          <p>{t.privacidade.section5Text}</p>

          <h2 className="font-headline text-xl font-bold text-accent-foreground mt-8 mb-3">{t.privacidade.section6Title}</h2>
          <p>{t.privacidade.section6Text}</p>
        </div>
      </div>
    </section>
  );
}
