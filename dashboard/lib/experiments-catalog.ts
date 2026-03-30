export type ExperimentId =
  | "eval_pipeline"
  | "squad_v2"
  | "hotpot_qa"
  | "cgge"
  | "hybrid_engine";

export type ExperimentDefinition = {
  id: ExperimentId;
  label: string;
  description: string;
  command: string;
  inputLabel: string;
  outputLabel: string;
  inputExample: string;
  outputExample: string;
};

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: "eval_pipeline",
    label: "Eval data pipeline",
    description:
      "Registry → fetch → validate → provenance → runner → POST traces. Same plane as the Data page pipeline diagram.",
    command:
      "PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 10 --summary --experiment smoke",
    inputLabel: "Slice request (conceptual)",
    outputLabel: "Trace rows + pipeline_stats",
    inputExample: `{
  "source_id": "squad_v2",
  "split": "validation",
  "offset": 0,
  "limit": 10,
  "use_cache": true
}`,
    outputExample: `{
  "ingest_metadata": {
    "eval_lineage": {
      "descriptor": { "dataset_name": "squad_v2", ... },
      "pipeline_stats": {
        "fetch_ms": 842,
        "rows_returned": 10,
        "cache_hit": false
      }
    }
  },
  "grounding_score": 0.62,
  "claim_grounding": { "claims": [...], ... }
}`,
  },
  {
    id: "squad_v2",
    label: "SQuAD v2 benchmark",
    description: "Reading comprehension with unanswerable questions — standard eval runner through TraceDog.",
    command:
      "PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 25 --summary --experiment squad-cgge",
    inputLabel: "Prompt + retrieved passages",
    outputLabel: "Model answer + trace scores",
    inputExample: `Question: Which team won the 2015 championship?
Context: [passage A] [passage B] ...`,
    outputExample: `{
  "response": "The New England Patriots won Super Bowl XLIX in 2015.",
  "grounding_score": 0.71,
  "claim_grounding": {
    "response_groundedness": 0.82,
    "unsupported_ratio": 0.12
  },
  "reliability_insights": { "hybrid_hallucination": { ... } }
}`,
  },
  {
    id: "hotpot_qa",
    label: "HotpotQA (multi-hop)",
    description: "Multi-document QA — same runner pattern with gold attribution for recall checks.",
    command: "PYTHONPATH=. python -m evaluation.runners.run_hotpot_eval --limit 15 --summary",
    inputLabel: "Question + supporting paragraphs",
    outputLabel: "Answer + CGGE + optional recall",
    inputExample: `Question: Which magazine was started first, ...?
Retrieved: [para from doc1] [para from doc2] ...`,
    outputExample: `{
  "attribution_recall_vs_gold": 0.67,
  "cgge_unsupported_ratio": 0.2,
  "failure_reason": null
}`,
  },
  {
    id: "cgge",
    label: "CGGE (claim graph grounding)",
    description:
      "Decompose answers into atomic claims; score support vs contradiction per claim against retrieved evidence.",
    command: "GET /api/v1/traces/{id}/claim-graph  ·  see docs/CGGE.md",
    inputLabel: "Model response + retrieved_docs[]",
    outputLabel: "Per-claim labels + graph",
    inputExample: `response: "DynamoDB scales horizontally and guarantees zero latency."
retrieved_docs: [{ "doc_id": "1", "content": "..." }]`,
    outputExample: `{
  "claims": [
    {
      "claim_text": "DynamoDB scales horizontally",
      "label": "supported",
      "support_score": 0.78,
      "contradiction_score": 0.1
    },
    {
      "claim_text": "guarantees zero latency",
      "label": "conflicted",
      ...
    }
  ],
  "response_groundedness": 0.62
}`,
  },
  {
    id: "hybrid_engine",
    label: "Hybrid scorer + RCA + repair",
    description:
      "Weighted claim risk, causal root-cause hints, and repair intents — reliability_insights on each ingest.",
    command: "POST /api/v1/traces (automatic)  ·  scripts/compare_jsonl_runs.py",
    inputLabel: "claim_grounding + spans + per_doc_similarity",
    outputLabel: "reliability_insights JSON",
    inputExample: `{
  "claim_grounding": { "claims": [...] },
  "spans": [{ "span_type": "retriever", "status": "ok" }],
  "retrieved_docs": [...]
}`,
    outputExample: `{
  "hybrid_hallucination": {
    "aggregates": {
      "answer_hallucination_score": 0.31,
      "trace_reliability_score": 0.69
    }
  },
  "causal_rca": {
    "root_cause_primary": "retrieval_noise_overload",
    "repair_recommendation": "..."
  },
  "repair_loop": { "steps": [{ "action": "RETRIEVE_MORE", ... }] }
}`,
  },
];

export function getExperiment(id: ExperimentId): ExperimentDefinition | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}
