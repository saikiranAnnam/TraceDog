"""Integration tests: repositories + SQLite."""

import pytest

from app.repositories import trace_repository
from app.services.trace_service import ingest_trace
from tests.fixtures.sample_trace_payloads import trace_create_supported


@pytest.mark.integration
def test_trace_persists_after_ingest(db_session):
    out = ingest_trace(db_session, trace_create_supported())
    rows = trace_repository.list_traces(db_session, limit=10)
    assert len(rows) >= 1
    assert any(r.id == out.trace_id for r in rows)


@pytest.mark.integration
def test_reliability_row_linked(db_session):
    out = ingest_trace(db_session, trace_create_supported())
    t = trace_repository.get_trace_by_id(db_session, out.trace_id)
    assert t is not None
    assert t.reliability_result is not None
    assert t.reliability_result.trace_id == out.trace_id


@pytest.mark.integration
def test_lookup_by_id(db_session):
    out = ingest_trace(db_session, trace_create_supported())
    t = trace_repository.get_trace_by_id(db_session, out.trace_id)
    assert t.id == out.trace_id


@pytest.mark.integration
def test_list_ordering_newest_first(db_session):
    """Newest-first only holds if created_at differs; SQLite often shares one second."""
    from datetime import datetime, timezone

    from app.models.trace import Trace
    from app.schemas.trace import RetrievedDoc, TraceCreate

    first = ingest_trace(db_session, trace_create_supported())
    # Force older timestamp so ORDER BY created_at DESC is deterministic (no sleep flake).
    t1 = db_session.query(Trace).filter_by(id=first.trace_id).one()
    t1.created_at = datetime(2020, 1, 1, tzinfo=timezone.utc)
    db_session.commit()

    second = ingest_trace(
        db_session,
        TraceCreate(
            agent_name="support-bot",
            environment="dev",
            prompt="second prompt unique",
            response="second response seven days manager",
            model_name="gpt-4",
            latency_ms=1,
            retrieved_docs=[RetrievedDoc(doc_id="1", content="seven days manager")],
        ),
    )
    rows = trace_repository.list_traces(db_session, limit=5)
    assert rows[0].id == second.trace_id
    assert rows[1].id == first.trace_id
