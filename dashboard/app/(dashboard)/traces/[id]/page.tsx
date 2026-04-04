import { TraceDetailView } from "@/components/traces/trace-detail-view";
import { fetchClaimGraph, fetchExecutionGraph, fetchTrace } from "@/lib/api";
import type { ClaimGraphPayload, ExecutionGraphPayload } from "@/lib/types";
import Link from "next/link";

export default async function TraceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let err: string | null = null;
  let t: Awaited<ReturnType<typeof fetchTrace>> | null = null;
  try {
    t = await fetchTrace(params.id);
  } catch {
    err = "Not found or API down";
  }

  if (err || !t) {
    return (
      <div className="trace-debugger">
        <Link href="/traces">← Traces</Link>
        <h1>Trace</h1>
        <p>{err}</p>
      </div>
    );
  }

  let claimGraph: ClaimGraphPayload | null = null;
  try {
    claimGraph = await fetchClaimGraph(params.id);
  } catch {
    claimGraph = null;
  }

  let executionGraph: ExecutionGraphPayload | null = null;
  try {
    executionGraph = await fetchExecutionGraph(params.id);
  } catch {
    executionGraph = null;
  }

  return <TraceDetailView t={t} claimGraph={claimGraph} executionGraph={executionGraph} />;
}
