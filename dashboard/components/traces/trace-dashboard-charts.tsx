"use client";

import type { RiskBucket } from "@/lib/traces-analytics";

export function ReliabilityLineChart({
  series,
  className = "",
}: {
  series: { t: number; y: number }[];
  className?: string;
}) {
  const w = 560;
  const h = 160;
  const pad = 28;
  if (series.length === 0) {
    return (
      <div className={`td-chart-empty ${className}`.trim()}>
        <p>Not enough reliability data in this window.</p>
      </div>
    );
  }
  const series2 = series.length === 1 ? [series[0]!, series[0]!] : series;
  const ys = series2.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = Math.max(0.02, maxY - minY);
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
      className={`td-chart-svg ${className}`.trim()}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      role="img"
      aria-label="Reliability over time"
    >
      <defs>
        <linearGradient id="td-rel-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--tdv-accent-line, rgba(96,165,250,0.62))" stopOpacity="0.38" />
          <stop offset="100%" stopColor="var(--tdv-accent-line, rgba(96,165,250,0.62))" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="var(--tdv-accent-line, rgba(96,165,250,0.7))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
      <polygon
        fill="url(#td-rel-line)"
        points={`${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`}
      />
    </svg>
  );
}

export function RiskHistogramChart({
  buckets,
  className = "",
}: {
  buckets: RiskBucket[];
  className?: string;
}) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (total === 0) {
    return (
      <div className={`td-chart-empty ${className}`.trim()}>
        <p>No risk scores in this window (missing data).</p>
      </div>
    );
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className={`td-histo ${className}`.trim()} role="img" aria-label="Risk distribution">
      {buckets.map((b) => (
        <div key={b.label} className="td-histo-col">
          <div className="td-histo-bar-wrap">
            <div
              className="td-histo-bar"
              style={{
                height: `${Math.round((b.count / max) * 100)}%`,
                background: b.color,
              }}
              title={`${b.label}: ${b.count}`}
            />
          </div>
          <span className="td-histo-label">{b.label}</span>
          <span className="td-histo-count">{b.count}</span>
        </div>
      ))}
    </div>
  );
}

function donutArc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
): string {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function SuccessDonutChart({
  ok,
  bad,
  className = "",
}: {
  ok: number;
  bad: number;
  className?: string;
}) {
  const total = ok + bad;
  if (total === 0) {
    return (
      <div className={`td-chart-empty ${className}`.trim()}>
        <p>No traces in this view.</p>
      </div>
    );
  }
  const okFrac = ok / total;
  const r = 52;
  const cx = 64;
  const cy = 64;
  const start = -Math.PI / 2;
  const okEnd = start + okFrac * Math.PI * 2;
  const okFill = "rgba(34,197,94,0.62)";
  const okStroke = "rgba(34,197,94,0.22)";
  const badFill = "rgba(244,114,182,0.55)";
  const badStroke = "rgba(244,114,182,0.2)";
  const pathOk =
    okFrac >= 1
      ? <circle cx={cx} cy={cy} r={r} fill={okFill} stroke={okStroke} strokeWidth={1} />
      : okFrac <= 0
        ? null
        : (
            <path
              d={donutArc(cx, cy, r, start, okEnd)}
              fill={okFill}
              stroke={okStroke}
              strokeWidth={0.8}
            />
          );
  const pathBad =
    okFrac < 1 && bad > 0 ? (
      <path
        d={donutArc(cx, cy, r, okEnd, start + Math.PI * 2)}
        fill={badFill}
        stroke={badStroke}
        strokeWidth={0.8}
      />
    ) : null;
  const pct = Math.round(okFrac * 100);
  return (
    <div className={`td-donut-wrap ${className}`.trim()}>
      <svg viewBox="0 0 128 128" width={140} height={140} role="img" aria-label="Success vs failure">
        {pathOk}
        {pathBad}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="var(--tdv-text, #e6e6e6)"
          fontSize="18"
          fontWeight="700"
        >
          {pct}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--tdv-muted, #9a9aa0)" fontSize="11">
          healthy
        </text>
      </svg>
      <div className="td-donut-legend">
        <span>
          <i className="td-dot td-dot--ok" /> OK {ok}
        </span>
        <span>
          <i className="td-dot td-dot--bad" /> Fail {bad}
        </span>
      </div>
    </div>
  );
}

export function QualityLatencyScatter({
  points,
  className = "",
}: {
  points: { x: number; y: number; label: string; color: string }[];
  className?: string;
}) {
  const w = 400;
  const h = 220;
  const pad = 36;
  if (points.length === 0) {
    return <div className="td-chart-empty">No points.</div>;
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = maxX - minX || 1;
  const sy = maxY - minY || 1;
  return (
    <svg
      className={`td-chart-svg ${className}`.trim()}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      role="img"
      aria-label="Quality vs latency"
    >
      {points.map((p, i) => {
        const px = pad + ((p.x - minX) / sx) * (w - pad * 2);
        const py = pad + (1 - (p.y - minY) / sy) * (h - pad * 2);
        return (
          <g key={i}>
            <title>{`${p.label}: reliability ${p.y.toFixed(2)}, latency ${p.x}ms`}</title>
            <circle cx={px} cy={py} r={9} fill={p.color} opacity={0.58} stroke="rgba(255,255,255,0.12)" strokeWidth={0.75} />
          </g>
        );
      })}
      <text x={pad} y={h - 8} fill="var(--tdv-muted, #9a9aa0)" fontSize="10">
        Latency →
      </text>
      <text x={8} y={pad} fill="var(--tdv-muted, #9a9aa0)" fontSize="10" transform={`rotate(-90 8 ${pad})`}>
        Reliability →
      </text>
    </svg>
  );
}

export function ModelTrendLines({
  seriesByModel,
  palette,
  className = "",
}: {
  seriesByModel: { model: string; points: { t: number; y: number }[] }[];
  palette: readonly string[];
  className?: string;
}) {
  const w = 560;
  const h = 180;
  const pad = 32;
  const all: { t: number; y: number }[] = [];
  for (const s of seriesByModel) all.push(...s.points);
  if (all.length === 0) {
    return <div className="td-chart-empty">No trend data.</div>;
  }
  const ys = all.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ySpan = Math.max(0.02, maxY - minY);
  const ts = all.map((p) => p.t);
  const minT = Math.min(...ts);
  const maxT = Math.max(...ts);
  const tSpan = Math.max(60_000, maxT - minT);
  return (
    <svg
      className={`td-chart-svg ${className}`.trim()}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      role="img"
      aria-label="Reliability trend by model"
    >
      {seriesByModel.map((s, mi) => {
        if (s.points.length === 0) return null;
        const color = palette[mi % palette.length]!;
        const pts = s.points.map((p) => {
          const x = pad + ((p.t - minT) / tSpan) * (w - pad * 2);
          const y = pad + (1 - (p.y - minY) / ySpan) * (h - pad * 2);
          return `${x},${y}`;
        });
        return (
          <polyline
            key={s.model}
            fill="none"
            stroke={color}
            strokeOpacity={0.78}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts.join(" ")}
          />
        );
      })}
    </svg>
  );
}
