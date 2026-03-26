import { HeroSection } from "@/components/landing/sections/hero";
import { ProofStrip } from "@/components/landing/sections/proof-strip";
import { WhyTraceDogSection } from "@/components/landing/why-tracedog-section";
import { ProductLoopSection } from "@/components/landing/product-loop-section";
import { CapabilitiesVisualGrid } from "@/components/landing/capabilities-visual-grid";
import { ExperimentsSection } from "@/components/landing/sections/experiments-section";
import { OpenSourceSection } from "@/components/landing/sections/open-source-section";
import { DocsSection } from "@/components/landing/sections/docs-section";
import { TechStackSection } from "@/components/landing/sections/tech-stack";
import { CtaSection } from "@/components/landing/sections/cta-section";
import { LandingFooter } from "@/components/landing/sections/landing-footer";

/** V1 marketing home — hero → proof → why → loop → catches → experiments → OSS → docs → stack → CTA → footer. */
export function LandingHome() {
  return (
    <>
      <HeroSection />
      <ProofStrip />
      <WhyTraceDogSection />
      <ProductLoopSection />
      <CapabilitiesVisualGrid />
      <ExperimentsSection />
      <OpenSourceSection />
      <DocsSection />
      <TechStackSection />
      <CtaSection />
      <LandingFooter />
    </>
  );
}
