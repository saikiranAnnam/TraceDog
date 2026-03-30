"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import {
  applyRiskFilters,
  filterByTimeRange,
  interpretationLine,
  searchTraces,
  traceRowStatus,
  type RiskFilterKey,
  type TimeRangeKey,
} from "@/lib/traces-analytics";

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

  return (
    <div className="trace-debugger td-traces-page">
      <div className="td-traces-layout">
        <div className="td-traces-main">
          <header className="td-traces-header">
            <div>
              <h1 className="tdv-page-title">Traces</h1>
              <p className="tdv-section-sub td-traces-hero-sub">
                Search and filter runs — charts and model comparison live on{" "}
                <Link href="/overview" className="td-table-link">
                  Overview
                </Link>
                .
              </p>
            </div>
            <span className="td-traces-badge">{traces.length} loaded</span>
          </header>

          <section className="td-table-section" aria-label="Trace list">
            <h2 className="tdv-section-h td-traces-section-heading">All matching traces</h2>
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

        <aside className="td-traces-rail" aria-label="Filters">
          <div className="td-rail-sticky">
            <div className="td-rail-body">
              <div className="td-rail-section">
                <h3 className="td-rail-h">Trace list</h3>
                <label className="td-rail-field">
                  <span className="td-rail-label">Search</span>
                  <input
                    type="search"
                    className="td-filter-search td-rail-input"
                    placeholder="ID, agent, model, experiment…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search traces"
                  />
                </label>
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
                <label className="td-rail-field">
                  <span className="td-rail-label">Risk</span>
                  <select
                    className="td-filter-select td-rail-input"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value as RiskFilterKey)}
                    aria-label="Risk filter"
                  >
                    <option value="all">All traces</option>
                    <option value="high">High risk (&gt;0.5)</option>
                    <option value="low_rel">Low reliability (&lt;0.5)</option>
                    <option value="failing">Failures only</option>
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
