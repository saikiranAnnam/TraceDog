"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tracedog-admin-bearer";

const SCRIPTS: { value: string; label: string }[] = [
  { value: "pytest", label: "pytest — evaluation/tests (mostly offline)" },
  { value: "pytest_offline", label: "Full script — skip HF verify" },
  { value: "pytest_full", label: "Full script — pytest + HF pins (network)" },
  { value: "smoke_squad", label: "SQuAD smoke — fetch + prompts, dry-run" },
];

export function AdminDataPipelineRunner() {
  const [token, setToken] = useState("");
  const [script, setScript] = useState("pytest");
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
    interval = setInterval(() => void tick(), 500);
    return () => {
      cancelled = true;
      stop();
    };
  }, [jobId, pollJob]);

  const runJob = async () => {
    const t = token.trim();
    if (!t) {
      setError("Paste ADMIN_API_KEY first.");
      return;
    }
    setError(null);
    setStatusText(null);
    setJobId(null);
    setBusy(true);
    const res = await fetch("/api/admin/data-pipeline/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ script }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      const detail =
        typeof body.detail === "string" ? body.detail : `Enqueue failed (${res.status})`;
      if (res.status === 404) {
        setError(
          `${detail} — Restart/rebuild the API (TraceDog-backend repo; route must exist), set NEXT_PUBLIC_API_URL to the same host:port your traces use (origin only, no /api/v1). Verify with: curl -sS ORIGIN/api/v1/admin/data-pipeline/jobs (expect JSON with "scripts"); if that 404s, the dashboard is not talking to your current API process.`,
        );
      } else {
        setError(detail);
      }
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

  return (
    <section className="td-admin-panel" aria-label="Run data pipeline tests on API host">
      <div className="td-admin-panel-head">
        <h3 className="td-admin-panel-title">Run checks (API server)</h3>
      </div>
      <p className="td-admin-panel-hint">
        Executes scripts under <code className="docs-inline-code">PIPELINE_TESTS_REPO_ROOT</code> on the{" "}
        <strong>API machine</strong> (local dev with monorepo, or set that env on Render if your image includes{" "}
        <code className="docs-inline-code">evaluation/</code>). Slim Docker images return 503 until configured.
      </p>
      <div className="td-admin-panel-row td-data-runner-row">
        <input
          className="td-admin-token"
          type="password"
          autoComplete="off"
          placeholder="ADMIN_API_KEY"
          value={token}
          onChange={(e) => persistToken(e.target.value)}
          aria-label="Admin API bearer token"
        />
        <select
          className="td-data-script-select"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          aria-label="Pipeline test script"
        >
          {SCRIPTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className="td-admin-btn" disabled={busy} onClick={() => void runJob()}>
          {busy ? "Running…" : "Run"}
        </button>
      </div>
      {busy || error || statusText ? (
        <div className="td-admin-terminal" role="region" aria-label="Job log output">
          <div className="td-admin-terminal-chrome" aria-hidden="true">
            <span className="td-admin-terminal-dots">
              <span className="td-admin-terminal-dot td-admin-terminal-dot--r" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--y" />
              <span className="td-admin-terminal-dot td-admin-terminal-dot--g" />
            </span>
            <span className="td-admin-terminal-title">tracedog — pipeline job</span>
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
