"use client";

import clsx from "clsx";
import { AlertCircle, RotateCcw, ShieldCheck, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/landing/reveal";

type Scenario = "success" | "failure" | "ticket";

type FlowNode = {
  key: string;
  label: string;
  detail: string;
  tone: "ok" | "warn" | "bad" | "neutral";
  badge?: string;
  subline?: string;
  attachments?: readonly string[];
  ticketGlow?: boolean;
};

/** Same eight stages in every scenario — only content/tone changes (parallel trace semantics). */
const STAGE_COUNT = 8;

const SCENARIOS: Record<
  Scenario,
  { title: string; blurb: string; nodes: FlowNode[] }
> = {
  success: {
    title: "Success path",
    blurb:
      "Retrieval matches the question, claims align with passages, and the verdict stays grounded before anything ships.",
    nodes: [
      { key: "p", label: "Prompt", detail: "User question ingested", tone: "neutral" },
      { key: "r", label: "Retrieval", detail: "3 passages · high overlap", tone: "ok" },
      { key: "m", label: "Model", detail: "Draft answer generated", tone: "neutral" },
      { key: "c", label: "Claim checks", detail: "No contradiction vs evidence", tone: "ok" },
      { key: "g", label: "Grounding", detail: "Hybrid score 0.72", tone: "ok" },
      { key: "v", label: "Verdict", detail: "Grounded — ship", tone: "ok" },
      { key: "th", label: "Threshold", detail: "Within policy limits · no escalation flags", tone: "ok" },
      { key: "tix", label: "Ticket", detail: "No ticket created", tone: "neutral" },
    ],
  },
  failure: {
    title: "Failure path",
    blurb:
      "Low-overlap retrieval and unsupported claims surface as structured signals — before users trust a confident answer.",
    nodes: [
      { key: "p", label: "Prompt", detail: "User question ingested", tone: "neutral" },
      {
        key: "r",
        label: "Retrieval",
        detail: "1 passage · low overlap",
        tone: "warn",
        badge: "Weak retrieval",
      },
      { key: "m", label: "Model", detail: "Confident draft", tone: "neutral" },
      {
        key: "c",
        label: "Claim checks",
        detail: "Unsupported claim detected",
        tone: "bad",
        subline:
          "Claim: “X happened in 2020” — no supporting evidence in retrieved passages",
      },
      { key: "g", label: "Grounding", detail: "Hybrid score 0.31", tone: "bad" },
      { key: "v", label: "Verdict", detail: "Unsupported — review", tone: "bad" },
      { key: "th", label: "Threshold", detail: "Review threshold met", tone: "warn" },
      { key: "tix", label: "Ticket", detail: "Manual review — not auto-escalated", tone: "neutral" },
    ],
  },
  ticket: {
    title: "Escalation",
    blurb:
      "When risk crosses your threshold, the same trace payload becomes a ticket — not a screenshot thread.",
    nodes: [
      { key: "p", label: "Prompt", detail: "User question", tone: "neutral" },
      { key: "r", label: "Retrieval", detail: "Evidence bundle attached", tone: "neutral" },
      { key: "m", label: "Model", detail: "Answer + highlighted spans", tone: "neutral" },
      { key: "c", label: "Claim checks", detail: "1 flag · weak evidence", tone: "warn" },
      { key: "g", label: "Grounding", detail: "Hybrid score 0.41", tone: "warn" },
      { key: "v", label: "Verdict", detail: "Unsupported — review", tone: "bad" },
      {
        key: "th",
        label: "Threshold",
        detail: "Risk threshold exceeded",
        tone: "warn",
        badge: "Rule fired",
      },
      {
        key: "tix",
        label: "Ticket",
        detail: "Trace #8421 flagged · assigned → reviewer queue",
        tone: "neutral",
        badge: "AUTO-ESCALATED",
        attachments: ["Trace payload", "Failed claim spans", "Retrieval context"],
        ticketGlow: true,
      },
    ],
  },
};

const TAB_ORDER: Scenario[] = ["success", "failure", "ticket"];

const tabLabel: Record<Scenario, string> = {
  success: "Success",
  failure: "Failure",
  ticket: "Ticket created",
};

const STEP_MS = 2000;

export function ProductLoopSection() {
  const [tab, setTab] = useState<Scenario>("success");
  const [step, setStep] = useState(0);
  const [replayNonce, setReplayNonce] = useState(0);

  const config = SCENARIOS[tab];
  const nodes = config.nodes;

  useEffect(() => {
    setStep(0);
  }, [tab]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s < STAGE_COUNT - 1) {
          return s + 1;
        }
        setTab((t) => TAB_ORDER[(TAB_ORDER.indexOf(t) + 1) % TAB_ORDER.length]);
        return 0;
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [replayNonce]);

  function replay() {
    setStep(0);
    setReplayNonce((n) => n + 1);
  }

  return (
    <section id="how" className="ld-section ld-vflow-section">
      <div className="ld-container">
        <div className="ld-vflow-layout">
          <Reveal>
            <div className="ld-vflow-sticky">
              <p className="ld-vflow-kicker">Execution story</p>
              <h2 className="ld-h2 ld-h2--left ld-text-heading">From run to verdict — one vertical trace</h2>
              <p className="ld-vflow-lead">
                TraceDog walks the same path your RAG stack takes: prompt, retrieval, generation,
                checks, grounding, verdict — so engineers see{" "}
                <strong className="ld-vflow-strong">where it broke</strong>, not just the final
                string.
              </p>
              <p className="ld-vflow-autoplay-hint" role="status">
                Autoplay cycles Success → Failure → Ticket — same eight stages, different outcomes.
              </p>
              <div className="ld-vflow-tabs" role="tablist" aria-label="Trace scenarios">
                {TAB_ORDER.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    className={clsx("ld-vflow-tab", tab === key && "ld-vflow-tab--on")}
                    onClick={() => setTab(key)}
                  >
                    {tabLabel[key]}
                  </button>
                ))}
              </div>
              <p className="ld-vflow-scenario-blurb">{config.blurb}</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="ld-vflow-panel" aria-live="polite">
              <div className="ld-vflow-panel-head">
                <span className="ld-vflow-panel-title">{config.title}</span>
                <div className="ld-vflow-panel-actions">
                  <span className="ld-vflow-panel-step" key={`${tab}-${step}-${replayNonce}`}>
                    Step {step + 1} / {STAGE_COUNT}
                  </span>
                  <button type="button" className="ld-vflow-replay" onClick={replay} title="Replay trace">
                    <RotateCcw size={14} strokeWidth={2} aria-hidden />
                    Replay
                  </button>
                </div>
              </div>
              <div className="ld-vflow-rail">
                {nodes.map((n, i) => (
                  <div key={`${tab}-${n.key}`} className="ld-vflow-step">
                    {i > 0 && (
                      <div
                        className={clsx("ld-vflow-connector", step >= i && "ld-vflow-connector--lit")}
                        aria-hidden
                      />
                    )}
                    <div
                      className={clsx(
                        "ld-vflow-node",
                        step === i && "ld-vflow-node--active",
                        step > i && "ld-vflow-node--past",
                        `ld-vflow-node--${n.tone}`,
                        n.ticketGlow && "ld-vflow-node--ticket"
                      )}
                    >
                      <div className="ld-vflow-node-top">
                        <span className="ld-vflow-node-label">{n.label}</span>
                        <div className="ld-vflow-node-badges">
                          {n.badge && (
                            <span className="ld-vflow-node-pill" data-tone={n.tone}>
                              {n.badge}
                            </span>
                          )}
                          {step === i && <span className="ld-vflow-live">Live</span>}
                        </div>
                      </div>
                      <p className="ld-vflow-node-detail">{n.detail}</p>
                      {n.subline && <p className="ld-vflow-node-subline">{n.subline}</p>}
                      {n.attachments && n.attachments.length > 0 && (
                        <div className="ld-vflow-attach">
                          <span className="ld-vflow-attach-k">Attached</span>
                          <ul>
                            {n.attachments.map((a) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ld-vflow-legend" aria-hidden>
                <FlowMiniLegend scenario={tab} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FlowMiniLegend({ scenario }: { scenario: Scenario }) {
  if (scenario === "success") {
    return (
      <div className="ld-vflow-legend-inner">
        <ShieldCheck size={14} strokeWidth={2} className="ld-vflow-legend-ico" />
        <span>Healthy retrieval and claim alignment — typical production happy path.</span>
      </div>
    );
  }
  if (scenario === "failure") {
    return (
      <div className="ld-vflow-legend-inner">
        <AlertCircle size={14} strokeWidth={2} className="ld-vflow-legend-ico ld-vflow-legend-ico--warn" />
        <span>Weak retrieval and unsupported claims are visible before they look like a “good” answer.</span>
      </div>
    );
  }
  return (
    <div className="ld-vflow-legend-inner">
      <Ticket size={14} strokeWidth={2} className="ld-vflow-legend-ico" />
      <span>Threshold → ticket carries trace, failed claims, and retrieval context into triage.</span>
    </div>
  );
}
