import { TraceDetailView } from "@/components/traces/trace-detail-view";
import { fetchTrace } from "@/lib/api";
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
      <div className="trace-detail">
        <Link href="/traces">← Traces</Link>
        <h1>Trace</h1>
        <p>{err}</p>
      </div>
    );
  }

  return <TraceDetailView t={t} />;
}
