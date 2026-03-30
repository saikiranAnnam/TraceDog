"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

const STORAGE_KEY = "tracedog-admin-bearer";

type PresetId =
  | "smoke_score"
  | "smoke_squad_dry"
  | "pytest_offline"
  | "hotpot_live_smoke"
  | "squad_live_smoke";

const LIVE_PRESETS = new Set<PresetId>(["hotpot_live_smoke", "squad_live_smoke"]);

/** Sentinel for model `<select>` when the value is not in the curated list. */
const MODEL_OTHER = "__other__";

const OPENAI_MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini (cheap)" },
  { value: "gpt-4.1-nano", label: "gpt-4.1-nano (cheap)" },
  { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
];

/** Single recommended “good” Claude id (matches evaluation runner aliases). */
const ANTHROPIC_MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
];

function defaultModelForProvider(p: "openai" | "anthropic"): string {
  return p === "openai" ? OPENAI_MODEL_OPTIONS[0]!.value : ANTHROPIC_MODEL_OPTIONS[0]!.value;
}

function modelOptionsForProvider(p: "openai" | "anthropic") {
  return p === "openai" ? OPENAI_MODEL_OPTIONS : ANTHROPIC_MODEL_OPTIONS;
}

function LabModelPicker({
  provider,
  model,
  setModel,
}: {
  provider: "openai" | "anthropic";
  model: string;
  setModel: (v: string) => void;
}) {
  const opts = modelOptionsForProvider(provider);
  const known = new Set(opts.map((o) => o.value));
  const sel = known.has(model) ? model : MODEL_OTHER;
  return (
    <>
      <label className="td-lab-runner-field td-lab-runner-field--full">
        <span>Model</span>
        <select
          value={sel}
          onChange={(e) => {
            const v = e.target.value;
            if (v === MODEL_OTHER) setModel("");
            else setModel(v);
          }}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={MODEL_OTHER}>Other…</option>
        </select>
      </label>
      {sel === MODEL_OTHER ? (
        <label className="td-lab-runner-field td-lab-runner-field--full">
          <span>Custom model id</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gpt-4o or claude-haiku-4-5"
            autoComplete="off"
          />
        </label>
      ) : null}
    </>
  );
}

const PRESETS: { id: PresetId; label: string; hint: string }[] = [
  {
    id: "smoke_score",
    label: "Smoke score",
    hint: "In-process scorer on a tiny trace (no repo root, no LLM).",
  },
  {
    id: "smoke_squad_dry",
    label: "SQuAD dry-run (2)",
    hint: "Fetch + prompts, no POST — needs PIPELINE_TESTS_REPO_ROOT + eval deps.",
  },
  {
    id: "pytest_offline",
    label: "Pytest (data plane)",
    hint: "evaluation/tests offline suite via bash script.",
  },
  {
    id: "hotpot_live_smoke",
    label: "HotpotQA live (LLM + traces)",
    hint: "Calls the LLM, POSTs traces to TraceDog, then GET /traces can compare models via the same experiment tag.",
  },
  {
    id: "squad_live_smoke",
    label: "SQuAD live (LLM + traces)",
    hint: "Same as Hotpot preset but SQuAD v2 — use a shared tag to compare models side by side.",
  },
];

export function ExperimentsLabRunner() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState<PresetId>("smoke_score");
  const [dataset, setDataset] = useState<"squad_v2" | "hotpot_qa">("squad_v2");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [model, setModel] = useState(() => defaultModelForProvider("openai"));
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [split, setSplit] = useState("validation");
  const [runMode, setRunMode] = useState<"dry_run" | "live_ingest">("dry_run");
  const [experimentTag, setExperimentTag] = useState("lab-ui");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

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

  useEffect(() => {
    if (dataset === "squad_v2" && split === "test") setSplit("validation");
  }, [dataset, split]);

  useEffect(() => {
    if (preset === "hotpot_live_smoke") {
      setLimit(5);
      setExperimentTag("lab-hotpot-compare");
      setSplit("validation");
    } else if (preset === "squad_live_smoke") {
      setLimit(5);
      setExperimentTag("lab-squad-compare");
      setSplit("validation");
    }
  }, [preset]);

  useEffect(() => {
    if (preset === "squad_live_smoke" && split === "test") setSplit("validation");
  }, [preset, split]);

  useEffect(() => {
    setModel(defaultModelForProvider(provider));
  }, [provider]);

  const pollJob = useCallback(async (id: string, authHeader: string) => {
    const res = await fetch(`/api/admin/experiments/jobs/${encodeURIComponent(id)}`, {
      headers: { Authorization: authHeader },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof body.detail === "string" ? body.detail : `Job status failed (${res.status})`);
      setBusy(false);
      return null;
    }
    return body as {
      status: string;
      result?: Record<string, unknown>;
      error?: string | null;
      kind?: string;
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const id = jobId;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    setBusy(true);
    setError(null);

    const authHeader = `Bearer ${tokenRef.current.trim()}`;
    const stop = () => {
      if (interval !== undefined) clearInterval(interval);
      interval = undefined;
    };

    const tick = async () => {
      const body = await pollJob(id, authHeader);
      if (cancelled || !body) return;
      if (body.status === "succeeded") {
        const r = body.result ?? {};
        const stdout = typeof r.stdout_tail === "string" ? r.stdout_tail : "";
        const stderr = typeof r.stderr_tail === "string" ? r.stderr_tail : "";
        const merged = [stdout, stderr].filter(Boolean).join("\n--- stderr ---\n");
        setStatusText(merged || JSON.stringify(r, null, 2));
        setBusy(false);
        stop();
        return;
      }
      if (body.status === "failed") {
        setError(body.error ?? "Job failed");
        setBusy(false);
        stop();
        return;
      }
      setStatusText(`status: ${body.status}${body.kind ? ` (${body.kind})` : ""}`);
    };

    void tick();
    interval = setInterval(() => void tick(), 600);
    return () => {
      cancelled = true;
      stop();
    };
  }, [jobId, pollJob]);

  const runEval = async () => {
    const t = token.trim();
    if (!t) {
      setError("Paste ADMIN_API_KEY first.");
      return;
    }
    const isLivePreset = mode === "preset" && LIVE_PRESETS.has(preset);
    if (!model.trim()) {
      setError("Pick a model or enter a custom model id.");
      return;
    }
    setError(null);
    setStatusText(null);
    setJobId(null);
    setBusy(true);

    const defaultLiveTag =
      preset === "hotpot_live_smoke" ? "lab-hotpot-compare" : "lab-squad-compare";
    const payload =
      mode === "preset"
        ? isLivePreset
          ? {
              preset,
              provider,
              model: model.trim(),
              limit,
              offset,
              split,
              experiment_tag: experimentTag.trim() || defaultLiveTag,
            }
          : { preset }
        : {
            dataset,
            provider,
            model: model.trim(),
            limit,
            offset,
            split,
            run_mode: runMode,
            experiment_tag: experimentTag.trim() || "lab-ui",
            include_summary: includeSummary,
          };

    const res = await fetch("/api/admin/experiments/eval-lab/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      const detail = typeof body.detail === "string" ? body.detail : `Enqueue failed (${res.status})`;
      setError(detail);
      return;
    }
    const id = body.job_id as string | undefined;
    if (!id) {
      setBusy(false);
      setError("No job_id in response");
      return;
    }
    setJobId(id);
  };

  const splitOptions =
    dataset === "squad_v2"
      ? [
          { v: "train", l: "train" },
          { v: "validation", l: "validation" },
        ]
      : [
          { v: "train", l: "train" },
          { v: "validation", l: "validation" },
          { v: "test", l: "test" },
        ];

  const isLivePresetUi = mode === "preset" && LIVE_PRESETS.has(preset);
  const splitOptionsLive =
    preset === "hotpot_live_smoke"
      ? [
          { v: "train", l: "train" },
          { v: "validation", l: "validation" },
          { v: "test", l: "test" },
        ]
      : [
          { v: "train", l: "train" },
          { v: "validation", l: "validation" },
        ];

  return (
    <section className="td-admin-panel td-lab-runner" aria-label="Run evaluation jobs on API host">
      <div className="td-admin-panel-head">
        <h3 className="td-admin-panel-title">Run experiments (API)</h3>
      </div>
      <p className="td-admin-panel-hint">
        Uses <code className="docs-inline-code">ADMIN_API_KEY</code>. Presets and custom runs execute on the{" "}
        <strong>API machine</strong>; set <code className="docs-inline-code">PIPELINE_TESTS_REPO_ROOT</code> to your
        repo root and <code className="docs-inline-code">EVAL_LAB_TRACEDOG_URL</code> so live ingests hit this API.
        LLM keys live in <code className="docs-inline-code">evaluation/.env</code> on that host.
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

      <div className="td-lab-runner-mode" role="tablist" aria-label="Run mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preset"}
          className={clsx("td-lab-runner-mode-btn", mode === "preset" && "td-lab-runner-mode-btn--on")}
          onClick={() => setMode("preset")}
        >
          Presets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "custom"}
          className={clsx("td-lab-runner-mode-btn", mode === "custom" && "td-lab-runner-mode-btn--on")}
          onClick={() => setMode("custom")}
        >
          Custom
        </button>
      </div>

      {mode === "preset" ? (
        <>
          <div className="td-lab-runner-presets">
            {PRESETS.map((p) => (
              <label key={p.id} className={clsx("td-lab-runner-preset", preset === p.id && "td-lab-runner-preset--on")}>
                <input
                  type="radio"
                  name="preset"
                  value={p.id}
                  checked={preset === p.id}
                  onChange={() => setPreset(p.id)}
                />
                <span className="td-lab-runner-preset-label">{p.label}</span>
                <span className="td-lab-runner-preset-hint">{p.hint}</span>
              </label>
            ))}
          </div>
          {isLivePresetUi ? (
            <div className="td-lab-runner-form td-lab-runner-form--live-preset">
              <div className="td-lab-runner-row">
                <label className="td-lab-runner-field">
                  <span>Provider</span>
                  <select value={provider} onChange={(e) => setProvider(e.target.value as "openai" | "anthropic")}>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
              </div>
              <LabModelPicker provider={provider} model={model} setModel={setModel} />
              <div className="td-lab-runner-row">
                <label className="td-lab-runner-field">
                  <span>Limit</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  />
                </label>
                <label className="td-lab-runner-field">
                  <span>Offset</span>
                  <input
                    type="number"
                    min={0}
                    value={offset}
                    onChange={(e) => setOffset(Number(e.target.value))}
                  />
                </label>
                <label className="td-lab-runner-field">
                  <span>Split</span>
                  <select value={split} onChange={(e) => setSplit(e.target.value)}>
                    {splitOptionsLive.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="td-lab-runner-field td-lab-runner-field--full">
                <span>Experiment tag (same for A/B runs)</span>
                <input
                  type="text"
                  value={experimentTag}
                  onChange={(e) => setExperimentTag(e.target.value)}
                  placeholder={preset === "hotpot_live_smoke" ? "lab-hotpot-compare" : "lab-squad-compare"}
                />
              </label>
            </div>
          ) : null}
        </>
      ) : (
        <div className="td-lab-runner-form">
          <div className="td-lab-runner-row">
            <label className="td-lab-runner-field">
              <span>Dataset</span>
              <select value={dataset} onChange={(e) => setDataset(e.target.value as "squad_v2" | "hotpot_qa")}>
                <option value="squad_v2">SQuAD v2</option>
                <option value="hotpot_qa">HotpotQA</option>
              </select>
            </label>
            <label className="td-lab-runner-field">
              <span>Provider</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value as "openai" | "anthropic")}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </label>
          </div>
          <LabModelPicker provider={provider} model={model} setModel={setModel} />
          <div className="td-lab-runner-row">
            <label className="td-lab-runner-field">
              <span>Limit</span>
              <input
                type="number"
                min={1}
                max={500}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </label>
            <label className="td-lab-runner-field">
              <span>Offset</span>
              <input
                type="number"
                min={0}
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
              />
            </label>
            <label className="td-lab-runner-field">
              <span>Split</span>
              <select value={split} onChange={(e) => setSplit(e.target.value)}>
                {splitOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="td-lab-runner-row">
            <label className="td-lab-runner-field">
              <span>Run type</span>
              <select
                value={runMode}
                onChange={(e) => setRunMode(e.target.value as "dry_run" | "live_ingest")}
              >
                <option value="dry_run">Dry-run (no TraceDog POST)</option>
                <option value="live_ingest">Live ingest (POST traces)</option>
              </select>
            </label>
            <label className="td-lab-runner-field">
              <span>Experiment tag</span>
              <input
                type="text"
                value={experimentTag}
                onChange={(e) => setExperimentTag(e.target.value)}
                placeholder="lab-ui"
              />
            </label>
          </div>
          <label className="td-lab-runner-check">
            <input
              type="checkbox"
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
              disabled={runMode === "dry_run"}
            />
            <span>Append aggregate summary (live ingest only)</span>
          </label>
        </div>
      )}

      <div className="td-admin-panel-row td-lab-runner-actions">
        <button type="button" className="td-admin-btn" disabled={busy} onClick={() => void runEval()}>
          {busy ? "Running…" : "Run"}
        </button>
      </div>

      {busy || error || statusText ? (
        <div className="td-admin-terminal" role="region" aria-label="Eval job log output">
          <div className="td-admin-terminal-chrome" aria-hidden="true">
            <span className="td-admin-terminal-dots">
              <span className="td-admin-terminal-dot td-admin-terminal-dot--r" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--y" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--g" />
            </span>
            <span className="td-admin-terminal-title">tracedog — eval lab</span>
          </div>
          <div className="td-admin-terminal-body">
            {error ? (
              <pre className="td-admin-terminal-pre td-admin-terminal-pre--err">{error}</pre>
            ) : statusText ? (
              <pre className="td-admin-terminal-pre">{statusText}</pre>
            ) : (
              <pre className="td-admin-terminal-pre td-admin-terminal-pre--idle">Waiting for job output…</pre>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
