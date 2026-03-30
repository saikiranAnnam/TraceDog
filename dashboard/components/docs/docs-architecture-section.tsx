"use client";

import Link from "next/link";
import { SystemArchitectureFlow } from "@/components/architecture/system-architecture-flow";

/** Former /architecture page — now lives under /docs#architecture */
export function DocsArchitectureSection() {
  return (
    <section id="architecture" className="docs-section docs-arch-embed" data-doc-section>
      <h2 className="docs-h2">Architecture</h2>
      <p className="docs-lead docs-lead--sm arch-page-lead">
        How data moves through TraceDog: ingest, scoring, storage, and the dashboard. Use this map with the pipeline
        sections below to keep product and engineering aligned.
      </p>

      <div className="arch-section" aria-labelledby="arch-flow-heading">
        <h3 className="docs-h3 arch-subheading" id="arch-flow-heading">
          Request flow
        </h3>
        <p className="tdv-muted arch-section-desc">
          End-to-end path for a trace. Dashed edge: read path (dashboard polls the API backed by Postgres).
        </p>
        <div className="arch-flow-card">
          <SystemArchitectureFlow />
        </div>
      </div>

      <div className="arch-section" aria-labelledby="arch-pipelines-heading">
        <h3 className="docs-h3 arch-subheading" id="arch-pipelines-heading">
          Pipelines
        </h3>
        <p className="tdv-muted arch-section-desc">
          Three layers you can grow in parallel: what you capture, what you run as experiments, and how you measure
          quality.
        </p>
        <div className="arch-pipeline-grid">
          <article className="arch-pipeline-card">
            <h4 className="arch-pipeline-title">Data collection</h4>
            <p className="arch-pipeline-body">
              Ingest traces over HTTP with <code className="arch-code">POST /api/v1/traces</code>: prompt, response,
              <code className="arch-code"> retrieved_docs</code>, and optional{" "}
              <code className="arch-code">ingest_metadata</code> (dataset, experiment, environment). Same contract for
              production agents and offline eval runners.
            </p>
            <p className="arch-pipeline-ref">
              Contract: <Link href="/docs#api">API docs</Link> · repo{" "}
              <code className="arch-code">docs/03-api-contract.md</code>
            </p>
          </article>
          <article className="arch-pipeline-card">
            <h4 className="arch-pipeline-title">Experiments</h4>
            <p className="arch-pipeline-body">
              Admin-scoped jobs (e.g. scoring smoke) and the experiments surface exercise the same API and metadata
              filters so you can compare models and configs without forking the stack.
            </p>
            <p className="arch-pipeline-ref">
              <Link href="/lab">Experiments (lab)</Link> · public notes at{" "}
              <Link href="/experiments">/experiments</Link> · backend jobs under{" "}
              <code className="arch-code">app/experiments</code>
            </p>
          </article>
          <article className="arch-pipeline-card">
            <h4 className="arch-pipeline-title">Evaluation &amp; metrics</h4>
            <p className="arch-pipeline-body">
              Runners load public datasets (e.g. SQuAD, HotpotQA), call your LLM, then POST traces to TraceDog so
              grounding, CGGE, and claim-level metrics land in one place. Summaries and JSONL exports support batch
              analysis.
            </p>
            <p className="arch-pipeline-ref">
              Repo <code className="arch-code">evaluation/runners/</code> · see{" "}
              <code className="arch-code">evaluation/requirements.txt</code>
            </p>
          </article>
        </div>
      </div>

      <div className="arch-section" id="data-pipeline" aria-labelledby="arch-data-pipeline-heading">
        <h3 className="docs-h3 arch-subheading" id="arch-data-pipeline-heading">
          Evaluation data plane
        </h3>
        <p className="tdv-muted arch-section-desc">
          Benchmark rows flow through a dedicated layer before adapters and runners POST traces. Registry ids, pinned HF
          revisions, slice cache, materialized JSONL, and <code className="arch-code">eval_lineage</code> on ingest keep
          runs reproducible.
        </p>
        <div className="arch-data-plane-flow" aria-hidden>
          <div className="arch-data-plane-step">
            <span className="arch-data-plane-num">1</span>
            <div>
              <strong>Registry</strong>
              <p className="arch-data-plane-muted">
                <code className="arch-code">SOURCE_REGISTRY</code> → splits, tags, HF revision pin
              </p>
            </div>
          </div>
          <span className="arch-data-plane-arrow">→</span>
          <div className="arch-data-plane-step">
            <span className="arch-data-plane-num">2</span>
            <div>
              <strong>Fetch pipeline</strong>
              <p className="arch-data-plane-dew">Retries, validation, optional cache, structured events</p>
            </div>
          </div>
          <span className="arch-data-plane-arrow">→</span>
          <div className="arch-data-plane-step">
            <span className="arch-data-plane-num">3</span>
            <div>
              <strong>Adapter + LLM</strong>
              <p className="arch-data-plane-muted">Row → EvalCase → TraceDog API</p>
            </div>
          </div>
        </div>
        <p className="arch-pipeline-ref">
          Repo <code className="arch-code">evaluation/sources/</code> · operators:{" "}
          <Link href="/data" className="td-table-link">
            Data
          </Link>{" "}
          dashboard
        </p>
      </div>

      <div className="arch-section arch-section--compact" aria-labelledby="arch-next-heading">
        <h3 className="docs-h3 arch-subheading" id="arch-next-heading">
          Hardening the product
        </h3>
        <ul className="arch-bullet-list">
          <li>
            <strong>Collection</strong>: version your ingest schema; add batch importers only behind the same trace
            shape.
          </li>
          <li>
            <strong>Experiments</strong>: tag traces with <code className="arch-code">experiment_name</code> and
            environment so Overview and Traces stay filterable.
          </li>
          <li>
            <strong>Metrics</strong>: keep eval runners writing to the same API so dashboard charts and offline reports
            match.
          </li>
        </ul>
      </div>
    </section>
  );
}
