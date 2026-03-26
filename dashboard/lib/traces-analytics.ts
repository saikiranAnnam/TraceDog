import type { TraceListItem } from "./types";

export type TimeRangeKey = "5m" | "1h" | "24h" | "7d" | "all";
export type RiskFilterKey = "all" | "high" | "low_rel" | "failing";

export function parseTraceTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function filterByTimeRange(
  traces: TraceListItem[],
  range: TimeRangeKey,
  now = Date.now()
): TraceListItem[] {
  if (range === "all") return traces;
  const windows: Record<Exclude<TimeRangeKey, "all">, number> = {
    "5m": 5 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };
  const ms = windows[range];
  return traces.filter((t) => now - parseTraceTime(t.created_at) <= ms);
}

export function traceRowStatus(t: TraceListItem): "good" | "risky" | "fail" {
  const st = t.status?.toLowerCase();
  if (st === "failed" || st === "error") return "fail";
  const ft = t.failure_type;
  if (ft === "contradiction" || ft === "no_retrieval") return "fail";
  if (ft) return "risky";
  const rel = t.reliability_score;
  const risk = t.hallucination_risk;
  if (rel != null && risk != null) {
    if (rel >= 0.62 && risk <= 0.42) return "good";
    if (risk > 0.5 || rel < 0.5) return "risky";
    return "good";
  }
  if (risk != null && risk > 0.5) return "risky";
  if (rel != null && rel < 0.5) return "risky";
  if (rel == null && risk == null) return "risky";
  return "good";
}

export function applyRiskFilters(
  traces: TraceListItem[],
  risk: RiskFilterKey
): TraceListItem[] {
  if (risk === "all") return traces;
  if (risk === "high") {
    return traces.filter((t) => (t.hallucination_risk ?? 0) > 0.5);
  }
  if (risk === "low_rel") {
    return traces.filter((t) => (t.reliability_score ?? 1) < 0.5);
  }
  if (risk === "failing") {
    return traces.filter((t) => traceRowStatus(t) === "fail");
  }
  return traces;
}

export function searchTraces(traces: TraceListItem[], q: string): TraceListItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return traces;
  return traces.filter(
    (t) =>
      t.trace_id.toLowerCase().includes(s) ||
      t.agent_name.toLowerCase().includes(s) ||
      t.model_name.toLowerCase().includes(s) ||
      (t.experiment_tag?.toLowerCase().includes(s) ?? false)
  );
}

export type SummaryStats = {
  total: number;
  avgReliability: number | null;
  avgRisk: number | null;
  failureRate: number;
  avgGrounding: number | null;
};

export function computeSummary(traces: TraceListItem[]): SummaryStats {
  const total = traces.length;
  if (total === 0) {
    return {
      total: 0,
      avgReliability: null,
      avgRisk: null,
      failureRate: 0,
      avgGrounding: null,
    };
  }
  let relSum = 0,
    relN = 0;
  let riskSum = 0,
    riskN = 0;
  let gSum = 0,
    gN = 0;
  let fail = 0;
  for (const t of traces) {
    if (t.reliability_score != null) {
      relSum += t.reliability_score;
      relN++;
    }
    if (t.hallucination_risk != null) {
      riskSum += t.hallucination_risk;
      riskN++;
    }
    if (t.grounding_score != null) {
      gSum += t.grounding_score;
      gN++;
    }
    if (traceRowStatus(t) === "fail") fail++;
  }
  return {
    total,
    avgReliability: relN ? relSum / relN : null,
    avgRisk: riskN ? riskSum / riskN : null,
    failureRate: fail / total,
    avgGrounding: gN ? gSum / gN : null,
  };
}

/** Reliability samples sorted by time for line chart. */
export function reliabilityTimeSeries(traces: TraceListItem[]): { t: number; y: number }[] {
  const pts: { t: number; y: number }[] = [];
  for (const tr of traces) {
    const rel = tr.reliability_score;
    if (rel == null) continue;
    pts.push({ t: parseTraceTime(tr.created_at), y: rel });
  }
  pts.sort((a, b) => a.t - b.t);
  return pts;
}

export type RiskBucket = { label: string; count: number; color: string };

export function riskHistogram(traces: TraceListItem[]): RiskBucket[] {
  let low = 0,
    med = 0,
    high = 0;
  for (const t of traces) {
    const r = t.hallucination_risk;
    if (r == null) continue;
    if (r < 0.33) low++;
    else if (r < 0.66) med++;
    else high++;
  }
  const total = low + med + high || 1;
  return [
    { label: "Low", count: low, color: "#22c55e" },
    { label: "Med", count: med, color: "#fbbf24" },
    { label: "High", count: high, color: "#fb7185" },
  ];
}

export function successFailureSplit(traces: TraceListItem[]): { ok: number; bad: number } {
  let ok = 0,
    bad = 0;
  for (const t of traces) {
    const s = traceRowStatus(t);
    if (s === "fail") bad++;
    else ok++;
  }
  return { ok, bad };
}

export type Anomaly = { message: string; severity: "warn" | "info" };

export function detectAnomalies(traces: TraceListItem[], now = Date.now()): Anomaly[] {
  const out: Anomaly[] = [];
  const fiveMs = 5 * 60 * 1000;
  const recent = traces.filter((t) => now - parseTraceTime(t.created_at) <= fiveMs);
  const lowRel = recent.filter((t) => (t.reliability_score ?? 1) < 0.4).length;
  if (lowRel >= 3) {
    out.push({
      severity: "warn",
      message: `${lowRel} traces dropped below reliability 0.4 in the last 5 minutes.`,
    });
  } else if (lowRel >= 1) {
    out.push({
      severity: "info",
      message: `${lowRel} trace(s) below reliability 0.4 in the last 5 minutes.`,
    });
  }
  const highRisk = recent.filter((t) => (t.hallucination_risk ?? 0) > 0.55).length;
  if (highRisk >= 5) {
    out.push({
      severity: "warn",
      message: `${highRisk} high-risk traces (>0.55) in the last 5 minutes.`,
    });
  }
  return out;
}

export type AgentRollup = {
  agent: string;
  count: number;
  highRisk: number;
  lowRel: number;
  fails: number;
};

export function groupByAgent(traces: TraceListItem[]): AgentRollup[] {
  const map = new Map<string, TraceListItem[]>();
  for (const t of traces) {
    const a = t.agent_name || "unknown";
    if (!map.has(a)) map.set(a, []);
    map.get(a)!.push(t);
  }
  const rows: AgentRollup[] = [];
  for (const [agent, list] of Array.from(map.entries())) {
    let highRisk = 0,
      lowRel = 0,
      fails = 0;
    for (const t of list) {
      if ((t.hallucination_risk ?? 0) > 0.5) highRisk++;
      if ((t.reliability_score ?? 1) < 0.5) lowRel++;
      if (traceRowStatus(t) === "fail") fails++;
    }
    rows.push({ agent, count: list.length, highRisk, lowRel, fails });
  }
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

/** --- Model comparison --- */

export type ModelMetricKey = "balanced" | "grounding" | "reliability" | "low_risk" | "speed";

export type ModelAgg = {
  model: string;
  n: number;
  avgGrounding: number | null;
  avgReliability: number | null;
  avgRisk: number | null;
  avgLatencyMs: number;
  stdRel: number;
  tradeoff: number;
};

function meanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length < 2) return { mean, std: 0 };
  const v =
    values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1);
  return { mean, std: Math.sqrt(v) };
}

export function aggregateByModel(traces: TraceListItem[]): ModelAgg[] {
  const by = new Map<string, TraceListItem[]>();
  for (const t of traces) {
    const m = t.model_name || "unknown";
    if (!by.has(m)) by.set(m, []);
    by.get(m)!.push(t);
  }
  const out: ModelAgg[] = [];
  for (const [model, list] of Array.from(by.entries())) {
    const gVals = list.map((t) => t.grounding_score).filter((x): x is number => x != null);
    const rVals = list.map((t) => t.reliability_score).filter((x): x is number => x != null);
    const kVals = list.map((t) => t.hallucination_risk).filter((x): x is number => x != null);
    const lat = list.map((t) => t.latency_ms);
    const { mean: avgLat } = meanStd(lat);
    const { std: stdRel } = meanStd(rVals.length ? rVals : [0.5]);
    const avgG = gVals.length ? gVals.reduce((a, b) => a + b, 0) / gVals.length : null;
    const avgR = rVals.length ? rVals.reduce((a, b) => a + b, 0) / rVals.length : null;
    const avgK = kVals.length ? kVals.reduce((a, b) => a + b, 0) / kVals.length : null;
    const tradeoff =
      avgR != null ? avgR / Math.max(0.2, avgLat / 1000) : 0;
    out.push({
      model,
      n: list.length,
      avgGrounding: avgG,
      avgReliability: avgR,
      avgRisk: avgK,
      avgLatencyMs: avgLat,
      stdRel: rVals.length >= 2 ? stdRel : 0,
      tradeoff,
    });
  }
  out.sort((a, b) => b.n - a.n);
  return out;
}

export function modelColor(model: string, palette: readonly string[]): string {
  let h = 0;
  for (let i = 0; i < model.length; i++) h = (h * 33 + model.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length]!;
}

export const MODEL_PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#f472b6",
  "#60a5fa",
  "#fbbf24",
  "#2dd4bf",
] as const;

export function pickBestModels(
  aggs: ModelAgg[],
  metric: ModelMetricKey
): {
  bestOverall: ModelAgg | null;
  fastest: ModelAgg | null;
  lowestRisk: ModelAgg | null;
  mostConsistent: ModelAgg | null;
} {
  if (aggs.length === 0) {
    return {
      bestOverall: null,
      fastest: null,
      lowestRisk: null,
      mostConsistent: null,
    };
  }
  const scored = (a: ModelAgg) => {
    const g = a.avgGrounding ?? 0.5;
    const r = a.avgReliability ?? 0.5;
    const k = a.avgRisk ?? 0.5;
    const lat = a.avgLatencyMs;
    switch (metric) {
      case "grounding":
        return g;
      case "reliability":
        return r;
      case "low_risk":
        return 1 - k;
      case "speed":
        return 1 / Math.max(1, lat);
      case "balanced":
      default:
        return 0.35 * r + 0.35 * g + 0.3 * (1 - k) - lat / 50000;
    }
  };
  const bestOverall = [...aggs].sort((a, b) => scored(b) - scored(a))[0] ?? null;
  const fastest = [...aggs].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)[0] ?? null;
  const withRisk = aggs.filter((a) => a.avgRisk != null);
  const lowestRisk =
    withRisk.length > 0
      ? [...withRisk].sort((a, b) => (a.avgRisk ?? 1) - (b.avgRisk ?? 1))[0]!
      : null;
  const withStd = aggs.filter((a) => a.n >= 2);
  const mostConsistent =
    withStd.length > 0
      ? [...withStd].sort((a, b) => a.stdRel - b.stdRel)[0]!
      : aggs[0] ?? null;
  return { bestOverall, fastest, lowestRisk, mostConsistent };
}

export function interpretationLine(t: TraceListItem): string | null {
  const rel = t.reliability_score;
  const risk = t.hallucination_risk;
  if (t.failure_type === "no_retrieval") return "No retrieval path — check pipeline.";
  if (t.failure_type === "contradiction") return "Contradiction flagged — verify sources.";
  if (rel != null && rel < 0.45 && (risk ?? 0) < 0.5) {
    return "Borderline reliability — check retrieval quality.";
  }
  if ((risk ?? 0) > 0.55) return "Elevated hallucination risk — tighten grounding.";
  if (rel != null && rel >= 0.7) return "Solid reliability for this run.";
  return null;
}
