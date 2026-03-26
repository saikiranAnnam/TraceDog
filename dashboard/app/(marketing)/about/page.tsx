import Link from "next/link";

export default function AboutPage() {
  return (
    <article style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "1rem" }}>About TraceDog</h1>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.65, marginBottom: "1rem" }}>
        TraceDog is an open-source project focused on observability and reliability for LLM-powered agents
        and RAG systems. We combine trace ingestion, hybrid grounding scores, and a decision-oriented UI so
        engineers can see <em>why</em> a run looks safe or risky — not just raw logs.
      </p>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.65 }}>
        The project is early (V1) and evolving in public with the community.
      </p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
