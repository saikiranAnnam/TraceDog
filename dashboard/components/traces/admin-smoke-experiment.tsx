"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tracedog-admin-bearer";

export function AdminSmokeExperiment() {
  const [token, setToken] = useState("");
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
      setError(
        typeof body.detail === "string"
          ? body.detail
          : `Job status failed (${res.status})`,
      );
      setBusy(false);
      return null;
    }
    return body as {
      status: string;
      result?: Record<string, unknown>;
      error?: string | null;
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
        setStatusText(JSON.stringify(body.result ?? {}, null, 2));
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
      setStatusText(`status: ${body.status}`);
    };

    void tick();
    interval = setInterval(() => void tick(), 450);
    return () => {
      cancelled = true;
      stop();
    };
  }, [jobId, pollJob]);

  const runSmoke = async () => {
    const t = token.trim();
    if (!t) {
      setError("Paste the API’s ADMIN_API_KEY (Bearer secret) first.");
      return;
    }
    setError(null);
    setStatusText(null);
    setJobId(null);
    setBusy(true);
    const res = await fetch("/api/admin/experiments/smoke-score/run", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(
        typeof body.detail === "string"
          ? body.detail
          : `Enqueue failed (${res.status})`,
      );
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
    <section className="td-admin-panel" aria-label="Admin smoke experiment">
      <div className="td-admin-panel-head">
        <h2 className="td-admin-panel-title">Admin: scoring smoke job</h2>
      </div>
      <p className="td-admin-panel-hint">
        Runs a tiny deterministic scoring task on the server (async job, polled from the browser). Use the same secret
        as <code>ADMIN_API_KEY</code> on the API. Only share this with operators you trust; it grants access to admin
        routes.
      </p>
      <div className="td-admin-panel-row">
        <input
          className="td-admin-token"
          type="password"
          autoComplete="off"
          placeholder="ADMIN_API_KEY (Bearer)"
          value={token}
          onChange={(e) => persistToken(e.target.value)}
          aria-label="Admin API bearer token"
        />
        <button type="button" className="td-admin-btn" disabled={busy} onClick={() => void runSmoke()}>
          {busy ? "Running…" : "Run smoke job"}
        </button>
      </div>
      {error ? (
        <pre className="td-admin-status td-admin-status--err">{error}</pre>
      ) : null}
      {statusText && !error ? <pre className="td-admin-status">{statusText}</pre> : null}
    </section>
  );
}
