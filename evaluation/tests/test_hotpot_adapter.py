"""Tests for HotpotQA → TraceDog adapter (no network)."""

from __future__ import annotations

from evaluation.runners.adapters.hotpot_adapter import hotpot_row_to_eval_case


def test_list_style_context_and_supporting_facts() -> None:
    row = {
        "_id": "x1",
        "question": "Which magazine was started first?",
        "answer": "Arthur's Magazine",
        "context": [
            ["Arthur's Magazine", ["First sentence.", "Second."]],
            ["First for Women", ["Only sentence here."]],
        ],
        "supporting_facts": [
            ["Arthur's Magazine", 0],
            ["First for Women", 0],
        ],
    }
    case = hotpot_row_to_eval_case(row)
    assert case.case_id == "x1"
    assert len(case.retrieved_docs) == 3
    assert {d["doc_id"] for d in case.retrieved_docs} == {"hotpot-0-0", "hotpot-0-1", "hotpot-1-0"}
    assert set(case.gold_supporting_doc_ids) == {"hotpot-0-0", "hotpot-1-0"}


def test_hf_style_context() -> None:
    row = {
        "id": "hf1",
        "question": "Q",
        "answer": "A",
        "context": {
            "title": ["Foo Article", "Bar Article"],
            "sentences": [["s0", "s1"], ["t0"]],
        },
        "supporting_facts": {"title": ["Foo Article"], "sent_id": [1]},
    }
    case = hotpot_row_to_eval_case(row)
    assert case.gold_supporting_doc_ids == ["hotpot-0-1"]


def test_substring_title_match_ed_wood_film() -> None:
    """Gold title 'Ed Wood' should match paragraph title 'Ed Wood (film)'."""
    row = {
        "id": "m1",
        "question": "Q",
        "answer": "A",
        "context": {
            "title": ["Other", "Ed Wood (film)"],
            "sentences": [["x"], ["y"]],
        },
        "supporting_facts": {"title": ["Ed Wood"], "sent_id": [0]},
    }
    case = hotpot_row_to_eval_case(row)
    assert case.gold_supporting_doc_ids == ["hotpot-1-0"]
