"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useState, type KeyboardEvent } from "react";
import clsx from "clsx";

import type { TraceListItem } from "@/lib/types";
import { extractPipelineSeries } from "@/lib/data-pipeline-analytics";
import { DataFetchMsChart } from "@/components/data/data-fetch-ms-chart";
import { DataPipelineTabbedCanvas } from "@/components/data/data-pipeline-tabbed-canvas";
import { AdminDataPipelineRunner } from "@/components/data/admin-data-pipeline-runner";

type DataPageTab = "overview" | "pipeline" | "checks";

const TABS: { id: DataPageTab; label: string; caption: string }[] = [
  {
    id: "overview",
    label: "Overview",
    caption: "Operational health for the eval data plane in this trace sample.",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    caption: "How sources, fetch, and ingest fit together — design reference, not live telemetry.",
  },
  {
    id: "checks",
    label: "Checks",
    caption: "Run pytest and smoke jobs on the API host. Requires admin credentials.",
  },
];

/** @param tracesServerOrder — server returns traces (e.g. limit 500); keep for count context */
export function DataPipelineOverview({ traces }: { traces: TraceListItem[] }) {
  const [tab, setTab] = useState<DataPageTab>("overview");
  const baseId = useId();
  const tabIds = TABS.map((t, i) => `${baseId}-data-tab-${i}`);
  const panelId = `${baseId}-data-panel`;

  const { series, summary } = useMemo(() => extractPipelineSeries(traces), [traces]);
  const chartSeries = useMemo(() => series.map((p) => ({ t: p.t, y: p.fetchMs })), [series]);

  const cacheLabel =
    summary.cacheSamples > 0 ? `${summary.cacheHits} / ${summary.cacheSamples}` : "—";

  const recentPipelineRows = useMemo(() => {
    const withStats = traces.filter((t) => t.eval_fetch_ms != null);
    const sorted = [...withStats].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const picked = sorted.slice(0, 10);
    if (picked.length > 0) return picked;
    return [...traces]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 8);
  }, [traces]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
        setTab(TABS[next]!.id);
        document.getElementById(tabIds[next]!)?.focus();
      }
    },
    [tabIds],
  );

  const active = TABS.find((t) => t.id === tab)!;
  const activeTabIndex = TABS.findIndex((x) => x.id === tab);

  return (
    <div className="td-data-page td-data-page--tabbed">
      <header className="td-data-product-header">
        <div className="td-data-product-header-main">
          <h1 className="tdv-page-title">Data pipeline</h1>
          <p className="td-data-product-tagline tdv-section-sub">
            Eval source plane: registry, fetch pipeline, and lineage on ingested traces.
          </p>
        </div>
        <nav className="td-data-product-header-links" aria-label="Data pipeline docs">
          <Link href="/docs#data-pipeline" className="td-data-product-doc-link">
            Data plane
          </Link>
          <Link href="/docs#architecture" className="td-data-product-doc-link">
            Architecture
          </Link>
        </nav>
      </header>

      <div className="td-data-page-tab-shell">
        <div className="td-data-page-tabs" role="tablist" aria-label="Data dashboard sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={tabIds[i]!}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={panelId}
              tabIndex={tab === t.id ? 0 : -1}
              className={clsx("td-data-page-tab", tab === t.id && "td-data-page-tab--active")}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="td-data-page-tab-caption">{active.caption}</p>
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabIds[activeTabIndex]!}
          className="td-data-page-tab-panel"
        >
          {tab === "overview" ? (
            <div className="td-data-overview">
              <div className="td-data-kpi-grid" role="list" aria-label="Pipeline KPIs">
                <div className="td-data-kpi-card" role="listitem">
                  <span className="td-data-kpi-label">Eval points</span>
                  <span className="td-data-kpi-value">{summary.count}</span>
                  <span className="td-data-kpi-hint">Traces with fetch_ms</span>
                </div>
                <div className="td-data-kpi-card" role="listitem">
                  <span className="td-data-kpi-label">Avg fetch ms</span>
                  <span className="td-data-kpi-value">
                    {summary.avgFetchMs != null ? summary.avgFetchMs.toFixed(1) : "—"}
                  </span>
                  <span className="td-data-kpi-hint">In loaded sample</span>
                </div>
                <div className="td-data-kpi-card" role="listitem">
                  <span className="td-data-kpi-label">Cache hits</span>
                  <span className="td-data-kpi-value">{cacheLabel}</span>
                  <span className="td-data-kpi-hint">When reported</span>
                </div>
                <div className="td-data-kpi-card" role="listitem">
                  <span className="td-data-kpi-label">Quarantined rows</span>
                  <span className="td-data-kpi-value">{summary.totalQuarantined}</span>
                  <span className="td-data-kpi-hint">Sum in sample</span>
                </div>
              </div>

              <section className="td-data-health-card" aria-labelledby="data-fetch-latency-heading">
                <div className="td-data-health-card-top">
                  <div>
                    <h2 className="td-data-health-card-title" id="data-fetch-latency-heading">
                      Source fetch latency
                    </h2>
                    <p className="td-data-health-card-desc">
                      From <code className="docs-inline-code">eval_lineage.pipeline_stats.fetch_ms</code> on the last{" "}
                      {traces.length} loaded rows. Not a substitute for central metrics.
                    </p>
                  </div>
                  <div className="td-data-metric-chips" aria-hidden>
                    <span className="td-data-metric-chip">Points {summary.count}</span>
                    <span className="td-data-metric-chip">
                      Avg {summary.avgFetchMs != null ? `${summary.avgFetchMs.toFixed(0)} ms` : "—"}
                    </span>
                    <span className="td-data-metric-chip">Cache {cacheLabel}</span>
                  </div>
                </div>
                <div className="td-data-chart-plot">
                  <DataFetchMsChart series={chartSeries} embedded />
                </div>
              </section>

              <section className="td-data-recent-card" aria-labelledby="data-recent-activity-heading">
                <h2 className="td-data-recent-card-title" id="data-recent-activity-heading">
                  Recent trace activity
                </h2>
                <p className="td-data-recent-card-desc">
                  Newest rows first (pipeline-enriched traces when available).
                </p>
                {recentPipelineRows.length === 0 ? (
                  <p className="td-data-recent-empty">No traces in this sample.</p>
                ) : (
                  <ul className="td-data-recent-list">
                    {recentPipelineRows.map((row) => (
                      <li key={row.trace_id} className="td-data-recent-row">
                        <div className="td-data-recent-main">
                          <Link href={`/traces/${row.trace_id}`} className="td-data-recent-link">
                            {row.trace_id.slice(0, 8)}…
                          </Link>
                          <span className="td-data-recent-meta">{row.model_name}</span>
                        </div>
                        <div className="td-data-recent-stats">
                          {row.eval_fetch_ms != null ? (
                            <span className="td-data-recent-pill">{row.eval_fetch_ms} ms</span>
                          ) : null}
                          {row.eval_cache_hit === true ? (
                            <span className="td-data-recent-pill td-data-recent-pill--cache">cache</span>
                          ) : null}
                          {(row.eval_rows_quarantined ?? 0) > 0 ? (
                            <span className="td-data-recent-pill td-data-recent-pill--warn">
                              +{row.eval_rows_quarantined} q
                            </span>
                          ) : null}
                          <time className="td-data-recent-time" dateTime={row.created_at}>
                            {new Date(row.created_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}

          {tab === "pipeline" ? (
            <div className="td-data-pipeline-tab">
              <div className="td-data-pipeline-split">
                <div className="td-data-pipeline-diagram">
                  <p className="td-data-figure-label">Interactive diagram</p>
                  <div className="arch-flow-card td-data-flow-card td-pipeline-viz-shell">
                    <DataPipelineTabbedCanvas />
                  </div>
                </div>
                <aside className="td-data-pipeline-aside" aria-label="Pipeline design notes">
                  <h2 className="td-data-pipeline-aside-title">Understand the design</h2>
                  <p className="td-data-pipeline-aside-body">
                    Use <strong>High-level</strong> for the product path (sources → API → storage). Use{" "}
                    <strong>Internal</strong> for <code className="docs-inline-code">evaluation/sources</code> stages —
                    click a module for details.
                  </p>
                  <ul className="td-data-pipeline-aside-links">
                    <li>
                      <Link href="/docs#data-pipeline" className="td-table-link">
                        Docs — Data plane
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs#architecture" className="td-table-link">
                        Docs — Architecture
                      </Link>
                    </li>
                  </ul>
                </aside>
              </div>
            </div>
          ) : null}

          {tab === "checks" ? (
            <div className="td-data-checks-tab">
              <div className="td-data-checks-zone">
                <div className="td-data-checks-banner">
                  <span className="td-data-admin-badge">Admin</span>
                  <div>
                    <h2 className="td-data-checks-banner-title">Operator controls</h2>
                    <p className="td-data-checks-banner-desc">
                      Run pytest and smoke scripts on the <strong>API server</strong>. Paste{" "}
                      <code className="docs-inline-code">ADMIN_API_KEY</code> — same host as your traces (
                      <code className="docs-inline-code">NEXT_PUBLIC_API_URL</code>).
                    </p>
                  </div>
                </div>
                <AdminDataPipelineRunner />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
