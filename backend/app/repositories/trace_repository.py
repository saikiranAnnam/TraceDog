from sqlalchemy.orm import Session, joinedload

from app.models.trace import Trace


def get_trace_by_id(db: Session, trace_id: str) -> Trace | None:
    return (
        db.query(Trace)
        .options(
            joinedload(Trace.agent),
            joinedload(Trace.reliability_result),
            joinedload(Trace.retrieved_documents),
            joinedload(Trace.spans),
        )
        .filter(Trace.id == trace_id)
        .first()
    )


def list_traces(db: Session, skip: int = 0, limit: int = 100) -> list[Trace]:
    return (
        db.query(Trace)
        .options(
            joinedload(Trace.agent),
            joinedload(Trace.reliability_result),
        )
        .order_by(Trace.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
