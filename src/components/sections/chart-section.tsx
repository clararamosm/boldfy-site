'use client';

import { useT } from '@/lib/i18n/context';

export function ChartSection() {
  const t = useT();

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-3">
          {t.home.chartTitle}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t.home.chartSubtitle}
        </p>

        {/* SVG Chart */}
        <div className="relative w-full max-w-3xl mx-auto">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-auto"
            aria-label="Gráfico comparando Ads vs Employee Advocacy ao longo do tempo"
          >
            {/* Grid lines */}
            {[100, 150, 200, 250, 300, 350].map((y) => (
              <line
                key={y}
                x1={80}
                y1={y}
                x2={750}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
            ))}

            {/* X Axis */}
            <line x1={80} y1={350} x2={750} y2={350} stroke="hsl(var(--border))" strokeWidth="1" />

            {/* Y Axis */}
            <line x1={80} y1={100} x2={80} y2={350} stroke="hsl(var(--border))" strokeWidth="1" />

            {/* X Labels */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <text
                key={month}
                x={80 + (month * 670) / 13}
                y={370}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {t.home.chartMonthLabel} {month}
              </text>
            ))}

            {/* Y Label */}
            <text
              x={30}
              y={225}
              textAnchor="middle"
              transform="rotate(-90 30 225)"
              className="fill-muted-foreground text-[11px]"
            >
              Alcance
            </text>

            {/* Ads line — plateau then decline */}
            <path
              d="M 80 280 C 140 220, 200 195, 260 190 C 320 185, 380 185, 440 188 C 480 190, 500 190, 520 195 C 560 205, 620 240, 700 290"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              opacity="0.6"
            />
            <text x={705} y={295} className="fill-muted-foreground text-[11px] font-medium">Ads</text>

            {/* EGC line — exponential growth */}
            <path
              d="M 80 330 C 140 325, 200 318, 260 308 C 320 296, 380 278, 440 250 C 500 215, 560 170, 620 130 C 660 108, 700 100, 750 88"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
            />

            {/* EGC area fill */}
            <path
              d="M 80 330 C 140 325, 200 318, 260 308 C 320 296, 380 278, 440 250 C 500 215, 560 170, 620 130 C 660 108, 700 100, 750 88 L 750 350 L 80 350 Z"
              fill="hsl(var(--primary))"
              opacity="0.06"
            />
            <text x={700} y={80} className="fill-primary text-[12px] font-bold">EGC</text>

            {/* Annotation: ads stopped */}
            <line x1={440} y1={188} x2={440} y2={120} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3,3" />
            <rect x={345} y={100} width={190} height={24} rx={4} fill="hsl(var(--secondary))" />
            <text x={440} y={116} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {t.home.adsStoppedLabel}
            </text>

            {/* Annotation: no budget */}
            <rect x={580} y={255} width={160} height={22} rx={4} fill="hsl(var(--destructive))" opacity="0.1" />
            <text x={660} y={270} textAnchor="middle" className="fill-destructive text-[10px] font-medium">
              {t.home.noReachLabel}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
