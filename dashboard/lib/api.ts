import type { TraceDetail, TraceListItem } from "./types";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchTraces(options?: { limit?: number }): Promise<TraceListItem[]> {
  const limit = options?.limit ?? 500;
  const r = await fetch(`${base}/api/v1/traces?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Traces ${r.status}`);
  return r.json();
}

export async function fetchTrace(id: string): Promise<TraceDetail> {
  const r = await fetch(`${base}/api/v1/traces/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Trace ${r.status}`);
  return r.json();
}
