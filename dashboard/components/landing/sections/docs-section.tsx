import Link from "next/link";
import { Reveal } from "@/components/landing/reveal";
import { SITE } from "@/lib/site";

const links = [
  { href: "/docs", title: "Docs", body: "Architecture, data model, scoring." },
  { href: "/docs", title: "API", body: "Ingest traces, pull detail, integrate." },
  { href: "/docs", title: "Algorithms", body: "Hybrid grounding and evaluation logic." },
  { href: "/docs", title: "Examples", body: "Sample payloads and flows." },
  { href: "/experiments", title: "Benchmarks", body: "Experiment notes and methodology." },
  { href: SITE.github, title: "GitHub", body: "Source, issues, contributions.", external: true },
] as const;

export function DocsSection() {
  return (
    <section id="engineering" className="ld-section ld-section--alt ld-docs-section">
      <div className="ld-container">
        <Reveal>
          <h2 className="ld-h2">Designed for engineers</h2>
          <p className="ld-sub ld-sub--visual">
            Dense entry points — same information architecture as serious devtools.
          </p>
        </Reveal>
        <div className="ld-docs-grid">
          {links.map((item) =>
            "external" in item && item.external ? (
              <a
                key={item.title}
                href={item.href}
                className="ld-docs-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="ld-docs-card-more">Open →</span>
              </a>
            ) : (
              <Link key={item.title} href={item.href} className="ld-docs-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="ld-docs-card-more">View →</span>
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
