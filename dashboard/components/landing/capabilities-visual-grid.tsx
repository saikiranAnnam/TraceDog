"use client";

import { Reveal } from "@/components/landing/reveal";
import { MiniTraceFlow } from "@/components/landing/mini-trace-flow";
import { MiniGroundingSpectrum } from "@/components/landing/mini-grounding-spectrum";
import { MiniVerdictCard } from "@/components/landing/mini-verdict-card";

const cards = [
  {
    title: "Trace runs",
    body: "See prompt → retrieval → generation as a single execution rail — not scattered logs.",
    footer: "Timeline + latency-weighted path",
    visual: <MiniTraceFlow />,
  },
  {
    title: "Map claims to evidence",
    body: "Inspect which sentences tie to which passages before you trust a score.",
    footer: "Claim ↔ passage alignment",
    visual: <MiniGroundingSpectrum />,
  },
  {
    title: "Debug the verdict",
    body: "Unsupported, weak retrieval, or supported — with the claim in front of you.",
    footer: "Review-ready failure context",
    visual: <MiniVerdictCard />,
  },
];

export function CapabilitiesVisualGrid() {
  return (
    <section id="catches" className="ld-section ld-section--alt ld-cap-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">What TraceDog catches</h2>
          <p className="ld-sub ld-sub--section">
            Trace execution, evidence alignment, and failure state — in one glance.
          </p>
        </Reveal>
        <p className="ld-cap-kicker">Trace runs. Score evidence. Explain failures.</p>
        <div className="ld-cap-grid">
          {cards.map((c) => (
            <article key={c.title} className="ld-cap-card">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <div className="ld-cap-visual">{c.visual}</div>
              <p className="ld-cap-footer">{c.footer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
