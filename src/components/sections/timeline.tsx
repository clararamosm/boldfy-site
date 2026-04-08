'use client';

import { useT } from '@/lib/i18n/context';

interface TimelineStepProps {
  time: string;
  title: string;
  detail: string;
  isLast?: boolean;
}

function TimelineStep({ time, title, detail, isLast }: TimelineStepProps) {
  return (
    <div className="relative flex gap-4 pb-8">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className="relative z-10 h-4 w-4 rounded-full border-2 border-primary bg-white" />
        {!isLast && <div className="w-0.5 flex-1 bg-primary/20" />}
      </div>

      {/* Content */}
      <div className="pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {time}
        </span>
        <p className="text-sm font-semibold text-foreground mt-0.5">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

export function TimelineSection() {
  const t = useT();

  const steps = [
    { time: t.home.timelineWeek1, title: t.home.timelineWeek1What, detail: t.home.timelineWeek1Detail },
    { time: t.home.timelineWeek23, title: t.home.timelineWeek23What, detail: t.home.timelineWeek23Detail },
    { time: t.home.timelineMonth12, title: t.home.timelineMonth12What, detail: t.home.timelineMonth12Detail },
    { time: t.home.timelineMonth3, title: t.home.timelineMonth3What, detail: t.home.timelineMonth3Detail },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-lg mx-auto">
          {steps.map((step, idx) => (
            <TimelineStep
              key={step.time}
              time={step.time}
              title={step.title}
              detail={step.detail}
              isLast={idx === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
