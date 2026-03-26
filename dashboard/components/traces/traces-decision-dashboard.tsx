"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import {
  applyRiskFilters,
  computeSummary,
  detectAnomalies,
  filterByTimeRange,
  groupByAgent,
  interpretationLine,
  reliabilityTimeSeries,
  riskHistogram,
  searchTraces,
  successFailureSplit,
  traceRowStatus,
  type RiskFilterKey,
  type TimeRangeKey,
} from "@/lib/traces-analytics";
import {
  ReliabilityLineChart,
  RiskHistogramChart,
  SuccessDonutChart,
} from "@/components/traces/trace-dashboard-charts";
import { ModelComparisonPanel } from "@/components/traces/model-comparison-panel";

function MiniBar({ value }: { value: number | null }) {
  const v = value == null ? null : Math.max(0, Math.min(1, value));
  return (
    <div className="td-mini-bar" title={v == null ? "—" : v.toFixed(3)}>
      <div
        className="td-mini-bar-fill td-mini-bar-fill--rel"
        style={{ width: v == null ? "0%" : `${v * 100}%` }}
      />
      <span className="td-mini-bar-num">{v == null ? "—" : v.toFixed(2)}</span>
    </div>
  );
}

function MiniBarRisk({ value }: { value: number | null }) {
  const v = value == null ? null : Math.max(0, Math.min(1, value));
  return (
    <div className="td-mini-bar" title={v == null ? "—" : v.toFixed(3)}>
      <div
        className="td-mini-bar-fill td-mini-bar-fill--risk"
        style={{ width: v == null ? "0%" : `${v * 100}%` }}
      />
      <span className="td-mini-bar-num">{v == null ? "—" : v.toFixed(2)}</span>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof traceRowStatus> }) {
  const cls =
    status === "good" ? "td-pill td-pill--good" : status === "fail" ? "td-pill td-pill--fail" : "td-pill td-pill--risky";
  const label = status === "good" ? "GOOD" : status === "fail" ? "FAIL" : "RISKY";
  return <span className={cls}>{label}</span>;
}

export function TracesDecisionDashboard({ traces }: { traces: TraceListItem[] }) {
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("24h");
  const [riskFilter, setRiskFilter] = useState<RiskFilterKey>("all");

  const filtered = useMemo(() => {
    let t = filterByTimeRange(traces, timeRange);
    t = searchTraces(t, search);
    t = applyRiskFilters(t, riskFilter);
    return t;
  }, [traces, timeRange, search, riskFilter]);

  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const lineSeries = useMemo(() => reliabilityTimeSeries(filtered), [filtered]);
  const histo = useMemo(() => riskHistogram(filtered), [filtered]);
  const donut = useMemo(() => successFailureSplit(filtered), [filtered]);
  const anomalies = useMemo(() => detectAnomalies(traces), [traces]);
  const agents = useMemo(() => groupByAgent(filtered).slice(0, 8), [filtered]);

  return (
    <div className="td-traces-page">
      <header className="td-traces-header">
        <div>
          <h1 className="td-traces-title">Trace health</h1>
          <p className="td-traces-sub">
            Is the system healthy right now? Summary first — details in the table.
          </p>
        </div>
        <span className="td-traces-badge">{traces.length} loaded</span>
      </header>

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
            <h2 className="td-chart-title">Reliability over time</h2>
            <p className="td-chart-desc">Drift and regressions in the selected window.</p>
          </div>
          <ReliabilityLineChart series={lineSeries} />
        </div>
        <div className="td-chart-card">
          <div className="td-chart-head">
            <h2 className="td-chart-title">Risk distribution</h2>
            <p className="td-chart-desc">Count of traces by hallucination risk band.</p>
          </div>
          <RiskHistogramChart buckets={histo} />
        </div>
        <div className="td-chart-card td-chart-card--donut">
          <div className="td-chart-head">
            <h2 className="td-chart-title">Success vs failure</h2>
            <p className="td-chart-desc">GOOD+RISKY vs FAIL classification.</p>
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

      <section className="td-filter-bar" aria-label="Filters">
        <input
          type="search"
          className="td-filter-search"
          placeholder="Search trace ID, agent, model, experiment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search traces"
        />
        <select
          className="td-filter-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as RiskFilterKey)}
          aria-label="Risk filter"
        >
          <option value="all">All traces</option>
          <option value="high">High risk (&gt;0.5)</option>
          <option value="low_rel">Low reliability (&lt;0.5)</option>
          <option value="failing">Failures only</option>
        </select>
        <select
          className="td-filter-select"
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
      </section>

      {agents.length > 0 ? (
        <section className="td-agent-group" aria-label="By agent">
          <h2 className="td-section-title">By agent</h2>
          <div className="td-agent-grid">
            {agents.map((a) => (
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

      <ModelComparisonPanel traces={traces} />

      <section className="td-table-section" aria-label="Trace list">
        <h2 className="td-section-title">All matching traces</h2>
        {filtered.length === 0 ? (
          <div className="td-empty">
            <p>No traces match your filters.</p>
            {search || riskFilter !== "all" ? (
              <p className="td-empty-hint">Try clearing search or setting filters to “All”.</p>
            ) : (
              <p className="td-empty-hint">No high-risk traces — nice.</p>
            )}
          </div>
        ) : (
          <div className="td-table-wrap">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>ID</th>
                  <th>Agent</th>
                  <th>Model</th>
                  <th>Reliability</th>
                  <th>Risk</th>
                  <th>Grounding</th>
                  <th>ms</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const st = traceRowStatus(t);
                  const tip = interpretationLine(t);
                  return (
                    <tr key={t.trace_id} className="td-table-row" title={tip ?? undefined}>
                      <td>
                        <StatusPill status={st} />
                      </td>
                      <td>
                        <Link href={`/traces/${t.trace_id}`} className="td-table-link">
                          {t.trace_id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td>{t.agent_name}</td>
                      <td className="td-table-muted">{t.model_name}</td>
                      <td>
                        <MiniBar value={t.reliability_score} />
                      </td>
                      <td>
                        <MiniBarRisk value={t.hallucination_risk} />
                      </td>
                      <td>
                        <MiniBar value={t.grounding_score ?? null} />
                      </td>
                      <td className="td-table-num">{t.latency_ms}</td>
                      <td className="td-table-time">{t.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
