"""Shared types for evaluation row sources (production-style contracts)."""

from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any, Literal, Protocol, runtime_checkable


Provider = Literal[
    "huggingface_datasets",
    "local_json_array",
    "local_csv",
    "internal",
    "materialized_jsonl",
]


@dataclass(frozen=True)
class SourceDescriptor:
    """
    Provenance for telemetry, cache keys, materialization headers, and audit.

    Extend over time; optional fields keep older call sites valid.
    """

    provider: Provider
    """Where rows are loaded from."""

    dataset_ref: str
    """HF id (e.g. squad_v2), filesystem path, or materialized JSONL path."""

    split: str | None = None
    """HF split, ``json_file`` for local array, or ``materialized`` when loading JSONL."""

    config_name: str | None = None
    """HF config (e.g. fullwiki for hotpot_qa)."""

    notes: str = ""
    """Optional human note (cache policy, pin, etc.)."""

    dataset_id: str = ""
    """Stable registry id (e.g. ``squad_v2``, ``hotpot_qa_fullwiki``)."""

    dataset_version: str = ""
    """Logical release / pin (HF revision, file fingerprint label, etc.)."""

    revision: str | None = None
    """HF hub revision when pinned; else None for “floating” HEAD."""

    schema_version: str = "raw_hf_v1"
    """Native row schema tag before canonical normalization."""

    slice_spec: str | None = None
    """Deterministic slice label e.g. ``offset_0_limit_500``."""

    source_hash: str | None = None
    """Short hash over the fetched row set (slice-level reproducibility)."""


def with_slice_and_hash(
    desc: SourceDescriptor,
    *,
    offset: int,
    limit: int,
    source_hash: str | None,
) -> SourceDescriptor:
    """Return a copy with ``slice_spec`` and optional ``source_hash`` set."""
    return replace(
        desc,
        slice_spec=f"offset_{offset}_limit_{limit}",
        source_hash=source_hash,
    )


@runtime_checkable
class EvalRowSource(Protocol):
    """
    Boundary for fetching **native** dataset rows (``dict``).

    Use :func:`evaluation.sources.pipeline.fetch_rows_pipeline` for retries,
    validation stats, cache, and descriptor enrichment.
    """

    def fetch_rows(self, offset: int, limit: int) -> list[dict[str, Any]]:
        """Return up to ``limit`` rows starting at ``offset`` (stable ordering)."""

    def describe(self) -> SourceDescriptor:
        """Base metadata before slice/hash enrichment."""
