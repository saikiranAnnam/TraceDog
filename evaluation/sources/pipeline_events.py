"""Structured pipeline events for logs, JSONL sinks, and future metrics exporters."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EVENT_SCHEMA_V1 = "trace_eval_pipeline_event_v1"


def emit_pipeline_event(event: dict[str, Any]) -> None:
    """
    Append one JSON object per call when ``TRACE_EVAL_PIPELINE_EVENTS_JSONL`` is set
    (JSONL file path). Optionally mirror to stderr when
    ``TRACE_EVAL_PIPELINE_EVENTS_STDERR`` is ``1``/``true``/``yes``.
    """
    payload = dict(event)
    payload.setdefault("schema", EVENT_SCHEMA_V1)
    payload.setdefault("timestamp_utc", datetime.now(timezone.utc).isoformat())
    line = json.dumps(payload, default=str, separators=(",", ":")) + "\n"

    path = os.environ.get("TRACE_EVAL_PIPELINE_EVENTS_JSONL")
    if path:
        p = Path(path).expanduser()
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as f:
            f.write(line)

    if os.environ.get("TRACE_EVAL_PIPELINE_EVENTS_STDERR", "").lower() in (
        "1",
        "true",
        "yes",
    ):
        print(line.strip(), file=sys.stderr)


def build_source_fetch_complete_event(
    *,
    run_id: str,
    dataset_id: str,
    cache_hit: bool,
    fetch_ms: float,
    rows_loaded: int,
    rows_quarantined: int,
    fetch_attempts: int,
    normalization_failures: int = 0,
    materialization_ms: float = 0.0,
    source_descriptor: dict[str, Any] | None = None,
    offset: int | None = None,
    limit: int | None = None,
    load_mode: str | None = None,
) -> dict[str, Any]:
    """Payload for ``event_type=source_fetch_complete`` (v1)."""
    ev: dict[str, Any] = {
        "event_type": "source_fetch_complete",
        "run_id": run_id,
        "dataset_id": dataset_id,
        "cache_hit": cache_hit,
        "fetch_ms": round(fetch_ms, 3),
        "rows_loaded": rows_loaded,
        "rows_quarantined": rows_quarantined,
        "fetch_attempts": fetch_attempts,
        "normalization_failures": normalization_failures,
        "materialization_ms": round(materialization_ms, 3),
    }
    if offset is not None:
        ev["offset"] = offset
    if limit is not None:
        ev["limit"] = limit
    if load_mode is not None:
        ev["load_mode"] = load_mode
    if source_descriptor is not None:
        ev["source_descriptor"] = source_descriptor
    return ev
