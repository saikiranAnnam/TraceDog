"""Tests for ``evaluation.sources`` (no Hugging Face network for core cases)."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from evaluation.sources import HotpotQARowSource, SquadV2RowSource
from evaluation.sources.hf_revisions import HF_REVISION_HOTPOT_QA, HF_REVISION_SQUAD_V2


def test_hotpot_local_json_slice(tmp_path: Path) -> None:
    data = [{"id": str(i), "question": f"q{i}"} for i in range(5)]
    p = tmp_path / "dev.json"
    p.write_text(json.dumps(data), encoding="utf-8")
    src = HotpotQARowSource(json_path=p)
    assert src.describe().provider == "local_json_array"
    assert src.fetch_rows(1, 2) == data[1:3]
    assert src.fetch_rows(10, 5) == []


def test_hotpot_hf_describe_has_revision() -> None:
    d = HotpotQARowSource(split="validation").describe()
    assert d.provider == "huggingface_datasets"
    assert d.revision == HF_REVISION_HOTPOT_QA


def test_hotpot_local_not_array(tmp_path: Path) -> None:
    p = tmp_path / "bad.json"
    p.write_text('{"not": "array"}', encoding="utf-8")
    src = HotpotQARowSource(json_path=p)
    with pytest.raises(ValueError, match="JSON array"):
        src.fetch_rows(0, 1)


def test_squad_describe() -> None:
    d = SquadV2RowSource(split="validation").describe()
    assert d.provider == "huggingface_datasets"
    assert d.dataset_ref == "squad_v2"
    assert d.split == "validation"
    assert d.dataset_id == "squad_v2"
    assert d.dataset_version == "1.0"
    assert d.revision == HF_REVISION_SQUAD_V2


@patch("datasets.load_dataset")
def test_squad_fetch_rows_slice(mock_load: MagicMock) -> None:
    rows_store = [{"id": f"e{i}"} for i in range(10)]

    class FakeDs:
        def __len__(self) -> int:
            return len(rows_store)

        def __getitem__(self, i: int) -> dict:
            return rows_store[i]

    mock_load.return_value = FakeDs()
    src = SquadV2RowSource(split="validation")
    assert src.fetch_rows(7, 5) == rows_store[7:12]
    assert src.fetch_rows(10, 3) == []
