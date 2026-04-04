import { fetchAgentMetrics, fetchTraces } from "@/lib/api";
import type { AgentMetrics } from "@/lib/types";
import { AgentMetricsView } from "@/components/traces/agent-metrics-view";
import Link from "next/link";

export default async function AgentsPage() {
  let traces: Awaited<ReturnType<typeof fetchTraces>> = [];
  try {
    traces = await fetchTraces({ limit: 500 });
  } catch {
    return (
      <div className="trace-debugger">
        <h1 className="tdv-page-title">Agents</h1>
        <p className="tdv-muted">Could not load traces — is the API running?</p>
      </div>
    );
  }

  // Collect unique agent+environment pairs from traces
  const seen = new Map<string, { agent_name: string; environment: string }>();
  for (const t of traces) {
    const key = `${t.agent_name}:${t.environment}`;
    if (!seen.has(key)) seen.set(key, { agent_name: t.agent_name, environment: t.environment });
  }
  const agents = Array.from(seen.values());

  if (agents.length === 0) {
    return (
      <div className="trace-debugger">
        <header className="tdv-page-head">
          <div className="tdv-page-head-titles">
            <h1 className="tdv-page-title">Agents</h1>
            <p className="tdv-page-sub">Per-agent hallucination risk and reliability trends</p>
          </div>
        </header>
        <p className="tdv-muted">No traces ingested yet. <Link href="/traces" className="td-table-link">Ingest a trace</Link> to see agent metrics.</p>
      </div>
    );
  }

  // Fetch metrics for all agents in parallel
  const results = await Promise.allSettled(
    agents.map(({ agent_name, environment }) =>
      fetchAgentMetrics(agent_name, environment, "7d")
    )
  );

  const metricsList: AgentMetrics[] = results
    .filter((r): r is PromiseFulfilledResult<AgentMetrics> => r.status === "fulfilled")
    .map((r) => r.value);

  if (metricsList.length === 0) {
    return (
      <div className="trace-debugger">
        <header className="tdv-page-head">
          <div className="tdv-page-head-titles">
            <h1 className="tdv-page-title">Agents</h1>
            <p className="tdv-page-sub">Per-agent hallucination risk and reliability trends</p>
          </div>
        </header>
        <p className="tdv-muted">Agent metrics not available yet.</p>
      </div>
    );
  }

  return (
    <div className="trace-debugger">
      <header className="tdv-page-head">
        <div className="tdv-page-head-titles">
          <h1 className="tdv-page-title">Agents</h1>
          <p className="tdv-page-sub">
            Per-agent hallucination risk and reliability — last 7 days.
            Each agent is tracked independently so regressions are immediately attributable.
          </p>
        </div>
        <span className="td-traces-badge">{metricsList.length} agent{metricsList.length === 1 ? "" : "s"}</span>
      </header>

      <div className="tdv-flow-stack">
        {metricsList.map((m) => (
          <section
            key={`${m.agent_name}:${m.environment}`}
            className="tdv-rc-panel"
            aria-label={`${m.agent_name} metrics`}
          >
            <AgentMetricsView metrics={m} />
          </section>
        ))}
      </div>
    </div>
  );
}
