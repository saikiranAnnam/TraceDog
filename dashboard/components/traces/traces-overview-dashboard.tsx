"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import {
  computeSummary,
  detectAnomalies,
  filterByTimeRange,
  groupByAgent,
  reliabilityTimeSeries,
  riskHistogram,
  successFailureSplit,
  type ModelMetricKey,
  type TimeRangeKey,
} from "@/lib/traces-analytics";
import {
  ReliabilityLineChart,
  RiskHistogramChart,
  SuccessDonutChart,
} from "@/components/traces/trace-dashboard-charts";
import { ModelComparisonPanel } from "@/components/traces/model-comparison-panel";
import { AdminSmokeExperiment } from "@/components/traces/admin-smoke-experiment";

function toggleInSet<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

export function TracesOverviewDashboard({ traces }: { traces: TraceListItem[] }) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => new Set());
  const [metric, setMetric] = useState<ModelMetricKey>("balanced");

  const models = useMemo(
    () => Array.from(new Set(traces.map((t) => t.model_name))).sort(),
    [traces]
  );
  const agents = useMemo(
    () => Array.from(new Set(traces.map((t) => t.agent_name))).sort(),
    [traces]
  );
  const envs = useMemo(
    () => Array.from(new Set(traces.map((t) => t.environment))).sort(),
    [traces]
  );
  const experiments = useMemo(() => {
    const s = new Set<string>();
    for (const t of traces) {
      const e = t.experiment_tag;
      if (e) s.add(e);
    }
    return Array.from(s).sort();
  }, [traces]);

  const scopeFiltered = useMemo(() => {
    let t = filterByTimeRange(traces, timeRange);
    if (agentFilter !== "all") t = t.filter((x) => x.agent_name === agentFilter);
    if (envFilter !== "all") t = t.filter((x) => x.environment === envFilter);
    if (experimentFilter !== "all") {
      t = t.filter((x) => (x.experiment_tag ?? "") === experimentFilter);
    }
    if (selectedModels.size > 0) {
      t = t.filter((x) => selectedModels.has(x.model_name));
    }
    return t;
  }, [traces, timeRange, agentFilter, envFilter, experimentFilter, selectedModels]);

  const summary = useMemo(() => computeSummary(scopeFiltered), [scopeFiltered]);
  const lineSeries = useMemo(() => reliabilityTimeSeries(scopeFiltered), [scopeFiltered]);
  const histo = useMemo(() => riskHistogram(scopeFiltered), [scopeFiltered]);
  const donut = useMemo(() => successFailureSplit(scopeFiltered), [scopeFiltered]);
  const anomalies = useMemo(() => detectAnomalies(traces), [traces]);
  const agentsGrouped = useMemo(() => groupByAgent(scopeFiltered).slice(0, 8), [scopeFiltered]);

  return (
    <div className="trace-debugger td-traces-page">
      <div className="td-traces-layout">
        <div className="td-traces-main">
          <header className="td-traces-header">
            <div>
              <h1 className="tdv-page-title">Trace health</h1>
              <p className="tdv-section-sub td-traces-hero-sub">
                Is the system healthy right now?                 Scope filters on the right — open{" "}
                <Link href="/traces" className="td-table-link">
                  Traces
                </Link>{" "}
                to search and slice the list.
              </p>
            </div>
            <span className="td-traces-badge">{traces.length} loaded</span>
          </header>

          <AdminSmokeExperiment />

          <p className="td-overview-data-link">
            <Link href="/data" className="td-table-link">
              Data pipeline
            </Link>
            — fetch latency from eval traces, run tests from the dashboard.
          </p>

          <section className="td-summary-grid" aria-label="Summary metrics">
            <div className="td-summary-card">
              <span className="td-summary-k">Total traces</span>
              <span className="td-summary-v">{summary.total.toLocaleString()}</span>
            </div>
            <div className="td-summary-card">
              <span className="td-summary-k">Avg reliability</span>
              <span className="td-summary-v td-summary-v--teal">
                {summary.avgReliability != null ? summary.avgReliability.toFixed(2) : "—"}
              </span>
            </div>
            <div className="td-summary-card">
              <span className="td-summary-k">Avg risk</span>
              <span className="td-summary-v td-summary-v--amber">
                {summary.avgRisk != null ? summary.avgRisk.toFixed(2) : "—"}
              </span>
            </div>
            <div className="td-summary-card">
              <span className="td-summary-k">Failure rate</span>
              <span className="td-summary-v td-summary-v--rose">
                {summary.total ? `${Math.round(summary.failureRate * 100)}%` : "—"}
              </span>
            </div>
          </section>

          <section className="td-charts-grid" aria-label="Charts">
            <div className="td-chart-card">
              <div className="td-chart-head">
                <h2 className="tdv-section-h">Reliability over time</h2>
                <p className="tdv-section-sub td-chart-head-desc">Drift and regressions in the selected window.</p>
              </div>
              <ReliabilityLineChart series={lineSeries} />
            </div>
            <div className="td-chart-card">
              <div className="td-chart-head">
                <h2 className="tdv-section-h">Risk distribution</h2>
                <p className="tdv-section-sub td-chart-head-desc">Count of traces by hallucination risk band.</p>
              </div>
              <RiskHistogramChart buckets={histo} />
            </div>
            <div className="td-chart-card td-chart-card--donut">
              <div className="td-chart-head">
                <h2 className="tdv-section-h">Success vs failure</h2>
                <p className="tdv-section-sub td-chart-head-desc">GOOD+RISKY vs FAIL classification.</p>
              </div>
              <SuccessDonutChart ok={donut.ok} bad={donut.bad} />
            </div>
          </section>

          {anomalies.length > 0 ? (
            <div className="td-anomaly-banner" role="status">
              {anomalies.map((a, i) => (
                <p key={i} className={a.severity === "warn" ? "td-anomaly-warn" : "td-anomaly-info"}>
                  {a.severity === "warn" ? "⚠️ " : ""}
                  {a.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="td-anomaly-ok">No high-severity anomalies in the last 5 minutes.</p>
          )}

          {agentsGrouped.length > 0 ? (
            <section className="td-agent-group" aria-label="By agent">
              <h2 className="tdv-section-h td-traces-section-heading">By agent</h2>
              <div className="td-agent-grid">
                {agentsGrouped.map((a) => (
                  <div key={a.agent} className="td-agent-card">
                    <div className="td-agent-name">{a.agent}</div>
                    <div className="td-agent-meta">
                      <span>{a.count} traces</span>
                      <span className="td-agent-stat">High risk: {a.highRisk}</span>
                      <span className="td-agent-stat">Low rel: {a.lowRel}</span>
                      <span className="td-agent-stat">Fails: {a.fails}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <ModelComparisonPanel traces={scopeFiltered} metric={metric} />
        </div>

        <aside className="td-traces-rail" aria-label="Overview scope">
          <div className="td-rail-sticky">
            <div className="td-rail-body">
              <div className="td-rail-section">
                <h3 className="td-rail-h">Scope</h3>
              <label className="td-rail-field">
                <span className="td-rail-label">Time range</span>
                <select
                  className="td-filter-select td-rail-input"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
                  aria-label="Time range"
                >
                  <option value="5m">Last 5 min</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="all">All time</option>
                </select>
              </label>
              </div>

              <div className="td-rail-section td-rail-section--model">
                <h3 className="td-rail-h">Model comparison</h3>
              <p className="td-rail-hint">Same time range as above. Narrows charts and the model table.</p>
              <span className="td-model-filter-label td-rail-chip-label">Models</span>
              <div className="td-model-chips td-model-chips--rail">
                {models.map((m) => {
                  const on = selectedModels.size === 0 || selectedModels.has(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`td-chip ${on ? "td-chip--on" : "td-chip--off"}`}
                      onClick={() => {
                        setSelectedModels((prev) => {
                          if (prev.size === 0) return new Set([m]);
                          return toggleInSet(prev, m);
                        });
                      }}
                      title={selectedModels.size === 0 ? "Click to focus one or more models" : "Toggle model"}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <p className="td-model-hint td-rail-hint">
                {selectedModels.size === 0 ? "All models included — click to focus." : `${selectedModels.size} selected`}
              </p>

              <label className="td-rail-field">
                <span className="td-rail-label">Agent</span>
                <select
                  className="td-filter-select td-rail-input"
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                >
                  <option value="all">All agents</option>
                  {agents.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="td-rail-field">
                <span className="td-rail-label">Environment</span>
                <select
                  className="td-filter-select td-rail-input"
                  value={envFilter}
                  onChange={(e) => setEnvFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  {envs.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
              <label className="td-rail-field">
                <span className="td-rail-label">Experiment tag</span>
                <select
                  className="td-filter-select td-rail-input"
                  value={experimentFilter}
                  onChange={(e) => setExperimentFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  {experiments.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
              <label className="td-rail-field">
                <span className="td-rail-label">“Best overall” metric</span>
                <select
                  className="td-filter-select td-rail-input"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as ModelMetricKey)}
                >
                  <option value="balanced">Balanced (R+G−risk)</option>
                  <option value="grounding">Highest grounding</option>
                  <option value="reliability">Highest reliability</option>
                  <option value="low_risk">Lowest risk</option>
                  <option value="speed">Fastest (avg latency)</option>
                </select>
              </label>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
