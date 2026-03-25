"""POST traces to TraceDog HTTP API."""

from __future__ import annotations

from typing import Any

import requests


def submit_trace(
    tracedog_base_url: str,
    *,
    agent_name: str,
    environment: str,
    question: str,
    model_name: str,
    response_text: str,
    latency_ms: int,
    retrieved_docs: list[dict[str, str]],
    ingest_metadata: dict[str, Any] | None = None,
    timeout_s: int = 60,
) -> dict[str, Any]:
    base = tracedog_base_url.rstrip("/")
    payload: dict[str, Any] = {
        "agent_name": agent_name,
        "environment": environment,
        "prompt": question,
        "response": response_text,
        "model_name": model_name,
        "latency_ms": max(0, latency_ms),
        "retrieved_docs": retrieved_docs,
    }
    if ingest_metadata:
        payload["ingest_metadata"] = ingest_metadata

    r = requests.post(
        f"{base}/api/v1/traces",
        json=payload,
        timeout=timeout_s,
    )
    r.raise_for_status()
    return r.json()
