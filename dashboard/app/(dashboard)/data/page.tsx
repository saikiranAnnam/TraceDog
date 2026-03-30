import { fetchTraces } from "@/lib/api";
import { DataPipelineOverview } from "@/components/data/data-pipeline-overview";

export default async function DataPipelinePage() {
  let err: string | null = null;
  let rows: Awaited<ReturnType<typeof fetchTraces>> = [];
  try {
    rows = await fetchTraces({ limit: 500 });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load traces";
  }

  if (err) {
    return (
      <div className="trace-debugger td-traces-page">
        <h1 className="tdv-page-title">Data pipeline</h1>
        <p className="td-traces-error">{err}</p>
        <p className="tdv-section-sub td-traces-hero-sub">
          Start the API and Postgres, set <code>NEXT_PUBLIC_API_URL</code> if needed.
        </p>
      </div>
    );
  }

  return <DataPipelineOverview traces={rows} />;
}
