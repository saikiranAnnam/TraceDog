"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";

import {
  ArchitectureFlowHairline,
  ArchitectureFlowJoint,
  PipelineArchitectureCard,
  type ArchitectureTone,
} from "@/components/data/pipeline-architecture-card";

export type PipelineModuleId =
  | "registry"
  | "row_source"
  | "cache"
  | "fetch"
  | "validate"
  | "provenance"
  | "runner"
  | "ingest";

type ModuleMeta = {
  label: string;
  sub: string;
  tooltip: string;
  purpose: string;
  calls: string[];
};

export const PIPELINE_MODULE_META: Record<PipelineModuleId, ModuleMeta> = {
  registry: {
    label: "SOURCE_REGISTRY",
    sub: "evaluation/sources/registry.py",
    tooltip: "Dataset catalog: ids, HF pins, splits, build() factories.",
    purpose:
      "Central catalog mapping stable source ids (e.g. squad_v2, hotpot_qa_fullwiki) to Hugging Face dataset names, pinned revisions, tags, and a builder that instantiates the correct EvalRowSource implementation for a split or optional local JSON path.",
    calls: ["SOURCE_REGISTRY", "get_registry_entry", "build_registered_source", "list_registry_entries"],
  },
  row_source: {
    label: "EvalRowSource",
    sub: "evaluation/sources/types.py · per-dataset modules",
    tooltip: "Protocol: describe() + fetch_rows(offset, limit).",
    purpose:
      "Each registered dataset implements EvalRowSource: describe() returns a SourceDescriptor (provider, revision, schema), and fetch_rows returns native dict rows in stable order. SQuAD and Hotpot adapters live under evaluation/sources/.",
    calls: ["EvalRowSource", "SourceDescriptor", "SquadV2RowSource.fetch_rows", "HotpotQARowSource.fetch_rows"],
  },
  cache: {
    label: "Slice cache",
    sub: "evaluation/sources/cache.py",
    tooltip: "Optional JSONL slice cache; cache hit skips network fetch.",
    purpose:
      "When use_cache is enabled, the pipeline computes a slice_cache_key from the descriptor and offset/limit, reads a materialized slice if present, and short-circuits with PipelineStats marking cache_hit. On miss, fetched rows can be written back for reproducible offline runs.",
    calls: ["slice_cache_key", "read_slice_cache", "write_slice_cache", "default_cache_root"],
  },
  fetch: {
    label: "Retry + fetch",
    sub: "pipeline.fetch_rows_pipeline",
    tooltip: "Retries native fetch with exponential backoff.",
    purpose:
      "Orchestrates the live path: _retry_call wraps source.fetch_rows with configurable attempts and backoff so HF or filesystem blips do not fail an entire eval batch. fetch_attempts and timing feed PipelineStats.",
    calls: ["fetch_rows_pipeline", "_retry_call", "source.fetch_rows(offset, limit)"],
  },
  validate: {
    label: "validate_raw_row",
    sub: "pipeline.py · quarantine counters",
    tooltip: "Per-row schema checks; bad rows quarantined or fail-fast.",
    purpose:
      "Registry-specific validation (required keys for squad_v2 / hotpot_qa_fullwiki) runs before adapters. With on_validation_error=skip, bad rows increment rows_quarantined and are logged; with fail, the pipeline raises.",
    calls: ["validate_raw_row", "on_validation_error", "rows_quarantined"],
  },
  provenance: {
    label: "Descriptor + events + stats",
    sub: "types · pipeline_events · PipelineStats",
    tooltip: "Slice hash, JSONL events, stats for lineage.",
    purpose:
      "Successful rows get with_slice_and_hash for slice_spec and source_hash; PipelineStats records fetch_ms, row counts, cache behavior, and emit_source_fetch_complete writes structured pipeline events for observability. The same stats surface on traces as eval_lineage.pipeline_stats after ingest.",
    calls: [
      "with_slice_and_hash",
      "short_hash_rows",
      "PipelineStats",
      "emit_source_fetch_complete",
      "build_source_fetch_complete_event",
    ],
  },
  runner: {
    label: "Runner & adapter",
    sub: "evaluation/runners/ …",
    tooltip: "Rows → EvalCase → model → trace payload.",
    purpose:
      "Eval runners load batches through fetch_rows_pipeline, adapt each row into prompts / EvalCase, call the configured LLM or dry-run path, and assemble payloads for TraceDog. This is where dataset specifics meet your agent contract.",
    calls: ["fetch_rows_pipeline(...)", "evaluation.runners.run_squad_eval", "adapters.*"],
  },
  ingest: {
    label: "TraceDog ingest",
    sub: "POST /api/v1/traces",
    tooltip: "HTTP ingest; ingest_metadata carries eval_lineage.",
    purpose:
      "The runner POSTs traces to the API with optional ingest_metadata containing dataset id, descriptor, and pipeline stats. The reliability layer scores and persists rows; the Data page charts read pipeline_stats from stored traces.",
    calls: ["POST /api/v1/traces", "ingest_metadata", "eval_lineage.pipeline_stats"],
  },
};

export type PipelineNodeStatus = "healthy" | "processing" | "degraded";

type ModuleOps = {
  layerLabel: string;
  tier: "external" | "core" | "coreFocus" | "data" | "pipeline";
  status: PipelineNodeStatus;
  demoMetrics: { label: string; value: string }[];
  inputs: string[];
  outputs: string[];
};

const MODULE_OPS: Record<PipelineModuleId, ModuleOps> = {
  registry: {
    layerLabel: "External · Catalog",
    tier: "external",
    status: "healthy",
    demoMetrics: [
      { label: "Registered IDs", value: "2" },
      { label: "HF pins", value: "locked" },
    ],
    inputs: ["Dataset id (squad_v2, hotpot_qa_fullwiki)", "split · optional json_path"],
    outputs: ["DatasetRegistryEntry", "EvalRowSource factory"],
  },
  row_source: {
    layerLabel: "External · IO",
    tier: "external",
    status: "healthy",
    demoMetrics: [
      { label: "Protocol", value: "EvalRowSource" },
      { label: "Batch size", value: "limit 500" },
    ],
    inputs: ["offset", "limit"],
    outputs: ["Native row dicts", "SourceDescriptor (base)"],
  },
  cache: {
    layerLabel: "Pipeline · Persistence",
    tier: "pipeline",
    status: "processing",
    demoMetrics: [
      { label: "Cache hit (demo)", value: "32%" },
      { label: "Slice keys", value: "SHA slice" },
    ],
    inputs: ["SourceDescriptor", "offset/limit"],
    outputs: ["Cached rows OR miss", "slice_cache_key"],
  },
  fetch: {
    layerLabel: "Pipeline · Network",
    tier: "pipeline",
    status: "processing",
    demoMetrics: [
      { label: "Retries (max)", value: "3" },
      { label: "p50 fetch_ms (demo)", value: "840" },
    ],
    inputs: ["EvalRowSource.fetch_rows"],
    outputs: ["Raw rows", "fetch_attempts"],
  },
  validate: {
    layerLabel: "Core engine",
    tier: "core",
    status: "healthy",
    demoMetrics: [
      { label: "Quarantined (demo)", value: "4" },
      { label: "Mode", value: "skip" },
    ],
    inputs: ["registry_id", "row dict"],
    outputs: ["Filtered rows", "rows_quarantined"],
  },
  provenance: {
    layerLabel: "Core engine · Observability",
    tier: "core",
    status: "healthy",
    demoMetrics: [
      { label: "Events emit", value: "fetch_complete" },
      { label: "Hash", value: "sha16" },
    ],
    inputs: ["rows", "base descriptor"],
    outputs: ["SourceDescriptor + slice", "PipelineStats", "JSONL events"],
  },
  runner: {
    layerLabel: "Core engine · Eval",
    tier: "core",
    status: "healthy",
    demoMetrics: [
      { label: "Runs (demo)", value: "128" },
      { label: "Failures (demo)", value: "12" },
    ],
    inputs: ["Validated rows", "model config"],
    outputs: ["Trace payloads", "EvalCase stream"],
  },
  ingest: {
    layerLabel: "Core engine · API",
    tier: "coreFocus",
    status: "healthy",
    demoMetrics: [
      { label: "Latency p50 (demo)", value: "120ms" },
      { label: "Scorer", value: "hybrid" },
    ],
    inputs: ["Trace JSON", "ingest_metadata"],
    outputs: ["Persisted trace id", "scores"],
  },
};

function tierToTone(tier: ModuleOps["tier"]): ArchitectureTone {
  if (tier === "external") return "blue";
  if (tier === "pipeline") return "orange";
  return "purple";
}

function bulletsFor(id: PipelineModuleId): string[] {
  const meta = PIPELINE_MODULE_META[id];
  const parts = meta.sub.split(/ · | …/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 4);
  return [meta.sub, ...MODULE_OPS[id].outputs.slice(0, 2)].slice(0, 4);
}

const INTERNAL_SECTIONS: {
  sectionLabel: string;
  band: "input" | "pipeline" | "core" | "ingest";
  ids: PipelineModuleId[];
}[] = [
  { sectionLabel: "Input layer", band: "input", ids: ["registry", "row_source"] },
  { sectionLabel: "Pipeline", band: "pipeline", ids: ["cache", "fetch"] },
  { sectionLabel: "Core processing", band: "core", ids: ["validate", "provenance", "runner"] },
  { sectionLabel: "Ingest", band: "ingest", ids: ["ingest"] },
];

/** Sectioned grid + rail; same card system as high-level (no React Flow). */
export function DataPipelineInternalFlow() {
  const [hoverId, setHoverId] = useState<PipelineModuleId | null>(null);
  const [selectedId, setSelectedId] = useState<PipelineModuleId | null>(null);

  const focusId = selectedId ?? hoverId;
  const meta = focusId ? PIPELINE_MODULE_META[focusId] : null;
  const ops = focusId ? MODULE_OPS[focusId] : null;

  return (
    <div
      className="td-pipeline-internal-layout"
      onMouseLeave={() => setHoverId(null)}
    >
      <div className="td-pipeline-internal-flow-main td-arch-diagram td-arch-diagram--internal">
        {INTERNAL_SECTIONS.map((sec, si) => (
          <div key={sec.sectionLabel}>
            <section
              className={clsx(
                "td-arch-section",
                sec.band === "input" && "td-arch-section--input",
                sec.band === "pipeline" && "td-arch-section--pipeline",
                sec.band === "core" && "td-arch-section--core",
                sec.band === "ingest" && "td-arch-section--ingest",
              )}
            >
              <h3 className="td-arch-section-label">{sec.sectionLabel}</h3>
              <div
                className={
                  sec.ids.length === 1
                    ? "td-arch-row td-arch-row--1"
                    : sec.ids.length === 2
                      ? "td-arch-row td-arch-row--2"
                      : "td-arch-row td-arch-row--3"
                }
              >
                {sec.ids.map((id) => {
                  const m = PIPELINE_MODULE_META[id];
                  const o = MODULE_OPS[id];
                  const featured = id === "ingest";
                  return (
                    <PipelineArchitectureCard
                      key={id}
                      title={m.label}
                      subtitle={o.layerLabel}
                      bullets={bulletsFor(id)}
                      tone={tierToTone(o.tier)}
                      featured={featured}
                      status={o.status}
                      selected={selectedId === id}
                      hint={id === "ingest" ? undefined : "Click · panel →"}
                      onMouseEnter={() => setHoverId(id)}
                      onClick={() =>
                        setSelectedId((prev) => (prev === id ? null : id))
                      }
                    />
                  );
                })}
              </div>
              {sec.ids.length > 1 ? (
                <div className="td-arch-row-flow-h" aria-hidden>
                  <ArchitectureFlowHairline />
                </div>
              ) : null}
            </section>
            {si < INTERNAL_SECTIONS.length - 1 ? <ArchitectureFlowJoint /> : null}
          </div>
        ))}
      </div>

      <aside
        className={clsx("td-pipeline-rail", selectedId && "td-pipeline-rail--pinned")}
        aria-label="Module details"
      >
        {meta && ops ? (
          <>
            <div className="td-pipeline-rail-header">
              <span className="td-pipeline-rail-kicker">{ops.layerLabel}</span>
              <h3 className="td-pipeline-rail-title">{meta.label}</h3>
              <p className="td-pipeline-rail-sub">{meta.sub}</p>
              <div className="td-pipeline-rail-status-row">
                <span
                  className={clsx(
                    "td-pipeline-rail-pill",
                    ops.status === "healthy" && "td-pipeline-rail-pill--ok",
                    ops.status === "processing" && "td-pipeline-rail-pill--active",
                    ops.status === "degraded" && "td-pipeline-rail-pill--bad",
                  )}
                >
                  {ops.status === "healthy"
                    ? "Healthy"
                    : ops.status === "processing"
                      ? "Active"
                      : "Needs attention"}{" "}
                  <span className="td-pipeline-rail-pill-note">(demo)</span>
                </span>
              </div>
            </div>

            <div className="td-pipeline-rail-section">
              <h4 className="td-pipeline-rail-h4">Purpose</h4>
              <p className="td-pipeline-rail-body">{meta.purpose}</p>
            </div>

            <div className="td-pipeline-rail-split">
              <div className="td-pipeline-rail-section">
                <h4 className="td-pipeline-rail-h4">Inputs</h4>
                <ul className="td-pipeline-rail-list">
                  {ops.inputs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="td-pipeline-rail-section">
                <h4 className="td-pipeline-rail-h4">Outputs</h4>
                <ul className="td-pipeline-rail-list">
                  {ops.outputs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="td-pipeline-rail-section">
              <h4 className="td-pipeline-rail-h4">Metrics (demo)</h4>
              <dl className="td-pipeline-rail-metrics">
                {ops.demoMetrics.map((row) => (
                  <div key={row.label} className="td-pipeline-rail-metric">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="td-pipeline-rail-section">
              <h4 className="td-pipeline-rail-h4">Calls</h4>
              <ul className="td-pipeline-rail-calls">
                {meta.calls.map((c) => (
                  <li key={c}>
                    <code>{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="td-pipeline-rail-empty">
            <h3 className="td-pipeline-rail-title">Inspect a stage</h3>
            <p className="td-pipeline-rail-body">
              Hover a card to preview; <strong>click</strong> to pin <strong>inputs · outputs · metrics · calls</strong>{" "}
              here.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
