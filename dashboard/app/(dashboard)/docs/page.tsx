import Link from "next/link";

export default function DocsPage() {
  return (
    <article className="landing-page-article landing-container">
      <h1 className="landing-page-title">API</h1>
      <p className="landing-prose">
        Ingest traces with <code className="landing-code">POST /api/v1/traces</code> on the backend
        (default <code className="landing-code">http://localhost:8000</code>). Set{" "}
        <code className="landing-code">NEXT_PUBLIC_API_URL</code> in the dashboard if the API is
        elsewhere.
      </p>
      <h2 className="landing-page-h2">Quick start</h2>
      <ul className="landing-page-list">
        <li>
          Run the API and Postgres (e.g. <code className="landing-code">docker compose</code> from the
          repo).
        </li>
        <li>
          POST a JSON body with <code className="landing-code">agent_name</code>,{" "}
          <code className="landing-code">prompt</code>, <code className="landing-code">response</code>,{" "}
          <code className="landing-code">model_name</code>, <code className="landing-code">latency_ms</code>
          , and optional <code className="landing-code">retrieved_docs</code> / <code className="landing-code">spans</code>.
        </li>
        <li>
          Open <Link href="/traces">Traces</Link> in this dashboard to list and inspect runs.
        </li>
      </ul>
      <p className="landing-page-back">
        <Link href="/" className="landing-link-arrow">
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
