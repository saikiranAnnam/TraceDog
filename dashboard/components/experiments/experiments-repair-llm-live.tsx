"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tracedog-admin-bearer";

type Scenario = "policy" | "hotpot_qa";

export function ExperimentsRepairLlmLive() {
  const [token, setToken] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [scenario, setScenario] = useState<Scenario>("policy");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) setToken(s);
    } catch {
      /* ignore */
    }
  }, []);

  const persistToken = (value: string) => {
    setToken(value);
    try {
      if (value.trim()) sessionStorage.setItem(STORAGE_KEY, value.trim());
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const run = async () => {
    const t = token.trim();
    if (!t) {
      setError("Paste ADMIN_API_KEY first (same as API experiments runner).");
      return;
    }
    setBusy(true);
    setError(null);
    setResultJson(null);
    try {
      const res = await fetch("/api/admin/experiments/repair-llm-live/run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model.trim() || "gpt-4o-mini",
          scenario,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof body.detail === "string" ? body.detail : `Request failed (${res.status})`;
        setError(detail);
        return;
      }
      setResultJson(JSON.stringify(body, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="td-admin-panel td-lab-repair-live" aria-label="Live LLM repair demo">
      <div className="td-admin-panel-head">
        <h3 className="td-admin-panel-title">Live LLM → trace → repair (dashboard)</h3>
      </div>
      <p className="td-admin-panel-hint">
        Same flow as <code className="docs-inline-code">pytest tests/integration/test_repair_llm_live.py</code>{" "}
        (policy preset). <strong>HotpotQA</strong> uses one bundled multi-hop row (same shape as{" "}
        <code className="docs-inline-code">run_hotpot_eval</code>). OpenAI runs on the <strong>API server</strong>, which must have{" "}
        <code className="docs-inline-code">OPENAI_API_KEY</code> on the API host (e.g. <code className="docs-inline-code">.env</code> in <strong>TraceDog-backend</strong>){" "}
        (not in the browser). Uses <code className="docs-inline-code">ADMIN_API_KEY</code> here. Creates a real{" "}
        <code className="docs-inline-code">trace_id</code> in the API database and may incur OpenAI cost.
      </p>

      <input
        className="td-admin-token td-lab-runner-token"
        type="password"
        autoComplete="off"
        placeholder="ADMIN_API_KEY"
        value={token}
        onChange={(e) => persistToken(e.target.value)}
        aria-label="Admin API bearer token"
      />

      <div className="td-lab-runner-form td-lab-runner-form--live-preset" style={{ marginTop: "0.5rem" }}>
        <label className="td-lab-runner-field">
          <span>Scenario</span>
          <select
            className="td-lab-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
            aria-label="Repair demo scenario"
          >
            <option value="policy">Synthetic policy QA (refund timing)</option>
            <option value="hotpot_qa">HotpotQA sample (which magazine started first)</option>
          </select>
        </label>
        <label className="td-lab-runner-field td-lab-runner-field--full">
          <span>OpenAI model (on API host)</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="td-admin-panel-row td-lab-runner-actions">
        <button type="button" className="td-admin-btn" disabled={busy} onClick={() => void run()}>
          {busy ? "Running (OpenAI + ingest + repair)…" : "Run live repair demo"}
        </button>
      </div>

      {error ? (
        <div className="td-admin-terminal" role="alert">
          <div className="td-admin-terminal-body">
            <pre className="td-admin-terminal-pre td-admin-terminal-pre--err">{error}</pre>
          </div>
        </div>
      ) : null}

      {resultJson ? (
        <div className="td-admin-terminal" role="region" aria-label="Repair demo JSON result">
          <div className="td-admin-terminal-chrome" aria-hidden="true">
            <span className="td-admin-terminal-dots">
              <span className="td-admin-terminal-dot td-admin-terminal-dot--r" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--y" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--g" />
            </span>
            <span className="td-admin-terminal-title">tracedog — repair-llm-live</span>
          </div>
          <div className="td-admin-terminal-body">
            <pre className="td-admin-terminal-pre">{resultJson}</pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
