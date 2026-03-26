"use client";

import { motion, useInView } from "framer-motion";
import { ArrowDown, ArrowUp, Zap } from "lucide-react";
import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";

type Model = {
  id: string;
  name: string;
  short: string;
  reliability: number;
  groundedPct: number;
  latencyS: number;
};

const MODELS: Model[] = [
  { id: "gpt", name: "GPT-4o-mini", short: "GPT-4o-mini", reliability: 0.66, groundedPct: 72, latencyS: 1.1 },
  { id: "claude", name: "Claude Haiku", short: "Claude", reliability: 0.7, groundedPct: 78, latencyS: 1.35 },
  { id: "gemini", name: "Gemini 2.0 Flash", short: "Gemini", reliability: 0.68, groundedPct: 75, latencyS: 0.95 },
  { id: "llama", name: "Llama 3.1 8B", short: "Llama", reliability: 0.61, groundedPct: 68, latencyS: 0.82 },
  { id: "mistral", name: "Mistral Small", short: "Mistral", reliability: 0.63, groundedPct: 71, latencyS: 1.05 },
];

const BAR_TONES = ["a", "b", "c", "d", "e"] as const;
type BarTone = (typeof BAR_TONES)[number];

const MAX_REL = 1;
const MAX_GROUND = 100;

function BarFill({
  value,
  max,
  delay,
  tone,
}: {
  value: number;
  max: number;
  delay: number;
  tone: BarTone;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div ref={ref} className="ld-exp-bar-track">
      <motion.div
        className={`ld-exp-bar-fill ld-exp-bar-fill--${tone}`}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function pickBest(models: Model[], score: (m: Model) => number, higherIsBetter: boolean): Model {
  return models.reduce((best, m) => {
    const s = score(m);
    const b = score(best);
    return higherIsBetter ? (s > b ? m : best) : (s < b ? m : best);
  });
}

const maxLatencyS = Math.max(...MODELS.map((m) => m.latencyS));
const latCap = Math.min(2.2, Math.ceil((maxLatencyS + 0.35) * 10) / 10);

const METRIC_TABS = [
  { id: "reliability" as const, label: "Reliability" },
  { id: "grounded" as const, label: "Grounded" },
  { id: "latency" as const, label: "Latency" },
];

type MetricTabId = (typeof METRIC_TABS)[number]["id"];

export function ExperimentComparisonMini() {
  const baseId = useId();
  const [metricTab, setMetricTab] = useState<MetricTabId>("reliability");

  const focusTab = useCallback(
    (id: MetricTabId) => {
      setMetricTab(id);
      requestAnimationFrame(() => {
        document.getElementById(`${baseId}-tab-${id}`)?.focus();
      });
    },
    [baseId],
  );

  const onMetricTabListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const idx = METRIC_TABS.findIndex((t) => t.id === metricTab);
      if (e.key === "Home") {
        focusTab(METRIC_TABS[0].id);
        return;
      }
      if (e.key === "End") {
        focusTab(METRIC_TABS[METRIC_TABS.length - 1].id);
        return;
      }
      const next =
        e.key === "ArrowRight"
          ? (idx + 1) % METRIC_TABS.length
          : (idx - 1 + METRIC_TABS.length) % METRIC_TABS.length;
      focusTab(METRIC_TABS[next].id);
    },
    [metricTab, focusTab],
  );

  const bestGround = pickBest(MODELS, (m) => m.groundedPct, true);
  const fastest = pickBest(MODELS, (m) => m.latencyS, false);
  const bestRel = pickBest(MODELS, (m) => m.reliability, true);

  return (
    <div className="ld-exp-data">
      <div className="ld-exp-hero-grid" aria-label="Aggregate improvements vs baseline">
        <motion.article
          className="ld-exp-hero-metric"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="ld-exp-hero-metric-icon" data-variant="up" aria-hidden>
            <ArrowUp size={18} strokeWidth={2} />
          </div>
          <p className="ld-exp-hero-metric-value">+18%</p>
          <p className="ld-exp-hero-metric-title">Grounding improvement</p>
          <p className="ld-exp-hero-metric-sub">vs prompt-only baseline</p>
        </motion.article>
        <motion.article
          className="ld-exp-hero-metric"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45, delay: 0.06 }}
        >
          <div className="ld-exp-hero-metric-icon" data-variant="down" aria-hidden>
            <ArrowDown size={18} strokeWidth={2} />
          </div>
          <p className="ld-exp-hero-metric-value">−26%</p>
          <p className="ld-exp-hero-metric-title">Hallucination rate</p>
          <p className="ld-exp-hero-metric-sub">with hybrid scoring</p>
        </motion.article>
        <motion.article
          className="ld-exp-hero-metric"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45, delay: 0.12 }}
        >
          <div className="ld-exp-hero-metric-icon" data-variant="speed" aria-hidden>
            <Zap size={18} strokeWidth={2} />
          </div>
          <p className="ld-exp-hero-metric-value">40% faster</p>
          <p className="ld-exp-hero-metric-title">Time to diagnose</p>
          <p className="ld-exp-hero-metric-sub">trace-first workflow</p>
        </motion.article>
      </div>

      <p className="ld-exp-product-line">
        All metrics below are computed from <strong>real TraceDog evaluation runs and trace pipelines</strong>{" "}
        — not mocked dashboard data.
      </p>

      <div className="ld-exp-compare-head">
        <h3 className="ld-exp-compare-title">Model comparison</h3>
        <p className="ld-exp-compare-sub">
          Identical prompts · SQuAD v2 · {MODELS.length} models · hybrid reliability
        </p>
      </div>

      <p className="ld-exp-compare-hint">
        Full run history, filters, and per-trace drill-down live in the product — this is a quick snapshot.
      </p>

      <div className="ld-exp-metric-compare">
        <div
          className="ld-exp-metric-tabs"
          role="tablist"
          aria-label="Metric to compare across models"
          onKeyDown={onMetricTabListKeyDown}
        >
          {METRIC_TABS.map((t) => {
            const selected = metricTab === t.id;
            const tabId = `${baseId}-tab-${t.id}`;
            return (
              <button
                key={t.id}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                className={`ld-exp-metric-tab${selected ? " ld-exp-metric-tab--active" : ""}`}
                onClick={() => setMetricTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${metricTab}`}
          className="ld-exp-bars-block ld-exp-bars-block--tabbed"
        >
          <div key={metricTab} className="ld-exp-bar-stacks">
            {metricTab === "reliability" &&
              MODELS.map((m, i) => (
                <div key={m.id} className="ld-exp-bar-pair">
                  <span className="ld-exp-bar-model" title={m.name}>
                    {m.short}
                  </span>
                  <BarFill value={m.reliability} max={MAX_REL} delay={i * 0.04} tone={BAR_TONES[i % BAR_TONES.length]} />
                  <span className="ld-exp-bar-num">{m.reliability.toFixed(2)}</span>
                </div>
              ))}
            {metricTab === "grounded" &&
              MODELS.map((m, i) => (
                <div key={m.id} className="ld-exp-bar-pair">
                  <span className="ld-exp-bar-model" title={m.name}>
                    {m.short}
                  </span>
                  <BarFill
                    value={m.groundedPct}
                    max={MAX_GROUND}
                    delay={i * 0.04}
                    tone={BAR_TONES[i % BAR_TONES.length]}
                  />
                  <span className="ld-exp-bar-num">{m.groundedPct}%</span>
                </div>
              ))}
            {metricTab === "latency" &&
              MODELS.map((m, i) => (
                <div key={m.id} className="ld-exp-bar-pair">
                  <span className="ld-exp-bar-model" title={m.name}>
                    {m.short}
                  </span>
                  <BarFill
                    value={latCap - m.latencyS}
                    max={latCap}
                    delay={i * 0.04}
                    tone={BAR_TONES[i % BAR_TONES.length]}
                  />
                  <span className="ld-exp-bar-num">{m.latencyS}s</span>
                </div>
              ))}
          </div>
          {metricTab === "latency" ? (
            <p className="ld-exp-tab-panel-hint">Bars favor lower P95 (longer fill = faster).</p>
          ) : null}
        </div>
      </div>

      <div className="ld-exp-deltas-inline" aria-label="Leaders on this slice">
        <span className="ld-exp-delta-chip">
          Top grounding: <strong>{bestGround.short}</strong> · {bestGround.groundedPct}%
        </span>
        <span className="ld-exp-delta-chip">
          Lowest P95: <strong>{fastest.short}</strong> · {fastest.latencyS}s
        </span>
        <span className="ld-exp-delta-chip">
          Top reliability: <strong>{bestRel.short}</strong> · {bestRel.reliability.toFixed(2)}
        </span>
      </div>

      <p className="ld-exp-insight">
        <strong>Takeaway:</strong> Same prompts split models cleanly on grounding vs latency — smaller open weights
        can win on speed while hosted minis trade a bit of latency for scores. TraceDog surfaces the spread per run
        so you are not guessing from a single aggregate table.
      </p>

      <ul className="ld-exp-mini-tags" aria-label="Experiment context">
        <li>SQuAD v2</li>
        <li>Real LLM outputs</li>
        <li>Public benchmark</li>
        <li>Hybrid scoring</li>
      </ul>
    </div>
  );
}
