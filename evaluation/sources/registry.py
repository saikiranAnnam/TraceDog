"""Discoverable dataset registry — ids, splits, tags, builders."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Literal

from evaluation.sources.hf_revisions import HF_REVISION_HOTPOT_QA, HF_REVISION_SQUAD_V2
from evaluation.sources.hotpot_qa import HotpotQARowSource
from evaluation.sources.squad_v2 import SquadV2RowSource

SourceBuilder = Callable[..., Any]


@dataclass(frozen=True)
class DatasetRegistryEntry:
    """Static catalog entry for scheduling, APIs, and generic runners."""

    source_id: str
    title: str
    description: str
    source_type: Literal["huggingface", "local_json_array", "local_csv", "composite"]
    supported_splits: tuple[str, ...]
    raw_schema_version: str
    tags: frozenset[str]
    build: SourceBuilder
    huggingface_dataset_name: str | None = None
    huggingface_config_name: str | None = None
    huggingface_revision: str | None = None


def _build_squad(split: str = "validation", **_: Any) -> SquadV2RowSource:
    return SquadV2RowSource(split=split)  # type: ignore[arg-type]


def _build_hotpot(
    split: str = "validation",
    json_path: Path | None = None,
    **_: Any,
) -> HotpotQARowSource:
    return HotpotQARowSource(split=split, json_path=json_path)  # type: ignore[arg-type]


SOURCE_REGISTRY: dict[str, DatasetRegistryEntry] = {
    "squad_v2": DatasetRegistryEntry(
        source_id="squad_v2",
        title="SQuAD 2.0",
        description="Stanford reading comprehension (unanswerable questions included).",
        source_type="huggingface",
        supported_splits=("train", "validation"),
        raw_schema_version="squad_hf_v2",
        tags=frozenset({"public", "single_hop", "mrc", "rag", "factuality"}),
        build=_build_squad,
        huggingface_dataset_name="squad_v2",
        huggingface_config_name=None,
        huggingface_revision=HF_REVISION_SQUAD_V2,
    ),
    "hotpot_qa_fullwiki": DatasetRegistryEntry(
        source_id="hotpot_qa_fullwiki",
        title="HotpotQA (fullwiki)",
        description="Multi-hop QA; HF hotpot_qa/fullwiki or official JSON array file.",
        source_type="huggingface",
        supported_splits=("train", "validation", "test"),
        raw_schema_version="hotpot_official_v1",
        tags=frozenset({"public", "multi_hop", "rag", "factuality", "mrc"}),
        build=_build_hotpot,
        huggingface_dataset_name="hotpot_qa",
        huggingface_config_name="fullwiki",
        huggingface_revision=HF_REVISION_HOTPOT_QA,
    ),
}


def get_registry_entry(source_id: str) -> DatasetRegistryEntry:
    if source_id not in SOURCE_REGISTRY:
        keys = ", ".join(sorted(SOURCE_REGISTRY))
        raise KeyError(f"Unknown dataset source_id={source_id!r}. Registered: {keys}")
    return SOURCE_REGISTRY[source_id]


def build_registered_source(source_id: str, **kwargs: Any) -> Any:
    """Instantiate a source by registry id (pass ``split``, ``json_path``, etc.)."""
    return get_registry_entry(source_id).build(**kwargs)


def list_registry_entries() -> list[DatasetRegistryEntry]:
    return [SOURCE_REGISTRY[k] for k in sorted(SOURCE_REGISTRY.keys())]
