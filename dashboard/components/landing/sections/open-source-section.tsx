import { Reveal } from "@/components/landing/reveal";

const rows = [
  {
    phase: "V1 · now",
    text: "Trace inspection, hybrid grounding, explainable scores, evaluation runner.",
  },
  {
    phase: "In progress",
    text: "Comparison dashboards, benchmark reports, richer failure typing in the UI.",
  },
  {
    phase: "Upcoming",
    text: "Deeper reliability analytics, open-source SDKs, community integrations.",
  },
];

export function OpenSourceSection() {
  return (
    <section id="opensource" className="ld-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">Open source, early, and moving fast</h2>
          <p className="ld-sub ld-sub--visual">
            Early-stage, developer-first, and built in the open — trace inspection, grounding, and
            explainable scoring today; deeper evaluation tooling next.
          </p>
        </Reveal>
        <div className="ld-road ld-road--compact">
          {rows.map((r) => (
            <div key={r.phase} className="ld-road-row">
              <div className="ld-road-phase">{r.phase}</div>
              <p className="ld-road-text">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
