import type { AgentMetrics, ClaimGraphPayload, ExecutionGraphPayload, TraceDetail, TraceListItem } from "./types";

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

export async function fetchExecutionGraph(id: string): Promise<ExecutionGraphPayload> {
  const r = await fetch(`${base}/api/v1/traces/${id}/execution-graph`, { cache: "no-store" });
  if (!r.ok) throw new Error(`execution-graph ${r.status}`);
  return r.json();
}

export async function fetchAgentMetrics(
  agentName: string,
  environment: string,
  window = "7d"
): Promise<AgentMetrics> {
  const params = new URLSearchParams({ environment, window });
  const r = await fetch(
    `${base}/api/v1/agents/${encodeURIComponent(agentName)}/metrics?${params}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(`agent-metrics ${r.status}`);
  return r.json();
}

export async function fetchAllAgentNames(traces: TraceListItem[]): Promise<{ agent_name: string; environment: string }[]> {
  const seen = new Map<string, string>();
  for (const t of traces) {
    const key = `${t.agent_name}:${t.environment}`;
    if (!seen.has(key)) seen.set(key, t.environment);
  }
  return Array.from(seen.entries()).map(([k, env]) => ({
    agent_name: k.split(":")[0]!,
    environment: env,
  }));
}
