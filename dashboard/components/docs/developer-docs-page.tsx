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
import { DocsClaimGraphSection } from "@/components/docs/docs-claim-graph-section";
import { DocsJsonSections } from "@/components/docs/docs-json-sections";
import { developerDocsContent } from "@/lib/docs-content";

const SECTION_IDS = flatDocsNavIds();
const JSON_TOP_IDS = ["overview", "quickstart", "how-it-works"] as const;
const JSON_AFTER_API_IDS = [
  "claim-graph",
  "repair",
  "technical-concepts",
  "tracing",
  "evaluation",
  "backend-architecture",
  "data-plane",
  "processing-plane",
  "experiments",
  "dashboard-usage",
  "debugging",
  "examples",
  "release-readiness",
] as const;

export function DeveloperDocsPage() {
  const { productTab, setProductTab, activeId, setActiveId } = useDocsNav();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && SECTION_IDS.includes(hash)) {
      setActiveId(hash);
      const apiFirst = ["api", "claim-graph", "repair", "tracing", "evaluation"].includes(hash);
      if (apiFirst) setProductTab("api");
    }
  }, [setActiveId, setProductTab]);

  const onSelectProductTab = (tab: DocsProductTab) => {
    setProductTab(tab);
    const first = tab === "api" ? "api" : "overview";
    setActiveId(first);
    window.history.replaceState(null, "", `#${first}`);
  };

  const topSections = developerDocsContent.sections.filter((s) =>
    JSON_TOP_IDS.includes(s.id as (typeof JSON_TOP_IDS)[number]),
  );
  const afterApiSections = developerDocsContent.sections.filter((s) =>
    JSON_AFTER_API_IDS.includes(s.id as (typeof JSON_AFTER_API_IDS)[number]),
  );
  const jsonSections = [...topSections, ...afterApiSections];
  const activeJsonSection = jsonSections.find((s) => s.id === activeId) ?? null;

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
          {activeId === "api" ? (
            <section id="api" className="docs-section" data-doc-section>
              <h2 className="docs-h2">API — ingest traces</h2>
              <p className="docs-lead docs-lead--sm">
                Ingest and analyze LLM traces in real time. The same contract powers production agents and evaluation
                runners.
              </p>
              <p className="docs-p">
                Treat <code className="docs-inline-code">POST /api/v1/traces</code> as the canonical write contract. One
                request should represent one model turn with enough context to reproduce reliability analysis later
                (prompt, output, evidence, metadata).
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
              <div className="docs-callout">
                <p className="docs-callout-title">Implementation guidance</p>
                <ul className="docs-callout-list">
                  <li>Keep <code className="docs-inline-code">doc_id</code> stable for better trace comparability</li>
                  <li>Always include environment + experiment metadata for filtering</li>
                  <li>Send full retrieved evidence (not snippets) when possible</li>
                  <li>Version your producer payloads when introducing schema changes</li>
                </ul>
              </div>
            </section>
          ) : null}

          {activeId === "claim-graph" ? <DocsClaimGraphSection /> : null}

          {activeId === "architecture" ? <DocsArchitectureSection /> : null}

          {activeId === "sdks" ? (
            <section id="sdks" className="docs-section docs-section--muted" data-doc-section>
              <h2 className="docs-h2">SDKs</h2>
              <p className="docs-p">
                Official SDKs are on the roadmap. Until then, use HTTP from any runtime (see tabs on{" "}
                <a href="#api">Ingest traces</a>).
              </p>
            </section>
          ) : null}

          {activeJsonSection && activeId !== "claim-graph" ? <DocsJsonSections sections={[activeJsonSection]} /> : null}

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
