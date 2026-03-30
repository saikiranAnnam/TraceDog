"use client";

import {
  ArchitectureFlowHairline,
  ArchitectureFlowJoint,
  PipelineArchitectureCard,
} from "@/components/data/pipeline-architecture-card";

/**
 * 3-row product layout: input → TraceDog core (dominant API) → data surfaces.
 * Matches design plan: section bands, vertical + horizontal flow hints, animated connectors.
 */
export function DataPipelineHighLevelGrid() {
  return (
    <div className="td-arch-diagram td-arch-diagram--high-level">
      <section className="td-arch-section td-arch-section--input">
        <h3 className="td-arch-section-label">Input layer</h3>
        <div className="td-arch-row td-arch-row--3">
          <PipelineArchitectureCard
            title="Sources & registry"
            subtitle="External inputs"
            tone="blue"
            status="healthy"
            bullets={[
              "HF datasets · source registry",
              "Pinned revisions · descriptors",
              "Lineage-ready catalog ids",
            ]}
          />
          <PipelineArchitectureCard
            title="Fetch pipeline"
            subtitle="Preparation"
            tone="purple"
            status="processing"
            bullets={["Materialize rows", "Slice cache · validation", "Stats + lineage events"]}
          />
          <PipelineArchitectureCard
            title="Runners & adapters"
            subtitle="Execution setup"
            tone="purple"
            status="healthy"
            bullets={["EvalCase generation", "Prompt assembly", "Batch / dry-run"]}
          />
        </div>
        <div className="td-arch-row-flow-h" aria-hidden>
          <ArchitectureFlowHairline />
        </div>
      </section>

      <ArchitectureFlowJoint />

      <section className="td-arch-section td-arch-section--core">
        <h3 className="td-arch-section-label">TraceDog core</h3>
        <div className="td-arch-row td-arch-row--core-12">
          <PipelineArchitectureCard
            title="TraceDog API"
            subtitle="Core orchestration"
            tone="purple"
            featured
            status="healthy"
            className="td-arch-col-span-7"
            bullets={[
              "POST /api/v1/traces",
              "Ingest + normalization",
              "Eval lineage · reliability hooks",
            ]}
          />
          <PipelineArchitectureCard
            title="Reliability engine"
            subtitle="Decision layer"
            tone="purple"
            status="healthy"
            className="td-arch-col-span-5"
            bullets={["Hybrid / CGGE scoring", "Grounding signals", "Risk & failure typing"]}
          />
        </div>
        <div className="td-arch-row-flow-h" aria-hidden>
          <ArchitectureFlowHairline />
        </div>
      </section>

      <ArchitectureFlowJoint />

      <section className="td-arch-section td-arch-section--data">
        <h3 className="td-arch-section-label">Data layer</h3>
        <div className="td-arch-row td-arch-row--3">
          <PipelineArchitectureCard
            title="PostgreSQL"
            subtitle="Persistence"
            tone="green"
            status="healthy"
            bullets={["Traces · scores · metadata", "ingest_metadata & experiments", "Durable audit trail"]}
          />
          <PipelineArchitectureCard
            title="Model comparison"
            subtitle="Experiment analysis"
            tone="green"
            status="healthy"
            bullets={[
              "Side-by-side model runs",
              "Experiment tags & versions",
              "Use Experiments in the app nav",
            ]}
          />
          <PipelineArchitectureCard
            title="Data dashboard"
            subtitle="Operator view"
            tone="blue"
            status="healthy"
            bullets={["Pipeline health charts", "Admin checks · traces", "This page"]}
          />
        </div>
        <p className="td-arch-read-path">
          Read path to dashboard: <strong>GET</strong> traces / APIs (dashed style in earlier flows).
        </p>
      </section>
    </div>
  );
}
