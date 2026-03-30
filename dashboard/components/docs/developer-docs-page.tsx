"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import {
  type DocsProductTab,
  flatDocsNavIds,
} from "@/lib/docs-nav";
import { useDocsNav } from "@/components/docs/docs-nav-context";
import { DocsCommandPalette } from "@/components/docs/docs-command-palette";
import { DocsCodeTabs } from "@/components/docs/docs-code-tabs";
import { DocsArchitectureSection } from "@/components/docs/docs-architecture-section";
import { DocsLiveTracePanel } from "@/components/docs/docs-live-trace-panel";

const SECTION_IDS = flatDocsNavIds();

export function DeveloperDocsPage() {
  const { productTab, setProductTab, activeId, setActiveId } = useDocsNav();

  const scrollToId = useCallback(
    (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    },
    [],
  );

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && SECTION_IDS.includes(hash)) {
      setActiveId(hash);
      const apiFirst = ["api", "claim-graph", "tracing", "evaluation"].includes(hash);
      if (apiFirst) setProductTab("api");
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }));
    }
  }, [setActiveId, setProductTab]);

  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          const id = visible.target.id;
          setActiveId(id);
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.1, 0.25, 0.5] },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [setActiveId]);

  const onSelectProductTab = (tab: DocsProductTab) => {
    setProductTab(tab);
    const first = tab === "api" ? "api" : "overview";
    scrollToId(first);
  };

  return (
    <div className="docs-platform">
      <DocsCommandPalette />

      <header className="docs-topbar">
        <nav className="docs-topbar-nav" aria-label="Product areas">
          <div className="docs-topbar-tabs" role="tablist" aria-label="Documentation scope">
            <button
              type="button"
              role="tab"
              aria-selected={productTab === "guides"}
              className={`docs-topbar-tab${productTab === "guides" ? " docs-topbar-tab--on" : ""}`}
              onClick={() => onSelectProductTab("guides")}
            >
              Docs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={productTab === "api"}
              className={`docs-topbar-tab${productTab === "api" ? " docs-topbar-tab--on" : ""}`}
              onClick={() => onSelectProductTab("api")}
            >
              API
            </button>
          </div>
        </nav>
        <p className="docs-topbar-hint">
          <kbd className="docs-kbd">⌘K</kbd> sections
        </p>
      </header>

      <div className="docs-grid">
        <main className="docs-main">
          <section id="overview" className="docs-section" data-doc-section>
            <p className="docs-eyebrow">TraceDog</p>
            <h1 className="docs-h1">Documentation</h1>
            <p className="docs-lead">
              Ingest LLM traces, score reliability with CGGE, and debug failures with claim-level context — same API for
              production and evals.
            </p>
          </section>

          <section id="quickstart" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Quickstart</h2>
            <ol className="docs-steps">
              <li>
                Run the API and Postgres (e.g. <code className="docs-inline-code">docker compose</code> from the repo
                root).
              </li>
              <li>
                Point the dashboard at your API with{" "}
                <code className="docs-inline-code">NEXT_PUBLIC_API_URL</code> if not on{" "}
                <code className="docs-inline-code">localhost:8000</code>.
              </li>
              <li>
                POST a trace (see <a href="#api">Ingest traces</a>), then open <Link href="/traces">Traces</Link> to
                verify.
              </li>
            </ol>
          </section>

          <section id="how-it-works" className="docs-section" data-doc-section>
            <h2 className="docs-h2">How it works</h2>
            <p className="docs-p">
              Data moves through TraceDog once per request — the pipeline below is what powers scores and the dashboard.
            </p>
            <div className="docs-flow docs-flow--hero" aria-hidden>
              <div className="docs-flow-track">
                <span className="docs-flow-node">Your app</span>
                <span className="docs-flow-arrow">→</span>
                <span className="docs-flow-node">API</span>
                <span className="docs-flow-arrow">→</span>
                <span className="docs-flow-node">TraceDog</span>
                <span className="docs-flow-arrow">→</span>
                <span className="docs-flow-node">Scores + CGGE</span>
                <span className="docs-flow-arrow">→</span>
                <span className="docs-flow-node">Dashboard</span>
              </div>
            </div>
          </section>

          <section id="api" className="docs-section" data-doc-section>
            <h2 className="docs-h2">API — ingest traces</h2>
            <p className="docs-lead docs-lead--sm">
              Ingest and analyze LLM traces in real time. The same contract powers production agents and evaluation
              runners.
            </p>

            <div className="docs-endpoint">
              <span className="docs-method">POST</span>
              <code className="docs-endpoint-path">/api/v1/traces</code>
            </div>

            <DocsCodeTabs />

            <div className="docs-callout docs-callout--insight">
              <p className="docs-callout-title">What gets scored</p>
              <ul className="docs-callout-list">
                <li>Hallucination risk and hybrid grounding vs. retrieved docs</li>
                <li>Claim graph (CGGE): supported / partial / unsupported / conflicted</li>
                <li>Failure hints for the trace debugger</li>
              </ul>
            </div>
          </section>

          <section id="claim-graph" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Claim graph</h2>
            <p className="docs-p">
              The dashboard trace view loads nodes and edges for React Flow from{" "}
              <code className="docs-inline-code">GET /api/v1/traces/{"{id}"}/claim-graph</code>. Use it to render the
              same graph in your own tools if needed.
            </p>
          </section>

          <section id="sdks" className="docs-section docs-section--muted" data-doc-section>
            <h2 className="docs-h2">SDKs</h2>
            <p className="docs-p">
              Official SDKs are on the roadmap. Until then, use HTTP from any runtime (see tabs on{" "}
              <a href="#api">Ingest traces</a>).
            </p>
          </section>

          <section id="tracing" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Tracing concepts</h2>
            <p className="docs-p">
              A <strong>trace</strong> is one model turn: prompt, response, model id, latency, optional retrieval
              passages, and optional spans. Everything is stored for Overview charts and per-trace debugging.
            </p>
          </section>

          <section id="evaluation" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Evaluation engine (CGGE)</h2>
            <p className="docs-p">
              Responses are decomposed into atomic claims and checked against evidence (chunk similarity + lexical
              signals). See repo <code className="docs-inline-code">docs/CGGE.md</code> for the full model.
            </p>
          </section>

          <DocsArchitectureSection />

          <section id="alerts" className="docs-section docs-section--muted" data-doc-section>
            <h2 className="docs-h2">Alerts &amp; rules</h2>
            <p className="docs-p">Coming soon — tie score thresholds to notifications.</p>
          </section>

          <section id="experiments" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Experiments</h2>
            <p className="docs-p">
              Tag traces via <code className="docs-inline-code">ingest_metadata</code>. The dashboard{" "}
              <Link href="/lab">Experiments</Link> lab walks through eval flows; smoke jobs use the same API as
              production.
            </p>
          </section>

          <section id="dashboard-usage" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Dashboard usage</h2>
            <p className="docs-p">
              <Link href="/overview">Overview</Link> for fleet health, <Link href="/traces">Traces</Link> for search and
              filters, trace detail for claim–evidence graph and signals.
            </p>
          </section>

          <section id="debugging" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Debug a trace</h2>
            <p className="docs-p">
              Flow: <strong>Input → output → claims → scores → root cause</strong>. Use the trace page to inspect
              grounding layers, claim labels, and retrieved passages side by side.
            </p>
          </section>

          <section id="examples" className="docs-section" data-doc-section>
            <h2 className="docs-h2">Examples</h2>
            <p className="docs-p">
              Evaluation runners live under <code className="docs-inline-code">evaluation/runners/</code> (SQuAD,
              HotpotQA). They call your LLM, POST traces, and aggregate CGGE metrics — same path as production.
            </p>
          </section>

          <footer className="docs-footer">
            <Link href="/" className="docs-footer-link">
              ← Marketing home
            </Link>
            <a href="#architecture" className="docs-footer-link">
              System architecture →
            </a>
          </footer>
        </main>

        <DocsLiveTracePanel activeId={activeId} />
      </div>
    </div>
  );
}
