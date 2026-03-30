"""SQuAD v2 rows via Hugging Face ``datasets`` (cached under HF cache / env)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from evaluation.sources.hf_revisions import HF_REVISION_SQUAD_V2
from evaluation.sources.types import SourceDescriptor

Split = Literal["train", "validation"]


@dataclass
class SquadV2RowSource:
    """
    Fetch SQuAD 2.0 examples for ``evaluation.runners.adapters.squad_adapter``.

    Rows match HF ``squad_v2`` schema: ``id``, ``question``, ``context``, ``answers``, ``title``.
    """

    split: Split = "validation"
    dataset_id: str = "squad_v2"
    revision: str | None = HF_REVISION_SQUAD_V2

    def describe(self) -> SourceDescriptor:
        return SourceDescriptor(
            provider="huggingface_datasets",
            dataset_ref=self.dataset_id,
            split=self.split,
            config_name=None,
            notes="Uses datasets.load_dataset; first run may download.",
            dataset_id="squad_v2",
            dataset_version="1.0",
            revision=self.revision,
            schema_version="squad_hf_v2",
        )

    def fetch_rows(self, offset: int, limit: int) -> list[dict[str, Any]]:
        from datasets import load_dataset

        kwargs: dict[str, Any] = {}
        if self.revision:
            kwargs["revision"] = self.revision
        ds = load_dataset(self.dataset_id, split=self.split, **kwargs)
        n = len(ds)
        end = min(offset + limit, n)
        if offset >= n:
            return []
        return [ds[i] for i in range(offset, end)]
