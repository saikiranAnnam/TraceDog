"use client";

/** Claim → evidence mapping — animated grounding dot. */
export function MiniGroundingSpectrum() {
  return (
    <div className="ld-mini-ground" aria-hidden>
      <div className="ld-mini-map">
        <div className="ld-mini-map-row">
          <span className="ld-mini-map-k">Claim</span>
          <span className="ld-mini-map-v ld-mini-map-v--primary">&quot;Revenue grew in Q3&quot;</span>
        </div>
        <div className="ld-mini-map-row">
          <span className="ld-mini-map-k">Evidence</span>
          <span className="ld-mini-map-v ld-mini-map-v--ok">Passage 2 · §2.1 matches</span>
        </div>
        <div className="ld-mini-map-row">
          <span className="ld-mini-map-k">Hybrid</span>
          <span className="ld-mini-map-v ld-mini-map-v--primary">0.71 sentence · 0.58 keyword</span>
        </div>
      </div>
      <div className="ld-mini-ground-track ld-mini-ground-track--lg">
        <div className="ld-mini-ground-fill" />
        <div className="ld-mini-ground-dot ld-mini-ground-dot--anim" />
      </div>
    </div>
  );
}
