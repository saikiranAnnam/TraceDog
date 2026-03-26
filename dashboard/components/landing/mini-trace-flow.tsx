"use client";

import clsx from "clsx";

/** Vertical trace rail — moving pulse + animated progress. */
export function MiniTraceFlow() {
  const stages = ["Prompt", "Retrieval", "Generation", "Score"];
  return (
    <div className="ld-mini-trace ld-mini-trace--vertical" aria-hidden>
      <div className="ld-mini-trace-vrail">
        {stages.map((k, i) => (
          <div key={k} className="ld-mini-trace-vstep">
            <div className="ld-mini-trace-vtrack">
              <span
                className={clsx(
                  "ld-mini-trace-vdot",
                  i === stages.length - 1 && "ld-mini-trace-vdot--pulse"
                )}
              />
              {i < stages.length - 1 && (
                <div className="ld-mini-trace-vline">
                  <span className="ld-mini-trace-vpulse" />
                </div>
              )}
            </div>
            <span className="ld-mini-trace-vlabel">{k}</span>
          </div>
        ))}
      </div>
      <div className="ld-mini-trace-bar ld-mini-trace-bar--wide">
        <span className="ld-mini-trace-bar-fill ld-mini-trace-bar-fill--anim" />
      </div>
      <p className="ld-mini-trace-foot">Latency-weighted path · 4 stages</p>
    </div>
  );
}
