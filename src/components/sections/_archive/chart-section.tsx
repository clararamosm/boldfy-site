'use client';

import { useT } from '@/lib/i18n/context';

export function ChartSection() {
  const t = useT();

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-3">
          {t.home.chartTitle}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t.home.chartSubtitle}
        </p>

        {/* SVG Chart — styled like beta-test */}
        <div className="relative w-full max-w-3xl mx-auto">
          <svg
            viewBox="0 0 680 200"
            className="w-full h-auto block"
            aria-label="Gráfico comparando Ads vs Employee Advocacy ao longo do tempo"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="homeEgcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CD50F1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#CD50F1" stopOpacity="0" />
              </linearGradient>
              <clipPath id="homeChartClip">
                <rect x="60" y="5" width="580" height="160" />
              </clipPath>
            </defs>

            {/* Grid */}
            <line x1="60" y1="10" x2="60" y2="165" stroke="hsl(var(--border))" strokeWidth="1" />
            <line x1="60" y1="165" x2="640" y2="165" stroke="hsl(var(--border))" strokeWidth="1" />
            <line x1="60" y1="125" x2="640" y2="125" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="60" y1="85" x2="640" y2="85" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="60" y1="45" x2="640" y2="45" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />

            {/* Ads stopped annotation line */}
            <line x1="390" y1="15" x2="390" y2="165" stroke="#D4A0B8" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
            <text x="390" y="12" fontFamily="Inter, sans-serif" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontWeight="600">
              {t.home.adsStoppedLabel}
            </text>

            {/* Ads line — solid before stop, dashed after */}
            <path
              d="M60,120 C130,112 200,105 270,100 C320,97 350,95 390,92"
              fill="none"
              stroke="#B8A4CC"
              strokeWidth="2.2"
              strokeLinecap="round"
              clipPath="url(#homeChartClip)"
            />
            <path
              d="M390,92 C410,105 440,130 470,148 C490,155 510,160 540,162"
              fill="none"
              stroke="#B8A4CC"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="5,4"
              opacity="0.5"
              clipPath="url(#homeChartClip)"
            />

            {/* "No reach" annotation */}
            <text x="555" y="157" fontFamily="Inter, sans-serif" fontSize="8" fill="hsl(var(--destructive))" opacity="0.7" fontWeight="500">
              {t.home.noReachLabel}
            </text>

            {/* EGC area fill */}
            <path
              d="M60,160 C130,158 200,152 270,138 C340,118 380,96 420,75 C470,52 530,32 580,20 L640,12 L640,165 L60,165 Z"
              fill="url(#homeEgcFill)"
              clipPath="url(#homeChartClip)"
            />

            {/* EGC line */}
            <path
              d="M60,160 C130,158 200,152 270,138 C340,118 380,96 420,75 C470,52 530,32 580,20 L640,12"
              fill="none"
              stroke="#CD50F1"
              strokeWidth="2.8"
              strokeLinecap="round"
              clipPath="url(#homeChartClip)"
            />

            {/* Labels */}
            <text x="620" y="88" fontFamily="Inter, sans-serif" fontSize="9" fill="#B8A4CC" fontWeight="600">Ads</text>
            <text x="620" y="10" fontFamily="Inter, sans-serif" fontSize="9" fill="#CD50F1" fontWeight="700">EGC</text>

            {/* X labels */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <text
                key={month}
                x={60 + (month * 580) / 13}
                y={182}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
              >
                {t.home.chartMonthLabel} {month}
              </text>
            ))}

            {/* Y Label */}
            <text
              x={25}
              y={90}
              textAnchor="middle"
              transform="rotate(-90 25 90)"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              fill="hsl(var(--muted-foreground))"
            >
              Alcance
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
