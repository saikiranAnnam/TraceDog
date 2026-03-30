import type { TraceListItem } from "@/lib/types";

export type PipelineTimePoint = {
  t: number;
  fetchMs: number;
  traceId: string;
  quarantined: number | null;
  cacheHit: boolean | null;
};

/** Traces that include eval_lineage pipeline stats (from list API strip fields). */
export function extractPipelineSeries(traces: TraceListItem[]): {
  series: PipelineTimePoint[];
  summary: {
    count: number;
    avgFetchMs: number | null;
    totalQuarantined: number;
    cacheHits: number;
    cacheSamples: number;
  };
} {
  const rows = traces
    .filter((t) => t.eval_fetch_ms != null && t.eval_fetch_ms >= 0)
    .map((t) => ({
      t: Date.parse(t.created_at),
      fetchMs: t.eval_fetch_ms as number,
      traceId: t.trace_id,
      quarantined: t.eval_rows_quarantined ?? null,
      cacheHit: t.eval_cache_hit ?? null,
    }))
    .filter((r) => !Number.isNaN(r.t))
    .sort((a, b) => a.t - b.t);

  let totalQ = 0;
  let cacheHits = 0;
  let cacheSamples = 0;
  for (const r of rows) {
    if (r.quarantined != null) totalQ += r.quarantined;
    if (r.cacheHit != null) {
      cacheSamples += 1;
      if (r.cacheHit) cacheHits += 1;
    }
  }
  const avg =
    rows.length > 0 ? rows.reduce((s, r) => s + r.fetchMs, 0) / rows.length : null;

  return {
    series: rows,
    summary: {
      count: rows.length,
      avgFetchMs: avg,
      totalQuarantined: totalQ,
      cacheHits,
      cacheSamples,
    },
  };
}
