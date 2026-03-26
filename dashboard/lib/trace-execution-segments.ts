import type { TraceSpan } from "./types";

export type ExecutionSegment = {
  id: string;
  label: string;
  ms: number;
  ok: boolean;
};

/** Map spans to a compact flow; leftover latency becomes "Evaluation & scoring". */
export function buildExecutionSegments(
  spans: TraceSpan[] | undefined,
  totalLatencyMs: number
): ExecutionSegment[] {
  const ordered = [...(spans ?? [])].sort((a, b) => a.position - b.position);
  const sumDur = ordered.reduce((s, x) => s + (x.duration_ms ?? 0), 0);
  const rest = Math.max(0, totalLatencyMs - sumDur);

  const mapped: ExecutionSegment[] = ordered.map((s, i) => {
    const st = (s.span_type || "").toLowerCase();
    let label = s.label || s.span_type || "Step";
    if (st.includes("retriev") || st.includes("retriever")) label = "Retrieval";
    else if (st.includes("llm") || st.includes("generate")) label = "LLM";
    else if (st.includes("score") || st.includes("eval")) label = "Evaluation";
    const raw = (s.status || "ok").toLowerCase();
    const ok = !raw.includes("error") && raw !== "fail" && raw !== "failed";
    return {
      id: `${s.position}-${i}`,
      label,
      ms: s.duration_ms ?? 0,
      ok,
    };
  });

  if (rest >= 8 && mapped.length > 0) {
    mapped.push({
      id: "rest-eval",
      label: "Evaluation & scoring",
      ms: rest,
      ok: true,
    });
  }

  if (mapped.length === 0 && totalLatencyMs > 0) {
    return [
      {
        id: "total",
        label: "Total runtime",
        ms: totalLatencyMs,
        ok: true,
      },
    ];
  }

  return mapped;
}
