import { Fragment } from "react";
import type { TraceDetail } from "@/lib/types";
import { THRESHOLD_WEAK } from "@/lib/trace-quality";

export function GroundingSpectrumVisual({
  score,
  strongThreshold,
  weakThreshold,
  className = "",
}: {
  score: number;
  strongThreshold: number;
  weakThreshold: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, score * 100));
  const tStrongPct = strongThreshold * 100;
  const tWeakPct = weakThreshold * 100;

  return (
    <div className={`tdv-spectrum tdv-card tdv-card--lift ${className}`.trim()}>
      <div className="tdv-spectrum-label-row">
        <span className="tdv-card-title">Grounding vs thresholds</span>
        <span
          className="tdv-spectrum-score"
          title={`Hybrid grounding ${score.toFixed(2)}`}
        >
          {score.toFixed(2)}
        </span>
      </div>
      <div
        className="tdv-spectrum-track"
        role="img"
        aria-label={`Grounding ${score.toFixed(2)}, weak below ${weakThreshold}, strong from ${strongThreshold}`}
      >
        <div className="tdv-spectrum-gradient" />
        <div
          className="tdv-spectrum-tick tdv-spectrum-tick--weak"
          style={{ left: `${tWeakPct}%` }}
          title={`Weak &lt; ${weakThreshold}`}
        />
        <div
          className="tdv-spectrum-tick tdv-spectrum-tick--strong"
          style={{ left: `${tStrongPct}%` }}
          title={`Strong ≥ ${strongThreshold}`}
        />
        <div
          className="tdv-spectrum-dot"
          style={{ left: `${pct}%` }}
          title={`Current ${score.toFixed(2)}`}
        />
      </div>
      <div className="tdv-spectrum-legend">
        <span>weak &lt; {weakThreshold}</span>
        <span>
          review {weakThreshold}–{strongThreshold}
        </span>
        <span>strong ≥ {strongThreshold}</span>
      </div>
    </div>
  );
}

export function ContributionBlendVisual({
  sentenceWeight,
  keywordWeight,
  sentenceScore,
  keywordScore,
  className = "",
}: {
  sentenceWeight: number;
  keywordWeight: number;
  sentenceScore: number | null;
  keywordScore: number | null;
  className?: string;
}) {
  const sw = Math.round(sentenceWeight * 100);
  const kw = Math.round(keywordWeight * 100);
  return (
    <div className={`tdv-contrib tdv-card tdv-card--lift ${className}`.trim()}>
      <span className="tdv-card-title">Blend contribution</span>
      <div
        className="tdv-contrib-stack"
        role="img"
        aria-label={`${sw} percent sentence, ${kw} percent keyword`}
      >
        <div
          className="tdv-contrib-seg tdv-contrib-seg--sent"
          style={{ width: `${sentenceWeight * 100}%` }}
        />
        <div
          className="tdv-contrib-seg tdv-contrib-seg--key"
          style={{ width: `${keywordWeight * 100}%` }}
        />
      </div>
      <div className="tdv-contrib-legend">
        <span>
          Sentence <strong>{sentenceScore != null ? sentenceScore.toFixed(2) : "—"}</strong>{" "}
          <span className="tdv-muted">({sw}%)</span>
        </span>
        <span>
          Keyword <strong>{keywordScore != null ? keywordScore.toFixed(2) : "—"}</strong>{" "}
          <span className="tdv-muted">({kw}%)</span>
        </span>
      </div>
    </div>
  );
}

export function ExecutionSegmentBar({
  segments,
  totalMs,
  wrap = true,
}: {
  segments: { id: string; label: string; ms: number; ok: boolean }[];
  totalMs: number;
  wrap?: boolean;
}) {
  const sum = segments.reduce((s, x) => s + x.ms, 0) || totalMs || 1;
  const body = (
    <>
      <div className="tdv-exec-bar" role="img" aria-label="Time per execution step">
        {segments.map((seg) => {
          const w = Math.max(2, Math.round((seg.ms / sum) * 100));
          return (
            <div
              key={seg.id}
              className="tdv-exec-seg"
              style={{ flex: `${w} 1 0` }}
              title={`${seg.label}: ${seg.ms}ms`}
            />
          );
        })}
      </div>
      <ul className="tdv-exec-list">
        {segments.map((seg) => (
          <li key={seg.id}>
            <span className="tdv-exec-ok" data-ok={seg.ok}>
              {seg.ok ? "✓" : "✗"}
            </span>
            <span className="tdv-exec-name">{seg.label}</span>
            <span className="tdv-exec-ms">{seg.ms}ms</span>
          </li>
        ))}
      </ul>
    </>
  );
  if (wrap) {
    return <div className="tdv-exec">{body}</div>;
  }
  return body;
}

/** Horizontal timeline + proportional bar + step list (single card). */
export function ExecutionTimelineVisual({
  segments,
  totalMs,
}: {
  segments: { id: string; label: string; ms: number; ok: boolean }[];
  totalMs: number;
}) {
  if (segments.length === 0) {
    return (
      <div className="tdv-exec tdv-card tdv-card--lift">
        <span className="tdv-card-title">Execution runtime</span>
        <p className="tdv-muted" style={{ margin: "0.35rem 0 0" }}>
          No spans recorded.
        </p>
      </div>
    );
  }
  return (
    <div className="tdv-exec tdv-card tdv-card--lift">
      <span className="tdv-card-title">Execution runtime</span>
      <p className="tdv-exec-total-caption">
        Total <strong>{totalMs}ms</strong>
      </p>
      <div className="tdv-exec-timeline" role="list" aria-label="Execution steps in order">
        {segments.map((seg, i) => (
          <Fragment key={seg.id}>
            {i > 0 ? <span className="tdv-exec-join" aria-hidden /> : null}
            <div className="tdv-exec-node" role="listitem">
              <span className="tdv-exec-node-label">{seg.label}</span>
              <span className="tdv-exec-node-ms">{seg.ms}ms</span>
              <span className="tdv-exec-node-ok" data-ok={seg.ok}>
                {seg.ok ? "✓" : "✗"}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <ExecutionSegmentBar segments={segments} totalMs={totalMs} wrap={false} />
    </div>
  );
}

/** Placeholder sparkline — flat series from current hybrid score; overview API can replace with real trend. */
export function ConfidenceSparklineVisual({ score }: { score: number | null }) {
  const w = 220;
  const h = 56;
  const pad = 6;
  const series =
    score != null
      ? [score, score, score * 0.98, score * 1.01, score]
      : [0.42, 0.45, 0.41, 0.48, 0.46];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(0.02, max - min);
  const pts = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <div className="tdv-sparkline-card tdv-card tdv-card--lift">
      <span className="tdv-card-title">Confidence trend</span>
      <p className="tdv-sparkline-hint">
        {score != null
          ? "Series padded from this trace’s score — batch view shows drift."
          : "No grounding score — illustrative curve."}
      </p>
      <svg
        className="tdv-sparkline"
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        role="img"
        aria-label="Confidence sparkline"
      >
        <defs>
          <linearGradient id="tdv-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(" ")}
        />
        <polygon
          fill="url(#tdv-spark-fill)"
          points={`${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`}
        />
      </svg>
    </div>
  );
}

/** Single-trace classification bar: where this run sits vs hallucination / low grounding / failure. */
export function FailureMixVisual({ trace }: { trace: TraceDetail }) {
  const g = trace.grounding_score;
  const risk = trace.hallucination_risk;
  let hall = 0;
  let low = 0;
  let fail = 0;
  let ok = 0;
  if (trace.failure_type) {
    fail = 100;
  } else if (g != null && g < THRESHOLD_WEAK) {
    low = 100;
  } else if (risk != null && risk >= 0.45) {
    hall = 100;
  } else {
    ok = 100;
  }
  return (
    <div className="tdv-failure-card tdv-card tdv-card--lift">
      <span className="tdv-card-title">Failure mix (this trace)</span>
      <p className="tdv-sparkline-hint">
        One bar — fleet-wide % needs aggregate metrics from the API.
      </p>
      <div
        className="tdv-failure-stack"
        role="img"
        aria-label="Trace classification: hallucination, low grounding, failure, or healthy"
      >
        {hall > 0 ? (
          <div
            className="tdv-failure-stack-seg tdv-failure-stack-seg--hall"
            style={{ width: `${hall}%` }}
            title="Hallucination risk focus"
          />
        ) : null}
        {low > 0 ? (
          <div
            className="tdv-failure-stack-seg tdv-failure-stack-seg--low"
            style={{ width: `${low}%` }}
            title="Low grounding"
          />
        ) : null}
        {fail > 0 ? (
          <div
            className="tdv-failure-stack-seg tdv-failure-stack-seg--fail"
            style={{ width: `${fail}%` }}
            title="Failure"
          />
        ) : null}
        {ok > 0 ? (
          <div
            className="tdv-failure-stack-seg tdv-failure-stack-seg--ok"
            style={{ width: `${ok}%` }}
            title="Healthy"
          />
        ) : null}
      </div>
      <ul className="tdv-failure-legend">
        <li>
          <span className="tdv-failure-dot tdv-failure-dot--hall" /> Hallucination risk{" "}
          <span className="tdv-muted">{hall}%</span>
        </li>
        <li>
          <span className="tdv-failure-dot tdv-failure-dot--low" /> Low grounding{" "}
          <span className="tdv-muted">{low}%</span>
        </li>
        <li>
          <span className="tdv-failure-dot tdv-failure-dot--fail" /> Failures{" "}
          <span className="tdv-muted">{fail}%</span>
        </li>
        <li>
          <span className="tdv-failure-dot tdv-failure-dot--ok" /> Healthy{" "}
          <span className="tdv-muted">{ok}%</span>
        </li>
      </ul>
    </div>
  );
}
