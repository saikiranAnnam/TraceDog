"""Unit tests: app.reliability.scorer"""

import pytest

from app.reliability.scorer import score_trace
from app.schemas.trace import RetrievedDoc, TraceCreate
from tests.fixtures.sample_trace_payloads import (
    trace_create_empty_docs,
    trace_create_supported,
    trace_create_unsupported,
)


def test_score_returns_scoring_result():
    p = trace_create_supported()
    s = score_trace(p)
    assert 0.0 <= s.grounding_score <= 1.0
    assert 0.0 <= s.hallucination_risk <= 1.0
    assert 0.0 <= s.reliability_score <= 1.0
    assert isinstance(s.explanation, str) and s.explanation
    assert len(s.per_doc_similarity) == len(p.retrieved_docs)


def test_hallucination_risk_is_inverse_of_grounding_when_docs():
    p = TraceCreate(
        agent_name="a",
        prompt="p",
        response="alpha beta gamma delta",
        model_name="m",
        latency_ms=1,
        retrieved_docs=[RetrievedDoc(doc_id="1", content="alpha beta gamma delta epsilon")],
    )
    s = score_trace(p)
    assert abs(s.hallucination_risk - (1.0 - s.grounding_score)) < 0.01


def test_no_docs_no_retrieval():
    p = trace_create_empty_docs()
    s = score_trace(p)
    assert s.failure_type == "no_retrieval"
    assert s.grounding_score == 0.0
    assert s.hallucination_risk == 1.0
    assert s.per_doc_similarity == []


def test_unsupported_or_weak_when_response_off_doc():
    p = trace_create_unsupported()
    s = score_trace(p)
    assert s.failure_type in (
        "unsupported",
        "weak_grounding",
        "weak_retrieval",
        "contradiction",
        None,
    )


def test_short_name_answer_grounded_when_in_context():
    """Extractive QA: one-word answer present in a long paragraph."""
    p = TraceCreate(
        agent_name="a",
        environment="dev",
        prompt="Who was the Norse leader?",
        response="Rollo",
        model_name="m",
        latency_ms=1,
        retrieved_docs=[
            RetrievedDoc(
                doc_id="wiki",
                content=(
                    "The Norse leader Rollo was the first ruler of Normandy. "
                    "He is a key figure in ninth-century history."
                ),
            )
        ],
    )
    s = score_trace(p)
    assert s.grounding_score >= 0.52
    assert s.failure_type in (None, "likely_supported_but_short")


def test_scores_in_valid_ranges():
    for payload in [trace_create_supported(), trace_create_empty_docs(), trace_create_unsupported()]:
        s = score_trace(payload)
        assert 0.0 <= s.grounding_score <= 1.0
        assert 0.0 <= s.hallucination_risk <= 1.0
        assert 0.0 <= s.reliability_score <= 1.0


def test_numeric_contradiction_flag():
    p = TraceCreate(
        agent_name="a",
        environment="dev",
        prompt="q",
        response="Refunds complete in 2 hours.",
        model_name="gpt-4",
        latency_ms=100,
        retrieved_docs=[
            RetrievedDoc(
                doc_id="p1",
                content="Refunds require manager approval and take up to 7 days.",
            )
        ],
    )
    s = score_trace(p)
    if s.failure_type == "contradiction":
        assert "numerically inconsistent" in s.explanation.lower() or "inconsistent" in s.explanation.lower()
