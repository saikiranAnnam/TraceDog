"use client";

import { Microscope, MonitorPlay, Send, Sparkles } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { AIExecutionGraph } from "@/components/landing/premium/ai-execution-graph";

const steps = [
  {
    icon: Send,
    title: "Send traces",
    body: "Ingest prompts, retrieved documents, outputs, and metadata over the API.",
  },
  {
    icon: Microscope,
    title: "Analyze grounding",
    body: "The scoring layer compares responses against evidence and computes reliability signals.",
  },
  {
    icon: Sparkles,
    title: "Explain failures",
    body: "Surface why a run looks grounded, weak, or unsupported — not just a single score.",
  },
  {
    icon: MonitorPlay,
    title: "Inspect and compare",
    body: "Use the dashboard to review traces, understand model behavior, and evaluate experiments.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="ld-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">From model run to reliability insight</h2>
          <p className="ld-sub">
            A clear path from ingestion to verdict — then drill into execution detail when you need it.
          </p>
        </Reveal>
        <div className="ld-how-steps">
          {steps.map((s) => (
            <div key={s.title} className="ld-how-step">
              <div className="ld-how-step-icon">
                <s.icon size={22} strokeWidth={1.65} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <Reveal>
          <p className="ld-how-graph-intro">Execution path · illustrative</p>
          <AIExecutionGraph />
        </Reveal>
      </div>
    </section>
  );
}
