"""Registry, pipeline validation, canonical descriptor helpers."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

from evaluation.sources.cache import slice_cache_key
from evaluation.sources.canonical import (
    CANONICAL_SCHEMA_VERSION,
    descriptor_from_materialized_jsonl,
    normalize_raw_row,
)
from evaluation.sources.pipeline import fetch_rows_pipeline
from evaluation.sources.registry import (
    SOURCE_REGISTRY,
    build_registered_source,
    list_registry_entries,
)
from evaluation.sources.squad_v2 import SquadV2RowSource


def test_registry_sorted_ids() -> None:
    ids = [e.source_id for e in list_registry_entries()]
    assert ids == sorted(ids)
    assert "squad_v2" in SOURCE_REGISTRY
    assert "hotpot_qa_fullwiki" in SOURCE_REGISTRY


def test_build_squad_from_registry() -> None:
    src = build_registered_source("squad_v2", split="validation")
    assert isinstance(src, SquadV2RowSource)


def test_pipeline_quarantines_bad_squad_rows() -> None:
    base = SquadV2RowSource(split="validation").describe()
    src = MagicMock()
    src.describe.return_value = base
    src.fetch_rows.return_value = [
        {"id": "ok", "question": "q", "context": "c"},
        {"id": "x", "question": "no context key"},
    ]
    fr = fetch_rows_pipeline(
        src,
        registry_id="squad_v2",
        offset=0,
        limit=10,
        use_cache=False,
        max_retries=1,
        validate_rows=True,
        on_validation_error="skip",
    )
    assert len(fr.rows) == 1
    assert fr.stats.rows_quarantined == 1
    assert fr.descriptor.slice_spec == "offset_0_limit_10"
    assert fr.descriptor.source_hash


def test_slice_cache_key_stable() -> None:
    d = SquadV2RowSource().describe()
    assert slice_cache_key(d, 0, 100) == slice_cache_key(d, 0, 100)
    assert slice_cache_key(d, 0, 100) != slice_cache_key(d, 1, 100)


def test_normalize_squad_raw() -> None:
    row = {
        "id": "s1",
        "question": "Q?",
        "context": "The sky is blue.",
        "title": "Wiki",
        "answers": {"text": ["blue", "azure"], "answer_start": [16, 0]},
    }
    c = normalize_raw_row(
        "squad_v2",
        row,
        dataset_version="1.0",
        split="validation",
    )
    assert c.row_id == "s1"
    assert c.input["question"] == "Q?"
    assert c.reference["answer"] == "blue"
    assert c.raw["id"] == "s1"


def test_descriptor_from_materialized_jsonl(tmp_path: Path) -> None:
    row = normalize_raw_row(
        "squad_v2",
        {
            "id": "m1",
            "question": "q",
            "context": "ctx",
            "answers": {"text": [], "answer_start": []},
        },
        dataset_version="1.0",
        split="validation",
    )
    p = tmp_path / "m.jsonl"
    p.write_text(json.dumps(row.to_json_dict()) + "\n", encoding="utf-8")
    desc = descriptor_from_materialized_jsonl(p)
    assert desc.provider == "materialized_jsonl"
    assert desc.dataset_id == "squad_v2"
    assert desc.schema_version == CANONICAL_SCHEMA_VERSION
