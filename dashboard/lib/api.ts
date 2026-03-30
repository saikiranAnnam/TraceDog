import type { ClaimGraphPayload, TraceDetail, TraceListItem } from "./types";

/** API origin only (scheme + host[:port]). No trailing slash; strips a mistaken `/api/v1` suffix. */
export function resolveApiOrigin(): string {
  let s = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (!s) return "http://localhost:8000";
  s = s.replace(/\/+$/, "");
  s = s.replace(/\/api\/v1$/i, "");
  return s;
}

const base = resolveApiOrigin();

export async function fetchTraces(options?: { limit?: number }): Promise<TraceListItem[]> {
  const limit = options?.limit ?? 500;
  const r = await fetch(`${base}/api/v1/traces?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Traces ${r.status}`);
  return r.json();
}

export async function fetchClaimGraph(id: string): Promise<ClaimGraphPayload> {
  const r = await fetch(`${base}/api/v1/traces/${id}/claim-graph`, { cache: "no-store" });
  if (!r.ok) {
    throw new Error(`claim-graph ${r.status}`);
  }
  return r.json() as Promise<ClaimGraphPayload>;
}

export async function fetchTrace(id: string): Promise<TraceDetail> {
  const r = await fetch(`${base}/api/v1/traces/${id}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Trace ${r.status}`);
  return r.json();
}
