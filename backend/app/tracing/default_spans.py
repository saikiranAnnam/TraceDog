"""Synthetic execution spans when the client does not send explicit spans."""

from __future__ import annotations

from typing import Any


def build_default_spans(latency_ms: int, has_retrieval: bool) -> list[dict[str, Any]]:
    """
    Minimal pipeline: optional retriever, then llm.
    Durations partition latency_ms (rough heuristic for v1 UI only).
    """
    total = max(1, latency_ms)
    if has_retrieval:
        retriever_ms = min(total - 1, max(1, total // 4))
        llm_ms = max(1, total - retriever_ms)
        return [
            {
                "span_type": "retriever",
                "label": "Retrieve context",
                "duration_ms": retriever_ms,
                "status": "ok",
                "meta": None,
            },
            {
                "span_type": "llm",
                "label": "LLM",
                "duration_ms": llm_ms,
                "status": "ok",
                "meta": None,
            },
        ]
    return [
        {
            "span_type": "llm",
            "label": "LLM",
            "duration_ms": total,
            "status": "ok",
            "meta": None,
        },
    ]
