'use client';

import { useT } from '@/lib/i18n/context';
import { Check, Building2, User } from 'lucide-react';

export function BenefitsSection() {
  const t = useT();

  const metrics = [
    { value: t.home.metric1Value, label: t.home.metric1Label },
    { value: t.home.metric2Value, label: t.home.metric2Label },
    { value: t.home.metric3Value, label: t.home.metric3Label },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Two columns: Company & Collaborator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* For company */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-headline text-lg font-bold text-accent-foreground">
                {t.home.forCompany}
              </h3>
            </div>
            <ul className="space-y-3">
              {t.home.benefitsCompany.map((benefit: string) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* For collaborator */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-headline text-lg font-bold text-accent-foreground">
                {t.home.forCollaborator}
              </h3>
            </div>
            <ul className="space-y-3">
              {t.home.benefitsCollaborator.map((benefit: string) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((m) => (
            <div
              key={m.value}
              className="rounded-xl bg-primary/5 border border-primary/10 p-6 text-center"
            >
              <p className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
                {m.value}
              </p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
