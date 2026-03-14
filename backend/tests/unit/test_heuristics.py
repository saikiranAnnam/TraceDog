"""Unit tests: app.reliability.heuristics"""

import pytest

from app.reliability.heuristics import grounding_from_docs


def test_empty_response_returns_zero():
    assert grounding_from_docs("", []) == 0.0
    assert grounding_from_docs("   ", ["foo"]) == 0.0


def test_empty_docs_returns_fixed_baseline():
    g = grounding_from_docs("hello world here", [])
    assert g == 0.35


def test_high_overlap_higher_grounding():
    docs = ["refund policy seven days manager approval"]
    low = grounding_from_docs("completely unrelated xyz abc", docs)
    high = grounding_from_docs("refund seven days manager approval", docs)
    assert high > low
    assert 0.0 <= high <= 1.0


def test_all_words_in_docs_gives_one():
    g = grounding_from_docs("alpha beta gamma", ["alpha beta gamma delta"])
    assert g == 1.0


def test_no_words_longer_than_two_returns_half():
    assert grounding_from_docs("a b c d", ["a b c"]) == 0.5


def test_numeric_range_always_zero_to_one():
    for response, docs in [
        ("one two three", ["one"]),
        ("x" * 100, ["nothing"]),
        ("refund seven days", ["refund seven days policy"]),
    ]:
        g = grounding_from_docs(response, docs if isinstance(docs, list) else [docs])
        assert 0.0 <= g <= 1.0
