"""HotpotQA rows: Hugging Face ``hotpot_qa`` / ``fullwiki`` or a local JSON array file."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from evaluation.sources.hf_revisions import HF_REVISION_HOTPOT_QA
from evaluation.sources.types import SourceDescriptor

Split = Literal["train", "validation", "test"]


@dataclass
class HotpotQARowSource:
    """
    Fetch HotpotQA examples for ``evaluation.runners.adapters.hotpot_adapter``.

    **Remote:** ``datasets.load_dataset("hotpot_qa", "fullwiki", split=...)``.

    **Local:** JSON file must be a top-level array of example objects (official dev dump format).
    """

    split: Split = "validation"
    json_path: Path | None = None
    dataset_id: str = "hotpot_qa"
    config_name: str = "fullwiki"
    revision: str | None = HF_REVISION_HOTPOT_QA

    def describe(self) -> SourceDescriptor:
        registry_id = "hotpot_qa_fullwiki"
        if self.json_path is not None:
            st = self.json_path.stat()
            ver = f"local_json:mtime_ns={st.st_mtime_ns};size={st.st_size}"
            return SourceDescriptor(
                provider="local_json_array",
                dataset_ref=str(self.json_path.resolve()),
                split=None,
                config_name=None,
                notes="Official-style Hotpot array JSON",
                dataset_id=registry_id,
                dataset_version=ver,
                revision=None,
                schema_version="hotpot_official_v1",
            )
        return SourceDescriptor(
            provider="huggingface_datasets",
            dataset_ref=self.dataset_id,
            split=self.split,
            config_name=self.config_name,
            notes="Uses datasets.load_dataset; first run may download.",
            dataset_id=registry_id,
            dataset_version="fullwiki_1.0",
            revision=self.revision,
            schema_version="hotpot_hf_v1",
        )

    def fetch_rows(self, offset: int, limit: int) -> list[dict[str, Any]]:
        if self.json_path is not None:
            return self._from_json_file(offset, limit)
        return self._from_huggingface(offset, limit)

    def _from_json_file(self, offset: int, limit: int) -> list[dict[str, Any]]:
        raw = json.loads(self.json_path.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError(f"Expected a JSON array in {self.json_path}")
        end = min(offset + limit, len(raw))
        if offset >= len(raw):
            return []
        return [raw[i] for i in range(offset, end)]

    def _from_huggingface(self, offset: int, limit: int) -> list[dict[str, Any]]:
        from datasets import load_dataset

        kwargs: dict[str, Any] = {}
        if self.revision:
            kwargs["revision"] = self.revision
        ds = load_dataset(
            self.dataset_id, self.config_name, split=self.split, **kwargs
        )
        n = len(ds)
        end = min(offset + limit, n)
        if offset >= n:
            return []
        cols = ds.column_names
        return [{c: ds[i][c] for c in cols} for i in range(offset, end)]
