"use client";

/** Source-stage fetch latency (ms) from eval_lineage.pipeline_stats, chronological. */
export function DataFetchMsChart({
  series,
  className = "",
  /** When true, empty state fills the chart plot area (use inside a bordered container). */
  embedded = false,
}: {
  series: { t: number; y: number }[];
  className?: string;
  embedded?: boolean;
}) {
  const w = 560;
  const h = 170;
  const pad = 28;
  if (series.length === 0) {
    return (
      <div
        className={`td-data-fetch-chart-empty ${embedded ? "td-data-fetch-chart-empty--embedded" : ""} ${className}`.trim()}
      >
        <p className="td-data-fetch-chart-empty-title">No series yet</p>
        <p className="td-data-fetch-chart-empty-desc">
          No eval traces with <code className="docs-inline-code">eval_lineage.pipeline_stats</code> in this sample. Run
          an eval with TraceDog ingest to populate fetch latency.
        </p>
      </div>
    );
  }
  const series2 = series.length === 1 ? [series[0]!, series[0]!] : series;
  const ys = series2.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = Math.max(1, maxY - minY);
  const minT = series2[0]!.t;
  const maxT = series2[series2.length - 1]!.t;
  const tSpan = Math.max(60_000, maxT - minT);
  const pts = series2.map((p) => {
    const x = pad + ((p.t - minT) / tSpan) * (w - pad * 2);
    const y = pad + (1 - (p.y - minY) / ySpan) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg
      className={`td-chart-svg td-data-fetch-chart-svg ${className}`.trim()}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      role="img"
      aria-label="Data pipeline fetch latency over time"
    >
      <defs>
        <linearGradient id="td-pipe-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--tdv-teal, #14b8a6)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--tdv-teal, #14b8a6)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="var(--tdv-teal, #14b8a6)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
      <polygon
        fill="url(#td-pipe-line)"
        points={`${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`}
      />
    </svg>
  );
}
