from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.trace import TraceCreate, TraceCreateResponse, TraceDetail, TraceListItem
from app.services import trace_service

router = APIRouter()


@router.post("", response_model=TraceCreateResponse)
def create_trace(payload: TraceCreate, db: Session = Depends(get_db)) -> TraceCreateResponse:
    return trace_service.ingest_trace(db, payload)


@router.get("", response_model=list[TraceListItem])
def list_traces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[TraceListItem]:
    return trace_service.list_traces_for_api(db, skip=skip, limit=limit)


@router.get("/{trace_id}", response_model=TraceDetail)
def get_trace(trace_id: str, db: Session = Depends(get_db)) -> TraceDetail:
    row = trace_service.get_trace_detail(db, trace_id)
    if not row:
        raise HTTPException(status_code=404, detail="Trace not found")
    return row
