import Link from "next/link";
import { fetchTraces } from "@/lib/api";

export default async function TracesPage() {
  let rows: Awaited<ReturnType<typeof fetchTraces>> = [];
  let err: string | null = null;
  try {
    rows = await fetchTraces();
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load traces";
  }

  if (err) {
    return (
      <div>
        <h1>Traces</h1>
        <p style={{ color: "#f85149" }}>{err}</p>
        <p>Start API: <code>docker compose -f infra/docker-compose.yml up</code> or <code>uvicorn</code> with Postgres.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Traces</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #30363d" }}>
            <th style={{ padding: 8 }}>ID</th>
            <th style={{ padding: 8 }}>Agent</th>
            <th style={{ padding: 8 }}>Reliability</th>
            <th style={{ padding: 8 }}>Risk</th>
            <th style={{ padding: 8 }}>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.trace_id} style={{ borderBottom: "1px solid #21262d" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/traces/${t.trace_id}`}>{t.trace_id.slice(0, 8)}…</Link>
              </td>
              <td style={{ padding: 8 }}>{t.agent_name}</td>
              <td style={{ padding: 8 }}>
                {t.reliability_score != null ? t.reliability_score : "—"}
              </td>
              <td style={{ padding: 8 }}>
                {t.hallucination_risk != null ? t.hallucination_risk : "—"}
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>{t.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p>No traces yet. POST one to the API.</p>}
    </div>
  );
}
