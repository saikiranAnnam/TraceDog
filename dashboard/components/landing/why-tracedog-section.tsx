"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { AlertTriangle, Eye, Scale } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

const cards = [
  {
    icon: AlertTriangle,
    title: "Confident but wrong outputs",
    body: "AI responses can look correct even when evidence is weak or missing — the failure is silent until someone audits.",
    visual: "wrong",
  },
  {
    icon: Eye,
    title: "No visibility into retrieval + reasoning",
    body: "Most tools stop at prompt and output. TraceDog captures what happened inside: retrieval, spans, and scoring.",
    visual: "observe",
  },
  {
    icon: Scale,
    title: "No consistent reliability measure",
    body: "Comparing runs across models and contexts is manual and noisy — you need one scoreline engineers can trust.",
    visual: "eval",
  },
] as const;

const bridgeMetrics: { label: string; tone: "success" | "info" | "brand" | "neutral" }[] = [
  { label: "Real LLM runs", tone: "success" },
  { label: "Public benchmark tested", tone: "info" },
  { label: "Hybrid grounding", tone: "brand" },
  { label: "Open-source direction", tone: "neutral" },
];

const toneClass = {
  success: "ld-pill-status--success",
  info: "ld-pill-status--info",
  brand: "ld-pill-status--brand",
  neutral: "ld-pill-status--neutral",
} as const;

function WhyCardVisual({ kind }: { kind: (typeof cards)[number]["visual"] }) {
  if (kind === "wrong") {
    return (
      <div className="ld-why-mini" aria-hidden>
        <div className="ld-why-mini-row">
          <span className="ld-why-mini-k">Claim</span>
          <span className="ld-why-mini-bad">Unsupported</span>
        </div>
        <div className="ld-why-mini-trace">
          <span className="ld-why-mini-dot" />
          <span className="ld-why-mini-line" />
          <span className="ld-why-mini-dot ld-why-mini-dot--bad" />
        </div>
        <p className="ld-why-mini-caption">Looks fine in the UI — evidence doesn’t back it.</p>
      </div>
    );
  }
  if (kind === "observe") {
    return (
      <div className="ld-why-mini" aria-hidden>
        <div className="ld-why-mini-stack">
          <div className="ld-why-mini-lane">
            <span className="ld-why-mini-pill">Prompt</span>
            <span className="ld-why-mini-pill">Output</span>
          </div>
          <div className="ld-why-mini-lane ld-why-mini-lane--full">
            <span className="ld-why-mini-pill ld-why-mini-pill--on">Retrieval</span>
            <span className="ld-why-mini-pill ld-why-mini-pill--on">Spans</span>
            <span className="ld-why-mini-pill ld-why-mini-pill--on">Scores</span>
          </div>
        </div>
        <p className="ld-why-mini-caption">TraceDog records the full path — not just I/O.</p>
      </div>
    );
  }
  return (
    <div className="ld-why-mini" aria-hidden>
      <div className="ld-why-mini-bars">
        <div className="ld-why-mini-bar">
          <span>Run A</span>
          <div className="ld-why-mini-bar-track">
            <span style={{ width: "62%" }} />
          </div>
        </div>
        <div className="ld-why-mini-bar">
          <span>Run B</span>
          <div className="ld-why-mini-bar-track">
            <span className="ld-why-mini-bar-fill--b" style={{ width: "71%" }} />
          </div>
        </div>
      </div>
      <p className="ld-why-mini-caption">Same prompt, comparable reliability — apples to apples.</p>
    </div>
  );
}

export function WhyTraceDogSection() {
  return (
    <section id="why" className="ld-section ld-why-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">Why TraceDog exists</h2>
          <p className="ld-sub ld-sub--section">
            Production AI fails in ways logs don’t show: weak retrieval, confident hallucinations, and
            inconsistent evaluation across models.
          </p>
        </Reveal>
        <div className="ld-grid-3 ld-grid-3--why">
          {cards.map((c) => (
            <motion.article
              key={c.title}
              className="ld-card-prob ld-card-prob--why"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <div className="ld-card-prob-icon">
                <c.icon size={20} strokeWidth={1.75} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <WhyCardVisual kind={c.visual} />
            </motion.article>
          ))}
        </div>
        <p className="ld-why-bottom">
          TraceDog turns model runs into reviewable evidence and reliability signals.
        </p>
        <div className="ld-bridge-metrics" aria-label="Proof points">
          {bridgeMetrics.map(({ label, tone }) => (
            <span key={label} className={clsx("ld-pill-status", toneClass[tone])}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
