"use client";

/** Debugging-style verdict — reads like triage, not marketing bullets. */
export function MiniVerdictCard() {
  return (
    <div className="ld-mini-verdict ld-mini-verdict--debug" aria-hidden>
      <p className="ld-mini-debug-lead">
        <span className="ld-mini-debug-lead-k">Claim:</span>{" "}
        <span className="ld-mini-debug-lead-v">&quot;The policy changed in 2020&quot;</span>
      </p>
      <ul className="ld-mini-debug-list">
        <li className="ld-mini-debug-li ld-mini-debug-li--bad">
          <span className="ld-mini-debug-ico" aria-hidden>
            ✕
          </span>
          <span>No supporting evidence</span>
        </li>
        <li className="ld-mini-debug-li ld-mini-debug-li--warn">
          <span className="ld-mini-debug-ico" aria-hidden>
            ⚠
          </span>
          <span>Weak retrieval (low overlap)</span>
        </li>
        <li className="ld-mini-debug-li ld-mini-debug-li--ok">
          <span className="ld-mini-debug-ico" aria-hidden>
            ✔
          </span>
          <span>Supported (if evidence spans match)</span>
        </li>
      </ul>
    </div>
  );
}
