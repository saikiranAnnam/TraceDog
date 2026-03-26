"use client";

import Link from "next/link";
import { Database, GitCompare, Sparkles } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { ExperimentComparisonMini } from "@/components/landing/experiment-comparison-mini";

const panels = [
  {
    title: "Benchmark runs",
    body: "Evaluated on real LLM outputs using SQuAD v2 and repeatable trace captures.",
    icon: Database,
  },
  {
    title: "Model comparison",
    body: "Compare grounding, reliability, and latency across identical prompts in one view.",
    icon: GitCompare,
  },
  {
    title: "Scoring engine",
    body: "Hybrid claim-level scoring: sentence + keyword alignment against retrieved context.",
    icon: Sparkles,
  },
] as const;

export function ExperimentsSection() {
  return (
    <section id="experiments" className="ld-section ld-section--alt ld-exp-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2 ld-exp-section-title">Measured on real runs, not demos</h2>
          <p className="ld-sub ld-sub--section ld-exp-section-sub">
            Real evaluation results across models — same prompts, same pipeline, scores you can audit in the
            TraceDog UI.
          </p>
        </Reveal>
        <Reveal>
          <ExperimentComparisonMini />
        </Reveal>
        <div className="ld-exp-grid ld-exp-grid--tight">
          {panels.map((e) => (
            <article key={e.title} className="ld-exp-card ld-exp-card--module">
              <div className="ld-exp-card-icon" aria-hidden>
                <e.icon size={22} strokeWidth={1.75} />
              </div>
              <h3>{e.title}</h3>
              <p>{e.body}</p>
            </article>
          ))}
        </div>
        <p className="ld-exp-links">
          <Link href="/experiments">Experiment notes &amp; methodology</Link>
          <Link href="/docs">Scoring &amp; algorithms in docs</Link>
        </p>
      </div>
    </section>
  );
}
