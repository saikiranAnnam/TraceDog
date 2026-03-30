"use client";

import { useCallback, useMemo, useState } from "react";

import { fetchTraces } from "@/lib/api";
import type { TraceListItem } from "@/lib/types";

type Agg = {
  model_name: string;
  n: number;
  avgGrounding: number | null;
  avgRisk: number | null;
  avgReliability: number | null;
};

function aggregateByModel(rows: TraceListItem[]): Agg[] {
  const m = new Map<
    string,
    { n: number; g: number; gc: number; r: number; rc: number; rel: number; relc: number }
  >();
  for (const t of rows) {
    const key = t.model_name || "(unknown)";
    let cur = m.get(key);
    if (!cur) {
      cur = { n: 0, g: 0, gc: 0, r: 0, rc: 0, rel: 0, relc: 0 };
      m.set(key, cur);
    }
    cur.n += 1;
    if (t.grounding_score != null) {
      cur.g += t.grounding_score;
      cur.gc += 1;
    }
    if (t.hallucination_risk != null) {
      cur.r += t.hallucination_risk;
      cur.rc += 1;
    }
    if (t.reliability_score != null) {
      cur.rel += t.reliability_score;
      cur.relc += 1;
    }
  }
  const out: Agg[] = [];
  m.forEach((a, model_name) => {
    out.push({
      model_name,
      n: a.n,
      avgGrounding: a.gc ? a.g / a.gc : null,
      avgRisk: a.rc ? a.r / a.rc : null,
      avgReliability: a.relc ? a.rel / a.relc : null,
    });
  });
  out.sort((x, y) => x.model_name.localeCompare(y.model_name));
  return out;
}

export function ExperimentsLabCompare() {
  const [filter, setFilter] = useState("lab-hotpot-compare");
  const [rows, setRows] = useState<TraceListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const all = await fetchTraces({ limit: 500 });
      setRows(all);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load traces");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => (t.experiment_tag || "").toLowerCase().includes(q));
  }, [rows, filter]);

  const byModel = useMemo(() => aggregateByModel(filtered), [filtered]);

  return (
    <section className="td-admin-panel td-lab-compare" aria-label="Compare models by experiment tag">
      <div className="td-admin-panel-head">
        <h3 className="td-admin-panel-title">Compare models (from traces)</h3>
      </div>
      <p className="td-admin-panel-hint">
        Loads recent traces via <code className="docs-inline-code">GET /api/v1/traces</code> and groups by{" "}
        <strong>model_name</strong>. Filter by <code className="docs-inline-code">experiment_tag</code> substring
        (use the same tag for each model run — e.g. <code className="docs-inline-code">lab-hotpot-compare</code>) to
        see how metrics shift between models.
      </p>
      <div className="td-lab-compare-toolbar">
        <label className="td-lab-runner-field">
          <span>Experiment tag contains</span>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="lab-hotpot-compare"
          />
        </label>
        <button type="button" className="td-admin-btn" disabled={loading} onClick={() => void load()}>
          {loading ? "Loading…" : "Refresh traces"}
        </button>
      </div>
      {err ? <p className="td-lab-compare-err">{err}</p> : null}
      {rows && (
        <div className="td-lab-compare-table-wrap">
          <table className="td-lab-compare-table">
            <caption className="td-lab-compare-caption">
              {filtered.length} trace{filtered.length === 1 ? "" : "s"} matched · {byModel.length} model
              {byModel.length === 1 ? "" : "s"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">n</th>
                <th scope="col">Avg grounding</th>
                <th scope="col">Avg hallucination risk</th>
                <th scope="col">Avg reliability</th>
              </tr>
            </thead>
            <tbody>
              {byModel.map((a) => (
                <tr key={a.model_name}>
                  <td className="td-lab-compare-mono">{a.model_name}</td>
                  <td>{a.n}</td>
                  <td>{a.avgGrounding != null ? a.avgGrounding.toFixed(3) : "—"}</td>
                  <td>{a.avgRisk != null ? a.avgRisk.toFixed(3) : "—"}</td>
                  <td>{a.avgReliability != null ? a.avgReliability.toFixed(3) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="td-lab-compare-empty">No traces returned yet.</p>
          ) : filtered.length === 0 ? (
            <p className="td-lab-compare-empty">No traces match this tag filter.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
