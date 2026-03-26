import Link from "next/link";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const ownerName = "Sai Kiran Annam";
  const email = "saikiranannam99@gmail.com";
  const linkedInUrl = "https://www.linkedin.com/in/saikiranannam/";
  const githubUrl = "https://github.com/saikiranAnnam/TraceDog";

  return (
    <article style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.25rem 4rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 650, marginBottom: "1rem" }}>Contact</h1>
      <p style={{ color: "var(--ld-muted, #94a3b8)", lineHeight: 1.65, marginBottom: "1.25rem" }}>
        We welcome feedback, contributors, and early adopters. If you want to reach the maintainer directly,
        use the contact details below — or open an issue/discussion on{" "}
        <a href={SITE.github} style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          GitHub
        </a>
        .
      </p>

      <div
        style={{
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 12,
          padding: "1.1rem 1.15rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 650, marginBottom: "0.75rem" }}>Contact details</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--ld-copy-prose, #e2e8f0)", lineHeight: 1.85 }}>
          <li>
            <strong>Owner</strong>: {ownerName}
          </li>
          <li>
            <strong>Email</strong>:{" "}
            <a href={`mailto:${email}`} style={{ color: "var(--ld-cyan, #22d3ee)" }}>
              {email}
            </a>
          </li>
          <li>
            <strong>LinkedIn</strong>:{" "}
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
              {linkedInUrl}
            </a>
          </li>
          <li>
            <strong>GitHub</strong>:{" "}
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
              {githubUrl}
            </a>
          </li>
        </ul>
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "var(--ld-cyan, #22d3ee)" }}>
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
