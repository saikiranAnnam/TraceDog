import Link from "next/link";
import { ExperimentsSection } from "@/components/landing/sections/experiments-section";
import { LandingFooter } from "@/components/landing/sections/landing-footer";
import { SITE } from "@/lib/site";

export default function ExperimentsPage() {
  return (
    <>
      <ExperimentsSection
        experimentNotesLink={{
          href: "#methodology",
          label: "Methodology (this page)",
        }}
      />

      <section id="methodology" className="ld-section">
        <div className="ld-container">
          <h2 className="ld-h2 ld-h2--left">Methodology &amp; notes</h2>
          <p className="ld-sub ld-sub--left">
            TraceDog is validated on public benchmarks (e.g. SQuAD-style QA) and multi-model runs.
            Reproducibility notes and full write-ups will expand here as we publish them.
          </p>
          <p className="ld-sub ld-sub--left" style={{ marginBottom: "1.5rem" }}>
            For scoring internals, see the <Link href="/docs">docs</Link> and the{" "}
            <a href={SITE.github} target="_blank" rel="noopener noreferrer">
              repository
            </a>
            .
          </p>
          <p className="ld-exp-links" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            <Link href="/" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
