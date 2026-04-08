'use client';

import { useT } from '@/lib/i18n/context';
import { UseCasePageLayout } from '@/components/sections/use-case-page';

export default function SocialSellingPage() {
  const t = useT();
  const c = t.casosDeUso.socialSelling;

  return (
    <UseCasePageLayout
      heroTag={c.heroTag}
      heroTitle={c.heroTitle}
      heroTitleHighlight={c.heroTitleHighlight}
      heroSubtitle={c.heroSubtitle}
      persona={c.persona}
      problemTitle={c.problemTitle}
      problems={[c.problem1, c.problem2, c.problem3, c.problem4]}
      solutionTitle={c.solutionTitle}
      solutions={[c.solution1, c.solution2, c.solution3]}
      metricsTitle={c.metricsTitle}
      metrics={[c.metric1, c.metric2, c.metric3, c.metric4]}
      objectionTitle={c.objectionTitle}
      objectionAnswer={c.objectionAnswer}
      ctaButton={c.ctaButton}
    />
  );
}
