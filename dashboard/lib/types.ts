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
};

export type TraceSpan = {
  position: number;
  span_type: string;
  label: string | null;
  duration_ms: number | null;
  status: string | null;
  meta?: Record<string, unknown> | null;
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
};
