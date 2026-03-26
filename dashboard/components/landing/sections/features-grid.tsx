"use client";

import {
  BarChart3,
  BookOpen,
  FlaskConical,
  GitBranch,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/landing/reveal";

const features = [
  {
    icon: Waypoints,
    title: "Execution tracing",
    body: "See prompt, retrieved context, spans, latency, and final response in one trace view.",
  },
  {
    icon: BarChart3,
    title: "Grounding analysis",
    body: "Measure alignment with evidence using sentence-level and hybrid scoring.",
  },
  {
    icon: ShieldAlert,
    title: "Hallucination risk",
    body: "Flag weakly supported outputs and highlight runs that need review.",
  },
  {
    icon: BookOpen,
    title: "Failure explanations",
    body: "Understand why a response scored as weak, unsupported, or grounded.",
  },
  {
    icon: FlaskConical,
    title: "Model experiments",
    body: "Run the same dataset across multiple LLMs and compare behavior side by side.",
  },
  {
    icon: GitBranch,
    title: "Developer-first workflow",
    body: "API-first ingestion, open-source direction, and experiment-driven iteration.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="ld-section ld-section--alt">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">What TraceDog provides</h2>
          <p className="ld-sub">
            Trace execution, scoring, and comparison — built for engineers who ship agents and RAG into
            production.
          </p>
        </Reveal>
        <div className="ld-features-grid">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              className="ld-feature-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <div className="ld-feature-icon">
                <f.icon size={22} strokeWidth={1.65} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
