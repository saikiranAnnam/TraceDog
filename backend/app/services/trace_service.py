from sqlalchemy.orm import Session

from app.models.reliability_result import ReliabilityResult
from app.models.trace import Trace
from app.repositories import agent_repository, trace_repository
from app.reliability.scorer import score_trace
from app.schemas.trace import (
    TraceCreate,
    TraceCreateResponse,
    TraceDetail,
    TraceListItem,
)
from app.utils.ids import new_trace_id


def ingest_trace(db: Session, payload: TraceCreate) -> TraceCreateResponse:
    agent = agent_repository.get_or_create_agent(
        db, payload.agent_name, payload.environment
    )
    tid = new_trace_id()
    grounding, hallucination_risk, reliability, failure = score_trace(payload)

    trace = Trace(
        id=tid,
        agent_id=agent.id,
        prompt=payload.prompt,
        response=payload.response,
        model_name=payload.model_name,
        latency_ms=payload.latency_ms,
        status="processed",
        retrieved_docs=[d.model_dump() for d in payload.retrieved_docs] or None,
    )
    db.add(trace)
    db.flush()
    db.add(
        ReliabilityResult(
            trace_id=tid,
            grounding_score=grounding,
            hallucination_risk=hallucination_risk,
            reliability_score=reliability,
            failure_type=failure,
        )
    )
    db.commit()
    return TraceCreateResponse(
        trace_id=tid,
        reliability_score=reliability,
        hallucination_risk=hallucination_risk,
        grounding_score=grounding,
        status="processed",
    )


def list_traces_for_api(db: Session, skip: int = 0, limit: int = 100) -> list[TraceListItem]:
    rows = trace_repository.list_traces(db, skip=skip, limit=limit)
    out: list[TraceListItem] = []
    for t in rows:
        rr = t.reliability_result
        out.append(
            TraceListItem(
                trace_id=t.id,
                agent_name=t.agent.name,
                environment=t.agent.environment,
                prompt=t.prompt[:200] + ("…" if len(t.prompt) > 200 else ""),
                model_name=t.model_name,
                latency_ms=t.latency_ms,
                status=t.status,
                created_at=t.created_at.isoformat() if t.created_at else "",
                reliability_score=rr.reliability_score if rr else None,
                hallucination_risk=rr.hallucination_risk if rr else None,
            )
        )
    return out


def get_trace_detail(db: Session, trace_id: str) -> TraceDetail | None:
    t = trace_repository.get_trace_by_id(db, trace_id)
    if not t:
        return None
    rr = t.reliability_result
    from app.schemas.trace import RetrievedDoc

    docs = t.retrieved_docs or []
    retrieved = [RetrievedDoc(doc_id=d.get("doc_id", ""), content=d.get("content", "")) for d in docs]
    return TraceDetail(
        trace_id=t.id,
        agent_name=t.agent.name,
        environment=t.agent.environment,
        prompt=t.prompt,
        response=t.response,
        model_name=t.model_name,
        latency_ms=t.latency_ms,
        status=t.status,
        created_at=t.created_at.isoformat() if t.created_at else "",
        retrieved_docs=retrieved,
        grounding_score=rr.grounding_score if rr else None,
        hallucination_risk=rr.hallucination_risk if rr else None,
        reliability_score=rr.reliability_score if rr else None,
        failure_type=rr.failure_type if rr else None,
    )
