"use client";

import { useMemo, useState } from "react";
import type { TraceListItem } from "@/lib/types";
import {
  aggregateByModel,
  filterByTimeRange,
  modelColor,
  MODEL_PALETTE,
  pickBestModels,
  reliabilityTimeSeries,
  type ModelMetricKey,
  type TimeRangeKey,
} from "@/lib/traces-analytics";
import {
  ModelTrendLines,
  QualityLatencyScatter,
} from "@/components/traces/trace-dashboard-charts";

function toggleInSet<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

export function ModelComparisonPanel({ traces }: { traces: TraceListItem[] }) {
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

  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => new Set());
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [experimentFilter, setExperimentFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("24h");
  const [metric, setMetric] = useState<ModelMetricKey>("balanced");

  const baseFiltered = useMemo(() => {
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

  const aggs = useMemo(() => aggregateByModel(baseFiltered), [baseFiltered]);
  const best = useMemo(() => pickBestModels(aggs, metric), [aggs, metric]);

  const modelColors = useMemo(() => {
    const m = new Map<string, string>();
    aggs.forEach((a) => {
      m.set(a.model, modelColor(a.model, MODEL_PALETTE));
    });
    return m;
  }, [aggs]);

  const scatterPts = useMemo(() => {
    return aggs.map((a) => ({
      x: a.avgLatencyMs,
      y: a.avgReliability ?? 0.5,
      label: a.model,
      color: modelColors.get(a.model) ?? "#22d3ee",
    }));
  }, [aggs, modelColors]);

  const trendSeries = useMemo(() => {
    return aggs.map((a) => {
      const subset = baseFiltered.filter((t) => t.model_name === a.model);
      const pts = reliabilityTimeSeries(subset);
      return { model: a.model, points: pts };
    });
  }, [aggs, baseFiltered]);

  const insight = (key: "bestOverall" | "fastest" | "lowestRisk" | "mostConsistent") => {
    const m = best[key];
    if (!m) return "—";
    const c = modelColors.get(m.model) ?? "#94a3b8";
    if (key === "fastest") return `${m.model} (${Math.round(m.avgLatencyMs)} ms)`;
    if (key === "lowestRisk")
      return m.avgRisk != null ? `${m.model} (risk ${m.avgRisk.toFixed(2)})` : m.model;
    if (key === "mostConsistent")
      return `${m.model} (σ rel ${m.stdRel.toFixed(3)})`;
    return `${m.model} (score by ${metric})`;
  };

  return (
    <section className="td-model-section" aria-labelledby="model-compare-heading">
      <h2 id="model-compare-heading" className="td-section-title">
        Model comparison
      </h2>
      <p className="td-model-lead">
        Same evaluation slice — compare grounding, risk, latency, and consistency. One color per model
        in charts.
      </p>

      <div className="td-model-filters">
        <div className="td-model-filter-block">
          <span className="td-model-filter-label">Models</span>
          <div className="td-model-chips">
            {models.map((m) => {
              const on = selectedModels.size === 0 || selectedModels.has(m);
              return (
                <button
                  key={m}
                  type="button"
                  className={`td-chip ${on ? "td-chip--on" : "td-chip--off"}`}
                  style={{
                    borderColor: modelColor(m, MODEL_PALETTE),
                  }}
                  onClick={() => {
                    setSelectedModels((prev) => {
                      if (prev.size === 0) return new Set([m]);
                      const n = toggleInSet(prev, m);
                      return n;
                    });
                  }}
                  title={
                    selectedModels.size === 0
                      ? "Click to focus one or more models"
                      : "Toggle model"
                  }
                >
                  {m}
                </button>
              );
            })}
          </div>
          <p className="td-model-hint">
            {selectedModels.size === 0
              ? "All models included — click a chip to compare a subset."
              : `${selectedModels.size} selected`}
          </p>
        </div>

        <div className="td-model-filter-row">
          <label className="td-model-field">
            <span>Agent</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="td-filter-select"
            >
              <option value="all">All agents</option>
              {agents.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="td-model-field">
            <span>Environment</span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="td-filter-select"
            >
              <option value="all">All</option>
              {envs.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="td-model-field">
            <span>Experiment tag</span>
            <select
              value={experimentFilter}
              onChange={(e) => setExperimentFilter(e.target.value)}
              className="td-filter-select"
            >
              <option value="all">All</option>
              {experiments.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="td-model-field">
            <span>Time range</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
              className="td-filter-select"
            >
              <option value="5m">Last 5 min</option>
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <label className="td-model-field">
            <span>“Best overall” metric</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as ModelMetricKey)}
              className="td-filter-select"
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

      <div className="td-model-summary-grid">
        <div className="td-model-summary-card">
          <span className="td-model-summary-k">Best overall</span>
          <p className="td-model-summary-v">{insight("bestOverall")}</p>
          <p className="td-model-summary-i">Weighted by the metric selector above.</p>
        </div>
        <div className="td-model-summary-card">
          <span className="td-model-summary-k">Fastest</span>
          <p className="td-model-summary-v">{insight("fastest")}</p>
          <p className="td-model-summary-i">Lowest average latency in this slice.</p>
        </div>
        <div className="td-model-summary-card">
          <span className="td-model-summary-k">Lowest risk</span>
          <p className="td-model-summary-v">{insight("lowestRisk")}</p>
          <p className="td-model-summary-i">Lowest mean hallucination risk.</p>
        </div>
        <div className="td-model-summary-card">
          <span className="td-model-summary-k">Most consistent</span>
          <p className="td-model-summary-v">{insight("mostConsistent")}</p>
          <p className="td-model-summary-i">Lowest reliability σ (needs 2+ traces).</p>
        </div>
      </div>

      <div className="td-model-charts">
        <div className="td-chart-card">
          <div className="td-chart-head">
            <h3 className="td-chart-title">Reliability trend by model</h3>
            <p className="td-chart-desc">Each line is one model’s reliability over time.</p>
          </div>
          <ModelTrendLines seriesByModel={trendSeries} palette={MODEL_PALETTE} />
          <div className="td-model-legend">
            {aggs.map((a) => (
              <span key={a.model} className="td-model-legend-item">
                <span
                  className="td-model-legend-swatch"
                  style={{ background: modelColors.get(a.model) }}
                />
                {a.model}
              </span>
            ))}
          </div>
        </div>
        <div className="td-chart-card">
          <div className="td-chart-head">
            <h3 className="td-chart-title">Quality vs latency</h3>
            <p className="td-chart-desc">Upper-left is best — high reliability, low latency.</p>
          </div>
          <QualityLatencyScatter points={scatterPts} />
        </div>
      </div>

      <div className="td-chart-card td-model-gbar-card">
        <div className="td-chart-head">
          <h3 className="td-chart-title">Average metrics by model</h3>
          <p className="td-chart-desc">Normalized bars — hover for raw values.</p>
        </div>
        <div className="td-model-metric-grid">
          {aggs.map((a) => {
            const color = modelColors.get(a.model) ?? "#22d3ee";
            const g = a.avgGrounding ?? 0;
            const r = a.avgReliability ?? 0;
            const k = a.avgRisk ?? 0;
            const lat = a.avgLatencyMs;
            const latMax = Math.max(1, ...aggs.map((x) => x.avgLatencyMs));
            return (
              <div key={a.model} className="td-model-metric-card" style={{ borderColor: `${color}44` }}>
                <div className="td-model-metric-title" style={{ color }}>
                  {a.model}
                </div>
                <div className="td-model-metric-rows">
                  <div className="td-model-metric-row">
                    <span>Grounding</span>
                    <div className="td-model-bar-wrap">
                      <div
                        className="td-model-bar"
                        style={{ width: `${g * 100}%`, background: color }}
                        title={g.toFixed(3)}
                      />
                    </div>
                  </div>
                  <div className="td-model-metric-row">
                    <span>Reliability</span>
                    <div className="td-model-bar-wrap">
                      <div
                        className="td-model-bar"
                        style={{ width: `${r * 100}%`, background: color }}
                        title={r.toFixed(3)}
                      />
                    </div>
                  </div>
                  <div className="td-model-metric-row">
                    <span>Risk</span>
                    <div className="td-model-bar-wrap">
                      <div
                        className="td-model-bar td-model-bar--risk"
                        style={{ width: `${k * 100}%`, background: color }}
                        title={k.toFixed(3)}
                      />
                    </div>
                  </div>
                  <div className="td-model-metric-row">
                    <span>Latency</span>
                    <div className="td-model-bar-wrap">
                      <div
                        className="td-model-bar td-model-bar--lat"
                        style={{ width: `${(lat / latMax) * 100}%`, background: color }}
                        title={`${Math.round(lat)} ms`}
                      />
                    </div>
                  </div>
                </div>
                <span className="td-model-n">n = {a.n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="td-model-table-wrap">
        <table className="td-table td-model-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>n</th>
              <th>Avg G</th>
              <th>Avg rel</th>
              <th>Avg risk</th>
              <th>Avg ms</th>
              <th>σ rel</th>
              <th>Tradeoff</th>
            </tr>
          </thead>
          <tbody>
            {aggs.map((a) => (
              <tr key={a.model}>
                <td>
                  <span className="td-model-table-dot" style={{ background: modelColors.get(a.model) }} />
                  {a.model}
                </td>
                <td className="td-table-num">{a.n}</td>
                <td className="td-table-num">{a.avgGrounding != null ? a.avgGrounding.toFixed(3) : "—"}</td>
                <td className="td-table-num">{a.avgReliability != null ? a.avgReliability.toFixed(3) : "—"}</td>
                <td className="td-table-num">{a.avgRisk != null ? a.avgRisk.toFixed(3) : "—"}</td>
                <td className="td-table-num">{Math.round(a.avgLatencyMs)}</td>
                <td className="td-table-num">{a.n >= 2 ? a.stdRel.toFixed(4) : "—"}</td>
                <td className="td-table-num">{a.tradeoff.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {aggs.length === 0 ? (
          <p className="td-empty">No traces for this model filter — widen time range or agent.</p>
        ) : null}
      </div>

      <details className="td-model-advanced">
        <summary>Advanced: side-by-side trace diff</summary>
        <p className="td-model-advanced-p">
          Open two trace detail pages in separate tabs and compare prompt, evidence, grounding, and verdict.
          A future release can link traces that share the same prompt hash or experiment case id.
        </p>
      </details>
    </section>
  );
}
