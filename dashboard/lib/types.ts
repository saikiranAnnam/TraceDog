export type TraceListItem = {
  trace_id: string;
  agent_name: string;
  environment: string;
  prompt: string;
  model_name: string;
  latency_ms: number;
  status: string;
  created_at: string;
  reliability_score: number | null;
  hallucination_risk: number | null;
  grounding_score?: number | null;
  failure_type?: string | null;
  experiment_tag?: string | null;
  eval_fetch_ms?: number | null;
  eval_rows_quarantined?: number | null;
  eval_cache_hit?: boolean | null;
  /** SEV-1 … SEV-5 incident severity when present */
  severity?: string | null;
};

export type TraceSpan = {
  position: number;
  span_type: string;
  label: string | null;
  duration_ms: number | null;
  status: string | null;
  meta?: Record<string, unknown> | null;
};

export type ClaimGraphPayload = {
  trace_id: string;
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    data?: Record<string, unknown>;
  }>;
};

export type ClaimGroundingItem = {
  claim_text: string;
  best_doc_id?: string | null;
  best_evidence_span?: string | null;
  support_score: number;
  contradiction_score: number;
  label: string;
  grounding_mode?: string | null;
  short_answer_flag?: boolean | null;
};

export type TraceDetail = TraceListItem & {
  response: string;
  retrieved_docs: {
    doc_id: string;
    content: string;
    similarity_score?: number | null;
  }[];
  spans: TraceSpan[];
  grounding_score: number | null;
  reliability_score: number | null;
  hallucination_risk: number | null;
  failure_type: string | null;
  explanation?: string | null;
  ingest_metadata?: Record<string, unknown> | null;
  claim_grounding?: {
    claims: ClaimGroundingItem[];
    response_groundedness: number;
    unsupported_ratio: number;
    grounding_mode?: string | null;
  } | null;
  grounding_layers?: Record<string, unknown> | null;
  failure_reason?: string | null;
  /** Hybrid scorer + RCA + repair policy (API `reliability_insights`). */
  reliability_insights?: Record<string, unknown> | null;
};
