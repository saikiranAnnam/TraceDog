import Link from "next/link";
import { AIExecutionGraph } from "@/components/landing/premium/ai-execution-graph";

export default function ExperimentsPage() {
  return (
    <article style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "1rem" }}>Experiments</h1>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.6, marginBottom: "1rem" }}>
        TraceDog is validated on public benchmarks (e.g. SQuAD-style QA) and multi-model runs. Methodology
        details and reproducibility notes will live here as we publish them.
      </p>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.6, marginBottom: "2rem" }}>
        For scoring internals, see the <Link href="/docs">docs</Link> and repository.
      </p>
      <AIExecutionGraph />
      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
