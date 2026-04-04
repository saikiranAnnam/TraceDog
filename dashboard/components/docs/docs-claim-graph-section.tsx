"use client";

export function DocsClaimGraphSection() {
  const pipelineSteps = [
    "LLM Response",
    "Claim Decomposition",
    "Evidence Matching",
    "Claim Graph (Nodes + Edges)",
    "Scoring & RCA",
    "Risk + Reliability + Insights",
  ];

  return (
    <section id="claim-graph" className="docs-section" data-doc-section>
      <h2 className="docs-h2">Claim graph</h2>

      <p className="docs-p">
        Claim Graph should be treated as the central debugger for AI reasoning quality. The product goal is not just to
        show a score, but to show exactly which claim failed, which evidence was used, and what should be fixed next.
      </p>

      <div className="docs-callout docs-callout--insight">
        <p className="docs-callout-title">💡 Hero insight</p>
        <p className="docs-p">
          Think of Claim Graph as a dependency graph, but for facts instead of code. Instead of debugging functions,
          you debug claims; instead of stack traces, you inspect evidence.
        </p>
      </div>

      <h3 className="docs-h3">🔷 Product UX spec (target experience)</h3>
      <pre className="docs-live-json docs-live-json--mini">
        <code>{`[ Left Panel ]     [ Center Graph Canvas ]     [ Right Panel ]
Claims List        Interactive Graph           Node Details`}</code>
      </pre>
      <ul className="docs-callout-list">
        <li>
          <strong>Left panel</strong>: claim list with support state (supported / partial / unsupported), fast scan,
          click to focus.
        </li>
        <li>
          <strong>Center canvas</strong>: React Flow graph with claim and evidence nodes, relation-encoded edges.
        </li>
        <li>
          <strong>Right panel</strong>: selected node details, failure reasons, and suggested next actions.
        </li>
      </ul>

      <h3 className="docs-h3">🔷 Visual pipeline</h3>
      <div className="docs-cg-steps" aria-label="Claim graph processing pipeline">
        {pipelineSteps.map((s, i) => (
          <div key={s} className="docs-cg-step">
            <span className="docs-cg-step-num">{i + 1}</span>
            <span className="docs-cg-step-label">{s}</span>
          </div>
        ))}
      </div>

      <h3 className="docs-h3">🔷 Interaction and animation model</h3>
      <ul className="docs-callout-list">
        <li>
          <strong>Build animation</strong>: nodes fade in, edges draw, then relation colors apply.
        </li>
        <li>
          <strong>Hover behavior</strong>: connected edges glow, linked evidence highlights, unrelated nodes dim.
        </li>
        <li>
          <strong>Click behavior</strong>: graph zoom-to-node, right panel updates, selected node pulse.
        </li>
        <li>
          <strong>Risk mode toggle</strong>: Structure view vs Risk Heatmap view for fast triage.
        </li>
      </ul>

      <h3 className="docs-h3">🔷 Trace detail integration (Datadog-style)</h3>
      <pre className="docs-live-json docs-live-json--mini">
        <code>{`[ Header Summary ]
[ Answer + Context ]
[ Claim Graph ]
[ Metrics Panel ]
[ Timeline / Debug Events ]`}</code>
      </pre>
      <ul className="docs-callout-list">
        <li>
          Header must show <code>reliability</code>, <code>risk</code>, <code>severity</code>, model, latency.
        </li>
        <li>Answer and context should support claim-to-evidence text highlighting.</li>
        <li>Claim graph should support fullscreen mode for deeper analysis.</li>
        <li>Metrics panel should include short explainers, not raw numbers only.</li>
        <li>Timeline should expose ingest → extraction → matching → scoring step outputs.</li>
      </ul>

      <h3 className="docs-h3">🔷 Why this design</h3>
      <p className="docs-p">
        Scalar-only scores hide root cause. Claim-level graphing exposes unsupported statements and missing evidence.
        Persisted graph artifacts make incident reviews reproducible and keep explainability aligned with scoring.
      </p>

      <h3 className="docs-h3">🔷 Signals this powers</h3>
      <ul className="docs-callout-list">
        <li>Grounding score</li>
        <li>Hallucination risk</li>
        <li>Attribution recall</li>
        <li>Root-cause labels and severity context</li>
      </ul>

      <h3 className="docs-h3">🔷 Build order (execution plan)</h3>
      <ul className="docs-callout-list">
        <li>
          <strong>Phase 1</strong>: 3-panel graph UI, claim click → evidence highlight, right-panel debugger.
        </li>
        <li>
          <strong>Phase 2</strong>: animations, risk heatmap mode, before/after compare mode.
        </li>
        <li>
          <strong>Phase 3</strong>: RCA recommendations, timeline debugger, score explainability.
        </li>
      </ul>

      <h3 className="docs-h3">🔷 Example walkthrough</h3>
      <pre className="docs-live-json docs-live-json--mini">
        <code>{`Input:
Q: How long does refund processing take?
Context: Processing takes up to seven business days after approval.

Response:
Refunds are processed within seven days after manager approval.

Claim Graph:
[Claim: "Refund takes up to seven days after manager approval"]
        ↓ (supported, score: 0.82)
[Evidence: "Processing takes up to seven business days after approval"]

Final signals:
- Grounding: 0.81
- Hallucination risk: 0.18
- Reliability: 0.84
- Severity: SEV-5`}</code>
      </pre>
    </section>
  );
}

