from pydantic import BaseModel, Field


class RetrievedDoc(BaseModel):
    doc_id: str
    content: str


class TraceCreate(BaseModel):
    agent_name: str
    environment: str = "dev"
    prompt: str
    response: str
    model_name: str
    latency_ms: int = Field(ge=0)
    retrieved_docs: list[RetrievedDoc] = []


class TraceCreateResponse(BaseModel):
    trace_id: str
    reliability_score: float
    hallucination_risk: float
    grounding_score: float
    status: str


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
    grounding_score: float | None
    hallucination_risk: float | None
    reliability_score: float | None
    failure_type: str | None
