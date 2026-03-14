"""Unit tests: app.reliability.scorer"""

import pytest

from app.reliability.scorer import score_trace
from app.schemas.trace import RetrievedDoc, TraceCreate
from tests.fixtures.sample_trace_payloads import (
    trace_create_empty_docs,
    trace_create_supported,
    trace_create_unsupported,
)


def test_score_returns_four_tuple():
    p = trace_create_supported()
    g, h, r, f = score_trace(p)
    assert isinstance(g, float) and isinstance(h, float) and isinstance(r, float)
    assert f is None or isinstance(f, str)


def test_hallucination_risk_is_inverse_of_grounding():
    p = TraceCreate(
        agent_name="a",
        prompt="p",
        response="alpha beta gamma delta",
        model_name="m",
        latency_ms=1,
        retrieved_docs=[RetrievedDoc(doc_id="1", content="alpha beta gamma delta epsilon")],
    )
    g, h, _, _ = score_trace(p)
    assert abs(h - (1.0 - g)) < 0.0002  # rounding


def test_empty_docs_failure_flag_and_reliability():
    p = trace_create_empty_docs()
    g, h, r, f = score_trace(p)
    assert f == "no_retrieval_context"
    assert g == 0.35
    assert h == pytest.approx(0.65, rel=1e-3)


def test_low_grounding_with_docs_sets_possible_hallucination():
    p = trace_create_unsupported()
    g, _, _, f = score_trace(p)
    if g < 0.25:
        assert f == "possible_hallucination"


def test_scores_in_valid_ranges():
    for payload in [trace_create_supported(), trace_create_empty_docs(), trace_create_unsupported()]:
        g, h, r, f = score_trace(payload)
        assert 0.0 <= g <= 1.0
        assert 0.0 <= h <= 1.0
        assert 0.0 <= r <= 1.0
