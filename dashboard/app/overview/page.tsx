import { fetchTraces } from "@/lib/api";

export default async function OverviewPage() {
  let rows: Awaited<ReturnType<typeof fetchTraces>> = [];
  try {
    rows = await fetchTraces();
  } catch {
    /* ignore */
  }
  const n = rows.length;
  const avgRel =
    n > 0
      ? rows.reduce((s, r) => s + (r.reliability_score ?? 0), 0) / n
      : 0;
  const avgRisk =
    n > 0
      ? rows.reduce((s, r) => s + (r.hallucination_risk ?? 0), 0) / n
      : 0;

  return (
    <div>
      <h1>Overview</h1>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div
          style={{
            background: "#161b22",
            padding: 20,
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: "#8b949e" }}>Total traces</div>
          <div style={{ fontSize: 28 }}>{n}</div>
        </div>
        <div
          style={{
            background: "#161b22",
            padding: 20,
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: "#8b949e" }}>Avg reliability</div>
          <div style={{ fontSize: 28 }}>{n ? avgRel.toFixed(2) : "—"}</div>
        </div>
        <div
          style={{
            background: "#161b22",
            padding: 20,
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: "#8b949e" }}>Avg risk</div>
          <div style={{ fontSize: 28 }}>{n ? avgRisk.toFixed(2) : "—"}</div>
        </div>
      </div>
    </div>
  );
}
