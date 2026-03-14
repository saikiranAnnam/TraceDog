import Link from "next/link";
import { fetchTrace } from "@/lib/api";

export default async function TraceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let t: Awaited<ReturnType<typeof fetchTrace>> | null = null;
  let err: string | null = null;
  try {
    t = await fetchTrace(params.id);
  } catch {
    err = "Not found or API down";
  }

  if (err || !t) {
    return (
      <div>
        <Link href="/traces">← Traces</Link>
        <h1>Trace</h1>
        <p>{err}</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/traces">← Traces</Link>
      <h1>Trace {t.trace_id}</h1>
      <p>
        <strong>Agent:</strong> {t.agent_name} ({t.environment}) ·{" "}
        <strong>Model:</strong> {t.model_name} · <strong>Latency:</strong>{" "}
        {t.latency_ms}ms
      </p>
      <p>
        <strong>Reliability:</strong> {t.reliability_score ?? "—"} ·{" "}
        <strong>Hallucination risk:</strong> {t.hallucination_risk ?? "—"} ·{" "}
        <strong>Grounding:</strong> {t.grounding_score ?? "—"}
      </p>
      {t.failure_type && (
        <p style={{ color: "#d29922" }}>Flag: {t.failure_type}</p>
      )}
      <h2>Prompt</h2>
      <pre
        style={{
          background: "#161b22",
          padding: 12,
          borderRadius: 6,
          whiteSpace: "pre-wrap",
        }}
      >
        {t.prompt}
      </pre>
      <h2>Response</h2>
      <pre
        style={{
          background: "#161b22",
          padding: 12,
          borderRadius: 6,
          whiteSpace: "pre-wrap",
        }}
      >
        {t.response}
      </pre>
      <h2>Retrieved docs</h2>
      <ul>
        {t.retrieved_docs?.map((d) => (
          <li key={d.doc_id} style={{ marginBottom: 12 }}>
            <strong>{d.doc_id}</strong>
            <pre
              style={{
                fontSize: 12,
                background: "#161b22",
                padding: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {d.content}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
