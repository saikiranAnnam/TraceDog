"use client";

type Props = {
  /** Current section from scroll spy — drives one-line assistant copy. */
  activeId: string;
};

const MINI_JSON = `{ "trace_id": "a1b2…", "reliability_score": 0.78 }`;

function previewLine(activeId: string): string {
  if (activeId === "debugging" || activeId === "examples") {
    return "Use the trace page to walk input → claims → scores → fix.";
  }
  if (activeId === "evaluation" || activeId === "tracing") {
    return "CGGE attaches claim labels and grounding layers to each trace.";
  }
  if (activeId === "claim-graph") {
    return "Graph JSON is for the dashboard React Flow view.";
  }
  if (activeId === "how-it-works") {
    return "Each hop persists so you can debug later in the dashboard.";
  }
  if (activeId === "architecture") {
    return "Request flow + pipelines: ingest, experiments, and eval metrics in one stack.";
  }
  return "Illustrative shape after ingest — open Traces for real data.";
}

/**
 * Right rail: light context only (not a second document).
 * Stays minimal so the center column stays primary.
 */
export function DocsLiveTracePanel({ activeId }: Props) {
  const line = previewLine(activeId);

  return (
    <aside className="docs-live docs-live--assistant" aria-label="Trace preview">
      <p className="docs-live-assistant-label">Live trace preview</p>

      <details className="docs-live-details">
        <summary className="docs-live-summary">Example response</summary>
        <pre className="docs-live-json docs-live-json--mini">
          <code>{MINI_JSON}</code>
        </pre>
      </details>

      <p className="docs-live-inline-metrics" aria-label="Key scores">
        <span>
          Reliability <strong className="docs-live-num">0.78</strong>
        </span>
        <span className="docs-live-sep" aria-hidden>
          ·
        </span>
        <span>
          Risk <strong className="docs-live-risk">Medium</strong>
        </span>
      </p>

      <p className="docs-live-one-liner">{line}</p>
    </aside>
  );
}
