"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Eye, Scale } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

const cards = [
  {
    icon: AlertTriangle,
    title: "Silent failures",
    body: "LLMs can return confident answers with weak or missing grounding.",
  },
  {
    icon: Eye,
    title: "Poor observability",
    body: "Most tools show prompts and outputs, but not why the response should be trusted.",
  },
  {
    icon: Scale,
    title: "Hard model comparison",
    body: "It is difficult to compare real runs across models, prompts, and retrieval quality.",
  },
];

export function ProblemSection() {
  return (
    <section id="why" className="ld-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">AI systems are hard to trust in production</h2>
          <p className="ld-sub">
            Silent hallucinations, weak retrieval, and missing context are easy to miss until something
            breaks in front of users.
          </p>
        </Reveal>
        <div className="ld-grid-3">
          {cards.map((c) => (
            <motion.article
              key={c.title}
              className="ld-card-prob"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="ld-card-prob-icon">
                <c.icon size={20} strokeWidth={1.75} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </motion.article>
          ))}
        </div>
        <p className="ld-support-line">
          TraceDog gives teams one place to inspect execution, score evidence alignment, and understand
          failure modes.
        </p>
      </div>
    </section>
  );
}
