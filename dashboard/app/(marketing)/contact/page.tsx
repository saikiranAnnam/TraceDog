import Link from "next/link";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  return (
    <article style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "1rem" }}>Contact</h1>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.65, marginBottom: "1rem" }}>
        We welcome feedback, contributors, and early adopters. Open an issue or discussion on{" "}
        <a href={SITE.github} style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          GitHub
        </a>{" "}
        (set <code style={{ fontSize: "0.85em" }}>NEXT_PUBLIC_GITHUB_URL</code> to your repo URL when
        published).
      </p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
