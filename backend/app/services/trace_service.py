from sqlalchemy.orm import Session

from app.models.reliability_result import ReliabilityResult
from app.models.retrieved_document import RetrievedDocument
from app.models.trace import Trace
from app.models.trace_span import TraceSpan
from app.repositories import agent_repository, trace_repository
from app.reliability.scorer import score_trace
from app.schemas.trace import (
    SpanOut,
    TraceCreate,
    TraceCreateResponse,
    TraceDetail,
    TraceListItem,
)
from app.tracing.default_spans import build_default_spans
from app.utils.ids import new_trace_id


def _experiment_tag_from_metadata(meta: dict | None) -> str | None:
    if not meta:
        return None
    for key in ("title", "case_id", "experiment", "experiment_name", "dataset"):
        val = meta.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()[:160]
    return None


def ingest_trace(db: Session, payload: TraceCreate) -> TraceCreateResponse:
    agent = agent_repository.get_or_create_agent(
        db, payload.agent_name, payload.environment
    )
    tid = new_trace_id()
    scored = score_trace(payload)

    trace = Trace(
        id=tid,
        agent_id=agent.id,
        prompt=payload.prompt,
        response=payload.response,
        model_name=payload.model_name,
        latency_ms=payload.latency_ms,
        status="processed",
        ingest_metadata=payload.ingest_metadata,
    )
    db.add(trace)
    db.flush()

    for idx, doc in enumerate(payload.retrieved_docs):
        sim = (
            scored.per_doc_similarity[idx]
            if idx < len(scored.per_doc_similarity)
            else None
        )
        db.add(
            RetrievedDocument(
                trace_id=tid,
                position=idx,
                doc_id=doc.doc_id,
                content=doc.content,
                similarity_score=sim,
            )
        )

    if payload.spans:
        for idx, sp in enumerate(payload.spans):
            db.add(
                TraceSpan(
                    trace_id=tid,
                    position=idx,
                    span_type=sp.span_type,
                    label=sp.label,
                    duration_ms=sp.duration_ms,
                    status=sp.status,
                    meta=sp.meta,
                )
            )
    else:
        for idx, row in enumerate(
            build_default_spans(payload.latency_ms, bool(payload.retrieved_docs))
        ):
            db.add(
                TraceSpan(
                    trace_id=tid,
                    position=idx,
                    span_type=row["span_type"],
                    label=row.get("label"),
                    duration_ms=row.get("duration_ms"),
                    status=row.get("status"),
                    meta=row.get("meta"),
                )
            )

    db.add(
        ReliabilityResult(
            trace_id=tid,
            grounding_score=scored.grounding_score,
            hallucination_risk=scored.hallucination_risk,
            reliability_score=scored.reliability_score,
            failure_type=scored.failure_type,
            explanation=scored.explanation,
        )
    )
    db.commit()
    return TraceCreateResponse(
        trace_id=tid,
        reliability_score=scored.reliability_score,
        hallucination_risk=scored.hallucination_risk,
        grounding_score=scored.grounding_score,
        status="processed",
        failure_type=scored.failure_type,
        explanation=scored.explanation,
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
                grounding_score=rr.grounding_score if rr else None,
                failure_type=rr.failure_type if rr else None,
                experiment_tag=_experiment_tag_from_metadata(t.ingest_metadata),
            )
        )
    return out


def get_trace_detail(db: Session, trace_id: str) -> TraceDetail | None:
    t = trace_repository.get_trace_by_id(db, trace_id)
    if not t:
        return None
    rr = t.reliability_result
    from app.schemas.trace import RetrievedDoc

    retrieved = [
        RetrievedDoc(
            doc_id=d.doc_id,
            content=d.content,
            similarity_score=d.similarity_score,
        )
        for d in (t.retrieved_documents or [])
    ]
    span_rows = [
        SpanOut(
            position=s.position,
            span_type=s.span_type,
            label=s.label,
            duration_ms=s.duration_ms,
            status=s.status,
            meta=s.meta,
        )
        for s in (t.spans or [])
    ]
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
        spans=span_rows,
        grounding_score=rr.grounding_score if rr else None,
        hallucination_risk=rr.hallucination_risk if rr else None,
        reliability_score=rr.reliability_score if rr else None,
        failure_type=rr.failure_type if rr else None,
        explanation=rr.explanation if rr else None,
        ingest_metadata=t.ingest_metadata,
    )
