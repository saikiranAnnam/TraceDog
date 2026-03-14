"""Unit tests: app.services.trace_service (real DB session, SQLite)."""

import pytest

from app.models.agent import Agent
from app.models.reliability_result import ReliabilityResult
from app.models.trace import Trace
from app.services.trace_service import (
    get_trace_detail,
    ingest_trace,
    list_traces_for_api,
)
from tests.fixtures.sample_trace_payloads import (
    SUPPORTED_RESPONSE,
    trace_create_supported,
)


def test_ingest_stores_trace_and_reliability(db_session):
    p = trace_create_supported()
    out = ingest_trace(db_session, p)

    assert out.trace_id
    assert out.status == "processed"
    assert out.grounding_score is not None

    t = db_session.query(Trace).filter_by(id=out.trace_id).one()
    assert t.prompt == p.prompt
    assert t.response == p.response

    rr = db_session.query(ReliabilityResult).filter_by(trace_id=out.trace_id).one()
    assert rr.grounding_score == out.grounding_score
    assert rr.reliability_score == out.reliability_score


def test_agent_reused_same_name_env(db_session):
    ingest_trace(db_session, trace_create_supported())
    ingest_trace(db_session, trace_create_supported())
    agents = db_session.query(Agent).filter_by(name="support-bot", environment="dev").all()
    assert len(agents) == 1


def test_list_traces_shape(db_session):
    ingest_trace(db_session, trace_create_supported())
    rows = list_traces_for_api(db_session)
    assert len(rows) >= 1
    assert rows[0].trace_id
    assert rows[0].agent_name == "support-bot"
    assert rows[0].reliability_score is not None


def test_get_detail_by_id(db_session):
    out = ingest_trace(db_session, trace_create_supported())
    d = get_trace_detail(db_session, out.trace_id)
    assert d is not None
    assert d.trace_id == out.trace_id
    assert d.prompt == SUPPORTED_RESPONSE["prompt"]
    assert d.response == SUPPORTED_RESPONSE["response"]
    assert len(d.retrieved_docs) >= 1


def test_get_detail_unknown_returns_none(db_session):
    assert get_trace_detail(db_session, "00000000-0000-0000-0000-000000000000") is None
