"""Unit tests: answer-aware similarity (sentence + keyword hybrid)."""

from app.reliability.similarity import (
    compute_per_doc_breakdowns,
    hybrid_blend,
    is_short_answer,
    keyword_overlap_score,
    per_document_similarities,
)


def test_keyword_overlap_phrase_in_doc():
    assert keyword_overlap_score("France", "Normandy is a region in France.") == 1.0


def test_is_short_answer():
    assert is_short_answer("Rollo") is True
    long = (
        "Administrative boundaries shifted frequently throughout medieval European history."
    )
    assert is_short_answer(long) is False


def test_hybrid_prefers_keyword_when_short():
    assert hybrid_blend(0.1, 1.0, short_answer=True) > hybrid_blend(0.1, 1.0, short_answer=False)


def test_short_name_gets_strong_hybrid_against_long_paragraph():
    doc = (
        "The Viking leader Rollo received Normandy from the Frankish king. "
        "He established a lasting Norse presence in what became France."
    )
    sims = per_document_similarities("Rollo", [doc])
    assert sims[0] >= 0.52


def test_breakdown_exposes_components():
    doc = "The capital city is Paris. It is in France."
    b = compute_per_doc_breakdowns("Paris", [doc])
    assert len(b) == 1
    assert b[0].keyword == 1.0
    assert 0.0 <= b[0].hybrid <= 1.0
