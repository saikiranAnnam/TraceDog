"use client";

import { Fragment } from "react";
import { ArrowRight, CircleDot, Search, Sparkles, Wrench, Workflow } from "lucide-react";
import type { ExecutionGraphNode, ExecutionGraphPayload } from "@/lib/types";
function statusDotClass(status: string | null): string {
  if (!status) return "eg-dot eg-dot--unknown";
  const s = status.toLowerCase();
  if (s === "ok" || s === "success" || s === "completed") return "eg-dot eg-dot--ok";
  if (s === "error" || s === "failed" || s === "timeout") return "eg-dot eg-dot--error";
  return "eg-dot eg-dot--unknown";
}

function statusDotTitle(status: string | null): string {
  if (!status) return "unknown";
  return status;
}

function spanIcon(spanType: string) {
  const t = spanType.toLowerCase();
  if (t.includes("retriev") || t.includes("search") || t.includes("embed")) return Search;
  if (t.includes("llm") || t.includes("chat") || t.includes("completion") || t.includes("model"))
    return Sparkles;
  if (t.includes("tool") || t.includes("function")) return Wrench;
  if (t.includes("router") || t.includes("plan") || t.includes("orchestr")) return Workflow;
  return CircleDot;
}

function spanAccentClass(spanType: string): string {
  const t = spanType.toLowerCase();
  if (t.includes("retriev") || t.includes("search") || t.includes("embed")) return "eg-node-card--retriever";
  if (t.includes("llm") || t.includes("chat") || t.includes("completion")) return "eg-node-card--llm";
  if (t.includes("tool") || t.includes("function")) return "eg-node-card--tool";
  return "eg-node-card--default";
}

function formatDuration(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function SpanCard({ node, stepIndex }: { node: ExecutionGraphNode; stepIndex: number }) {
  const Icon = spanIcon(node.span_type);
  const duration = formatDuration(node.duration_ms);

  return (
    <article
      className={`eg-node-card ${spanAccentClass(node.span_type)}`}
      aria-labelledby={`eg-span-${node.id}-title`}
    >
      <div className="eg-node-card-top">
        <span className="eg-node-step" aria-hidden>
          {stepIndex}
        </span>
        <div className="eg-node-icon-wrap" aria-hidden>
          <Icon className="eg-node-icon" strokeWidth={1.75} />
        </div>
        <span
          className={statusDotClass(node.status)}
          title={statusDotTitle(node.status)}
          aria-label={`Status: ${statusDotTitle(node.status)}`}
        />
      </div>
      <h3 className="eg-node-title" id={`eg-span-${node.id}-title`}>
        {node.span_type}
      </h3>
      {node.label ? <p className="eg-node-label">{node.label}</p> : null}
      {duration ? (
        <p className="eg-node-duration">
          <span className="eg-node-duration-k">Duration</span>
          <span className="eg-node-duration-v">{duration}</span>
        </p>
      ) : null}
    </article>
  );
}

function FlowConnector() {
  return (
    <div className="eg-connector" aria-hidden>
      <span className="eg-connector-line" />
      <span className="eg-connector-arrow">
        <ArrowRight className="eg-connector-arrow-icon" strokeWidth={2} aria-hidden />
      </span>
    </div>
  );
}

/**
 * Renders nodes in `position` order, connected left→right. Edges that imply branching
 * still use position order for layout until a full DAG layout is added.
 */
export function ExecutionGraphView({ graph }: { graph: ExecutionGraphPayload }) {
  if (!graph.nodes.length) {
    return <p className="tdv-muted">No execution graph data.</p>;
  }

  const sorted = [...graph.nodes].sort((a, b) => a.position - b.position);

  return (
    <div className="eg-root tdv-card" aria-label="Agent execution graph">
      <div className="eg-canvas">
        <div className="eg-flow" aria-label="Execution pipeline steps">
          {sorted.map((node, i) => (
            <Fragment key={node.id}>
              {i > 0 ? <FlowConnector /> : null}
              <div className="eg-flow-node-wrap">
                <SpanCard node={node} stepIndex={i + 1} />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      {graph.edges.length > 0 ? (
        <footer className="eg-footer">
          <span className="eg-footer-pill">{graph.edges.length} edge{graph.edges.length === 1 ? "" : "s"}</span>
          <span className="eg-footer-text">
            Sequential flow shown left to right. Forks in the DAG are flattened to run order when
            branch layout is not available.
          </span>
        </footer>
      ) : (
        <footer className="eg-footer eg-footer--minimal">
          <span className="eg-footer-text">Inferred sequential chain from span order.</span>
        </footer>
      )}
    </div>
  );
}
