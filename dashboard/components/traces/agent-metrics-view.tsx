"use client";

import type { AgentMetrics } from "@/lib/types";

function HallucinationTrendChart({ trend }: { trend: AgentMetrics["trend_by_day"] }) {
  const w = 560;
  const h = 140;
  const pad = 28;

  if (trend.length === 0) {
    return <div className="td-chart-empty"><p>No trend data in this window.</p></div>;
  }

  const points = trend.filter((d) => d.avg_hallucination_risk != null);
  if (points.length === 0) {
    return <div className="td-chart-empty"><p>No hallucination risk data yet.</p></div>;
  }

  const series = points.length === 1 ? [points[0]!, points[0]!] : points;
  const ys = series.map((d) => d.avg_hallucination_risk!);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = Math.max(0.02, maxY - minY);
  const pts = series.map((d, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d.avg_hallucination_risk! - minY) / ySpan) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg className="td-chart-svg" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Hallucination risk trend">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--color-rose, #f43f5e)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((d, i) => {
        const x = pad + (i / (series.length - 1)) * (w - pad * 2);
        const y = pad + (1 - (d.avg_hallucination_risk! - minY) / ySpan) * (h - pad * 2);
        return (
          <circle key={d.date} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="var(--color-rose, #f43f5e)">
            <title>{d.date}: {d.avg_hallucination_risk!.toFixed(3)}</title>
          </circle>
        );
      })}
      <text x={pad} y={pad - 6} fontSize="10" fill="currentColor" opacity="0.5">
        {maxY.toFixed(2)}
      </text>
      <text x={pad} y={h - 6} fontSize="10" fill="currentColor" opacity="0.5">
        {minY.toFixed(2)}
      </text>
      <text x={pad} y={h + 14} fontSize="10" fill="currentColor" opacity="0.5">
        {series[0]?.date}
      </text>
      <text x={w - pad} y={h + 14} fontSize="10" fill="currentColor" opacity="0.5" textAnchor="end">
        {series[series.length - 1]?.date}
      </text>
    </svg>
  );
}

function ReliabilityTrendChart({ trend }: { trend: AgentMetrics["trend_by_day"] }) {
  const w = 560;
  const h = 140;
  const pad = 28;

  const points = trend.filter((d) => d.avg_reliability_score != null);
  if (points.length === 0) {
    return <div className="td-chart-empty"><p>No reliability data yet.</p></div>;
  }

  const series = points.length === 1 ? [points[0]!, points[0]!] : points;
  const ys = series.map((d) => d.avg_reliability_score!);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = Math.max(0.02, maxY - minY);
  const pts = series.map((d, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d.avg_reliability_score! - minY) / ySpan) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg className="td-chart-svg" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label="Reliability trend">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--color-teal, #14b8a6)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((d, i) => {
        const x = pad + (i / (series.length - 1)) * (w - pad * 2);
        const y = pad + (1 - (d.avg_reliability_score! - minY) / ySpan) * (h - pad * 2);
        return (
          <circle key={d.date} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="var(--color-teal, #14b8a6)">
            <title>{d.date}: {d.avg_reliability_score!.toFixed(3)}</title>
          </circle>
        );
      })}
      <text x={pad} y={pad - 6} fontSize="10" fill="currentColor" opacity="0.5">{maxY.toFixed(2)}</text>
      <text x={pad} y={h - 6} fontSize="10" fill="currentColor" opacity="0.5">{minY.toFixed(2)}</text>
    </svg>
  );
}

export function AgentMetricsView({ metrics }: { metrics: AgentMetrics }) {
  const agg = metrics.aggregates;
  const failureEntries = Object.entries(metrics.failure_type_counts).sort((a, b) => b[1] - a[1]);
  const sevEntries = Object.entries(metrics.severity_level_counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="trace-debugger">
      <header className="tdv-page-head">
        <div className="tdv-page-head-titles">
          <h1 className="tdv-page-title">{metrics.agent_name}</h1>
          <p className="tdv-page-sub">
            {metrics.environment} · {metrics.window} window · {metrics.trace_count} traces
          </p>
        </div>
      </header>

      <section className="td-summary-grid" aria-label="Aggregate metrics">
        <div className="td-summary-card">
          <span className="td-summary-k">Avg reliability</span>
          <span className="td-summary-v td-summary-v--teal">
            {agg.avg_reliability_score != null ? agg.avg_reliability_score.toFixed(3) : "—"}
          </span>
        </div>
        <div className="td-summary-card">
          <span className="td-summary-k">Avg hallucination risk</span>
          <span className="td-summary-v td-summary-v--amber">
            {agg.avg_hallucination_risk != null ? agg.avg_hallucination_risk.toFixed(3) : "—"}
          </span>
        </div>
        <div className="td-summary-card">
          <span className="td-summary-k">Avg grounding</span>
          <span className="td-summary-v">
            {agg.avg_grounding_score != null ? agg.avg_grounding_score.toFixed(3) : "—"}
          </span>
        </div>
        <div className="td-summary-card">
          <span className="td-summary-k">Traces</span>
          <span className="td-summary-v">{metrics.trace_count}</span>
        </div>
      </section>

      <div className="tdv-flow-stack">
        <section aria-labelledby="hallu-trend-heading">
          <h2 className="tdv-section-h" id="hallu-trend-heading">Hallucination risk over time</h2>
          <p className="tdv-section-sub">Daily average — lower is better. Spikes indicate degraded retrieval or synthesis.</p>
          <div className="td-chart-card">
            <HallucinationTrendChart trend={metrics.trend_by_day} />
          </div>
        </section>

        <section aria-labelledby="rel-trend-heading">
          <h2 className="tdv-section-h" id="rel-trend-heading">Reliability over time</h2>
          <p className="tdv-section-sub">Daily average reliability score — higher is better.</p>
          <div className="td-chart-card">
            <ReliabilityTrendChart trend={metrics.trend_by_day} />
          </div>
        </section>

        {failureEntries.length > 0 ? (
          <section aria-labelledby="fail-heading">
            <h2 className="tdv-section-h" id="fail-heading">Failure breakdown</h2>
            <p className="tdv-section-sub">Root cause categories for traces that failed scoring gates.</p>
            <dl className="tdv-kv-list tdv-kv-list--tight">
              {failureEntries.map(([k, v]) => (
                <div key={k} className="tdv-kv-item">
                  <dt className="tdv-kv-dt"><code className="tdv-code-inline">{k}</code></dt>
                  <dd className="tdv-kv-dd">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {sevEntries.length > 0 ? (
          <section aria-labelledby="sev-heading">
            <h2 className="tdv-section-h" id="sev-heading">Severity distribution</h2>
            <p className="tdv-section-sub">SEV-1 (critical) through SEV-5 (healthy) incident classification counts.</p>
            <dl className="tdv-kv-list tdv-kv-list--tight">
              {sevEntries.map(([k, v]) => (
                <div key={k} className="tdv-kv-item">
                  <dt className="tdv-kv-dt"><code className="tdv-code-inline">{k}</code></dt>
                  <dd className="tdv-kv-dd">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
