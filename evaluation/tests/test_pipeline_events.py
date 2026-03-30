"""Structured pipeline event emission."""

from __future__ import annotations

import json
from pathlib import Path

from evaluation.sources.pipeline_events import (
    build_source_fetch_complete_event,
    emit_pipeline_event,
)


def test_emit_pipeline_event_jsonl_sink(tmp_path: Path, monkeypatch) -> None:
    out = tmp_path / "events.jsonl"
    monkeypatch.setenv("TRACE_EVAL_PIPELINE_EVENTS_JSONL", str(out))
    emit_pipeline_event({"event_type": "test", "run_id": "abc", "dataset_id": "x"})
    lines = out.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    payload = json.loads(lines[0])
    assert payload["event_type"] == "test"
    assert payload["run_id"] == "abc"
    assert payload["schema"] == "trace_eval_pipeline_event_v1"
    assert "timestamp_utc" in payload


def test_build_source_fetch_complete_roundtrip() -> None:
    ev = build_source_fetch_complete_event(
        run_id="r1",
        dataset_id="squad_v2",
        cache_hit=True,
        fetch_ms=12.3456,
        rows_loaded=5,
        rows_quarantined=1,
        fetch_attempts=2,
        load_mode="live_fetch",
        offset=0,
        limit=10,
        source_descriptor={"dataset_id": "squad_v2", "revision": "deadbeef"},
    )
    assert ev["cache_hit"] is True
    assert ev["fetch_ms"] == 12.346
    assert ev["rows_quarantined"] == 1
    assert ev["load_mode"] == "live_fetch"


def test_emit_without_sink_no_crash(monkeypatch) -> None:
    monkeypatch.delenv("TRACE_EVAL_PIPELINE_EVENTS_JSONL", raising=False)
    monkeypatch.delenv("TRACE_EVAL_PIPELINE_EVENTS_STDERR", raising=False)
    emit_pipeline_event({"event_type": "noop", "run_id": "r", "dataset_id": "d"})
