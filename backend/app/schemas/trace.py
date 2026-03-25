from typing import Any

from pydantic import BaseModel, Field


class RetrievedDoc(BaseModel):
    doc_id: str
    content: str
    similarity_score: float | None = None


class SpanInput(BaseModel):
    """One execution step (retriever, llm, tool, …)."""

    span_type: str = Field(..., min_length=1, max_length=64)
    label: str | None = Field(None, max_length=255)
    duration_ms: int | None = Field(None, ge=0)
    status: str | None = Field(None, max_length=32)
    meta: dict[str, Any] | None = None


class SpanOut(BaseModel):
    position: int
    span_type: str
    label: str | None
    duration_ms: int | None
    status: str | None
    meta: dict[str, Any] | None = None


class TraceCreate(BaseModel):
    agent_name: str
    environment: str = "dev"
    prompt: str
    response: str
    model_name: str
    latency_ms: int = Field(ge=0)
    retrieved_docs: list[RetrievedDoc] = []
    spans: list[SpanInput] = []
    ingest_metadata: dict[str, Any] | None = None


class TraceCreateResponse(BaseModel):
    trace_id: str
    reliability_score: float
    hallucination_risk: float
    grounding_score: float
    status: str
    failure_type: str | None = None
    explanation: str | None = None


class TraceListItem(BaseModel):
    trace_id: str
    agent_name: str
    environment: str
    prompt: str
    model_name: str
    latency_ms: int
    status: str
    created_at: str
    reliability_score: float | None
    hallucination_risk: float | None

    model_config = {"from_attributes": False}


class TraceDetail(BaseModel):
    trace_id: str
    agent_name: str
    environment: str
    prompt: str
    response: str
    model_name: str
    latency_ms: int
    status: str
    created_at: str
    retrieved_docs: list[RetrievedDoc]
    spans: list[SpanOut]
    grounding_score: float | None
    hallucination_risk: float | None
    reliability_score: float | None
    failure_type: str | None
    explanation: str | None = None
    ingest_metadata: dict[str, Any] | None = None
