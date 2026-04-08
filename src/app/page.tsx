import { HeroSection } from '@/components/sections/hero';
import { QuotesSection } from '@/components/sections/quotes';
import { SocialProofSection } from '@/components/sections/social-proof';
import { UseCasesSection } from '@/components/sections/use-cases';
import { TwoJourneysSection } from '@/components/sections/two-journeys';
import { ChartSection } from '@/components/sections/chart-section';
import { RoiSimulatorSection } from '@/components/sections/roi-simulator';
import { HowItWorksSection } from '@/components/sections/how-it-works';
import { ShowcaseSection } from '@/components/sections/showcase';
import { BenefitsSection } from '@/components/sections/benefits';
import { TimelineSection } from '@/components/sections/timeline';
import { CtaFinalSection } from '@/components/sections/cta-final';

export default function Home() {
  return (
    <>
      <HeroSection />
      <QuotesSection />
      <SocialProofSection />
      <UseCasesSection />
      <TwoJourneysSection />
      <ChartSection />
      <RoiSimulatorSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <BenefitsSection />
      <TimelineSection />
      <CtaFinalSection />
    </>
  );
}
