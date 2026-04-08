'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Slider } from '@/components/ui/slider';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function RoiSimulatorSection() {
  const t = useT();

  const [collaborators, setCollaborators] = useState(20);
  const [impressions, setImpressions] = useState(2000);

  // Calculations
  const totalImpressions = collaborators * impressions;
  const mediaValue = totalImpressions * 0.3;

  // Boldfy cost per seat (using tier based pricing)
  const getCostPerSeat = (seats: number) => {
    if (seats <= 10) return 349; // beta price
    if (seats <= 20) return 315;
    if (seats <= 40) return 279;
    return 245;
  };

  const costPerSeat = getCostPerSeat(collaborators);
  const boldfyCost = collaborators * costPerSeat;
  const roi = mediaValue > 0 ? ((mediaValue - boldfyCost) / boldfyCost) * 100 : 0;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-2">
          {t.home.simulatorTitle}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          {t.home.simulatorSubtitle}
        </p>

        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-sm">
            {/* Sliders */}
            <div className="space-y-8 mb-10">
              {/* Collaborators slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    {t.home.collaboratorsInProgram}
                  </label>
                  <span className="text-lg font-bold text-primary">{collaborators}</span>
                </div>
                <Slider
                  defaultValue={[20]}
                  min={5}
                  max={70}
                  step={1}
                  value={[collaborators]}
                  onValueChange={(v) => setCollaborators(v[0])}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">5</span>
                  <span className="text-[10px] text-muted-foreground">70</span>
                </div>
              </div>

              {/* Impressions slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    {t.home.impressionsPerMonth}
                  </label>
                  <span className="text-lg font-bold text-primary">
                    {formatNumber(impressions)}
                  </span>
                </div>
                <Slider
                  defaultValue={[2000]}
                  min={500}
                  max={5000}
                  step={100}
                  value={[impressions]}
                  onValueChange={(v) => setImpressions(v[0])}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">500</span>
                  <span className="text-[10px] text-muted-foreground">5.000</span>
                </div>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total impressions */}
              <div className="rounded-lg bg-secondary/50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {t.home.totalImpressionsMonth}
                </p>
                <p className="text-xl font-bold text-accent-foreground">
                  {formatNumber(totalImpressions)}
                </p>
              </div>

              {/* Media equivalent value */}
              <div className="rounded-lg bg-primary/5 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {t.home.mediaEquivalentValue}
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatBRL(mediaValue)}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{t.home.perImpression}</p>
              </div>

              {/* Boldfy cost */}
              <div className="rounded-lg bg-secondary/50 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {t.home.boldfyCostMonth}
                </p>
                <p className="text-xl font-bold text-accent-foreground">
                  {formatBRL(boldfyCost)}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {formatBRL(costPerSeat)}{t.home.perSeat}
                </p>
              </div>

              {/* ROI */}
              <div className="rounded-lg bg-green-500/10 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {t.home.roiTitle}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {roi.toFixed(0)}%
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{t.home.roiSubtitle}</p>
              </div>
            </div>

            {/* Note */}
            <p className="mt-6 text-[10px] text-muted-foreground leading-relaxed text-center">
              {t.home.simulatorNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
