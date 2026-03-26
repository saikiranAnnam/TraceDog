"""Map raw SQuAD v2 rows to a TraceDog-neutral eval case."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class EvalCase:
    case_id: str
    question: str
    retrieved_docs: list[dict[str, Any]]
    reference_answer: str | None
    is_answerable: bool
    title: str | None = None


def squad_row_to_eval_case(row: dict[str, Any]) -> EvalCase:
    answers = row.get("answers") or {}
    answer_texts = answers.get("text") or []
    if isinstance(answer_texts, list):
        ref = answer_texts[0] if answer_texts else None
    else:
        ref = None

    case_id = str(row["id"])
    title = row.get("title")

    return EvalCase(
        case_id=case_id,
        question=row["question"],
        retrieved_docs=[
            {
                "doc_id": f"squad-{case_id}",
                "content": row["context"],
                "source_name": title or "squad_context",
                "source_type": "squad_v2",
                "rank": 1,
                "score": 1.0,
                "metadata": {
                    "dataset": "squad_v2",
                    "title": title,
                },
            }
        ],
        reference_answer=ref,
        is_answerable=bool(answer_texts),
        title=title if isinstance(title, str) else None,
    )


def docs_for_tracedog_payload(docs: list[dict[str, Any]]) -> list[dict[str, str]]:
    """TraceDog API only requires doc_id + content on ingest."""
    out: list[dict[str, str]] = []
    for d in docs:
        out.append(
            {
                "doc_id": str(d["doc_id"]),
                "content": str(d["content"]),
            }
        )
    return out
