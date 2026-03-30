import { fetchTraces } from "@/lib/api";
import { TracesDecisionDashboard } from "@/components/traces/traces-decision-dashboard";

export default async function TracesPage() {
  let rows: Awaited<ReturnType<typeof fetchTraces>> = [];
  let err: string | null = null;
  try {
    rows = await fetchTraces({ limit: 500 });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load traces";
  }

  if (err) {
    return (
      <div className="trace-debugger td-traces-page">
        <h1 className="tdv-page-title">Traces</h1>
        <p className="td-traces-error">{err}</p>
        <p className="tdv-section-sub td-traces-hero-sub">
          Start API: <code>docker compose -f infra/docker-compose.yml up</code> or{" "}
          <code>uvicorn</code> with Postgres. Set <code>NEXT_PUBLIC_API_URL</code> if needed.
        </p>
      </div>
    );
  }

  return <TracesDecisionDashboard traces={rows} />;
}
