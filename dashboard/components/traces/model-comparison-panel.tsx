"use client";

import { useMemo } from "react";
import type { TraceListItem } from "@/lib/types";
import {
  aggregateByModel,
  modelColor,
  MODEL_PALETTE,
  pickBestModels,
  reliabilityTimeSeries,
  type ModelMetricKey,
} from "@/lib/traces-analytics";
import {
  ModelTrendLines,
  QualityLatencyScatter,
} from "@/components/traces/trace-dashboard-charts";

/** Pre-filtered traces (time, agent, env, experiment, model chips) — filters live in parent rail. */
export function ModelComparisonPanel({
  traces,
  metric,
}: {
  traces: TraceListItem[];
  metric: ModelMetricKey;
}) {
  const aggs = useMemo(() => aggregateByModel(traces), [traces]);
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
      color: modelColors.get(a.model) ?? "#3b82f6",
    }));
  }, [aggs, modelColors]);

  const trendSeries = useMemo(() => {
    return aggs.map((a) => {
      const subset = traces.filter((t) => t.model_name === a.model);
      const pts = reliabilityTimeSeries(subset);
      return { model: a.model, points: pts };
    });
  }, [aggs, traces]);

  const insight = (key: "bestOverall" | "fastest" | "lowestRisk" | "mostConsistent") => {
    const m = best[key];
    if (!m) return "—";
    if (key === "fastest") return `${m.model} (${Math.round(m.avgLatencyMs)} ms)`;
    if (key === "lowestRisk")
      return m.avgRisk != null ? `${m.model} (risk ${m.avgRisk.toFixed(2)})` : m.model;
    if (key === "mostConsistent")
      return `${m.model} (σ rel ${m.stdRel.toFixed(3)})`;
    return `${m.model} (score by ${metric})`;
  };

  return (
    <section className="td-model-section" aria-labelledby="model-compare-heading">
      <h2 id="model-compare-heading" className="tdv-section-h td-traces-section-heading">
        Model comparison
      </h2>
      <p className="td-model-lead">
        Same evaluation slice — compare grounding, risk, latency, and consistency. One color per model
        in charts. Adjust filters in the panel on the right.
      </p>

      <div className="td-model-summary-grid">
        <div className="td-model-summary-card">
          <span className="td-model-summary-k">Best overall</span>
          <p className="td-model-summary-v">{insight("bestOverall")}</p>
          <p className="td-model-summary-i">Weighted by the metric selector in the filter panel.</p>
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
          <h3 className="tdv-section-h">Reliability trend by model</h3>
          <p className="tdv-section-sub td-chart-head-desc">Each line is one model’s reliability over time.</p>
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
            <h3 className="tdv-section-h">Quality vs latency</h3>
            <p className="tdv-section-sub td-chart-head-desc">Upper-left is best — high reliability, low latency.</p>
          </div>
          <QualityLatencyScatter points={scatterPts} />
        </div>
      </div>

      <div className="td-chart-card td-model-gbar-card">
        <div className="td-chart-head">
          <h3 className="tdv-section-h">Average metrics by model</h3>
          <p className="tdv-section-sub td-chart-head-desc">Normalized bars — hover for raw values.</p>
        </div>
        <div className="td-model-metric-grid">
          {aggs.map((a) => {
            const color = modelColors.get(a.model) ?? "#3b82f6";
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
          <p className="td-empty">No traces for this model filter — widen time range or clear filters.</p>
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
