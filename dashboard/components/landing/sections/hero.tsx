"use client";

import Link from "next/link";
import { Reveal } from "@/components/landing/reveal";
import { SITE } from "@/lib/site";

function HeroMockup() {
  return (
    <div className="ld-hero-mock-outer">
      <div className="ld-mock-wrap">
        <div className="ld-mock-glow" aria-hidden />
        <div className="ld-mock-window">
        <div className="ld-mock-chrome">
          <span className="ld-mock-dot" />
          <span className="ld-mock-dot" />
          <span className="ld-mock-dot" />
          <span className="ld-mock-url">tracedog · trace detail</span>
        </div>
        <div className="ld-mock-body">
          <div className="ld-mock-row">
            <span className="ld-badge ld-badge--ok">Looks grounded</span>
            <span className="ld-badge ld-badge--neutral">Evaluation</span>
          </div>
          <div className="ld-mock-metrics">
            <div className="ld-metric ld-metric--accent">
              <span className="ld-metric-k">Reliability</span>
              <span className="ld-metric-v">0.71</span>
            </div>
            <div className="ld-metric">
              <span className="ld-metric-k">Hallucination risk</span>
              <span className="ld-metric-v">0.31</span>
            </div>
            <div className="ld-metric">
              <span className="ld-metric-k">Grounding</span>
              <span className="ld-metric-v">0.68</span>
            </div>
          </div>
          <div className="ld-spectrum-block">
            <div className="ld-spectrum-k">Grounding spectrum</div>
            <div className="ld-spectrum-track">
              <div className="ld-spectrum-fill" />
              <div className="ld-spectrum-dot" />
            </div>
          </div>
          <div className="ld-mock-card">
            <div className="ld-mock-card-k">Why TraceDog scored it this way</div>
            <p>
              Hybrid score blends sentence and keyword signals; evidence aligns with the answer and no
              contradiction was detected against retrieved passages.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="product" className="ld-hero">
      <div className="ld-hero-bg" aria-hidden />
      <div className="ld-hero-grid">
        <Reveal>
          <div>
            <p className="ld-eyebrow">Observability and reliability for AI agents</p>
            <h1 className="ld-hero-h1">
              Trace, evaluate, and{" "}
              <span className="ld-hero-title-accent">debug AI systems with evidence.</span>
            </h1>
            <p className="ld-lead">
              TraceDog helps engineers inspect AI runs, measure grounding, detect weak retrieval, and
              compare model behavior with explainable reliability scores.
            </p>
            <div className="ld-hero-ctas">
              <Link href="/traces" className="ld-btn ld-btn--primary">
                View demo
              </Link>
              <Link href="/docs" className="ld-btn ld-btn--outline">
                Read docs
              </Link>
            </div>
            <dl className="ld-hero-metrics" aria-label="Signals from evaluation runs">
              <div className="ld-hero-metric">
                <dt>Hallucination risk</dt>
                <dd>
                  <span className="ld-hero-metric-from">38%</span>
                  <span className="ld-hero-metric-arrow" aria-hidden>
                    →
                  </span>
                  <span className="ld-hero-metric-to">12%</span>
                </dd>
              </div>
              <div className="ld-hero-metric">
                <dt>Traced throughput</dt>
                <dd>1K+ runs/day</dd>
              </div>
              <div className="ld-hero-metric">
                <dt>P95 pipeline latency</dt>
                <dd>1.2s</dd>
              </div>
            </dl>
            <div className="ld-hero-links">
              <Link href="/experiments">See experiments</Link>
              <span>·</span>
              <a href={SITE.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  );
}
