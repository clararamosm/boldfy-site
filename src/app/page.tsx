import { HeroSection } from '@/components/sections/hero';
import { ProblemSection } from '@/components/sections/problem';
import { UseCasesSection } from '@/components/sections/use-cases';
import { ProductMotionSection } from '@/components/sections/product-motion';
import { SolutionsBentoSection } from '@/components/sections/solutions-bento';
import { ManifestoSection } from '@/components/sections/manifesto';
import { FaqSection } from '@/components/sections/faq';
import { CtaFinalSection } from '@/components/sections/cta-final';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <UseCasesSection />
      <ProductMotionSection />
      <SolutionsBentoSection />
      <ManifestoSection />
      <FaqSection />
      <CtaFinalSection />
    </>
  );
}
