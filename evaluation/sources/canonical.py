"""Canonical evaluation row model (stable contract for storage, analytics, materialization)."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterator

from evaluation.sources.types import SourceDescriptor

CANONICAL_SCHEMA_VERSION = "canonical_v1"


def descriptor_from_materialized_jsonl(path: str | Path) -> SourceDescriptor:
    """Build a :class:`SourceDescriptor` from the first row of a materialized JSONL file."""
    import json

    p = Path(path)
    first: dict[str, Any] | None = None
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                first = json.loads(line)
                break
    if not first:
        raise ValueError(f"Empty or invalid materialized file: {p}")
    return SourceDescriptor(
        provider="materialized_jsonl",
        dataset_ref=str(p.resolve()),
        split=first.get("split"),
        config_name=None,
        notes="Canonical JSONL produced by evaluation.sources.materialize",
        dataset_id=str(first.get("dataset_name", "")),
        dataset_version=str(first.get("dataset_version", "")),
        revision=None,
        schema_version=str(
            first.get("canonical_schema_version", CANONICAL_SCHEMA_VERSION)
        ),
    )


@dataclass
class CanonicalEvalRow:
    """
    Normalized row independent of Hugging Face quirks.

    ``raw`` always holds the native dict so existing adapters can run unchanged.
    """

    row_id: str
    dataset_name: str
    dataset_version: str
    split: str | None
    input: dict[str, Any]
    reference: dict[str, Any]
    task_type: str
    difficulty: str | None
    tags: list[str]
    raw: dict[str, Any]
    canonical_schema_version: str = CANONICAL_SCHEMA_VERSION
    provenance: dict[str, Any] | None = None

    def to_json_dict(self) -> dict[str, Any]:
        d = asdict(self)
        return d

    @classmethod
    def from_json_dict(cls, d: dict[str, Any]) -> CanonicalEvalRow:
        return cls(
            row_id=d["row_id"],
            dataset_name=d["dataset_name"],
            dataset_version=d["dataset_version"],
            split=d.get("split"),
            input=dict(d.get("input") or {}),
            reference=dict(d.get("reference") or {}),
            task_type=d.get("task_type") or "qa",
            difficulty=d.get("difficulty"),
            tags=list(d.get("tags") or []),
            raw=dict(d.get("raw") or {}),
            canonical_schema_version=d.get("canonical_schema_version") or CANONICAL_SCHEMA_VERSION,
            provenance=dict(d["provenance"]) if d.get("provenance") else None,
        )


def normalize_squad_v2_raw(
    row: dict[str, Any],
    *,
    registry_id: str,
    dataset_version: str,
    split: str | None,
    entry_tags: frozenset[str],
) -> CanonicalEvalRow:
    answers = row.get("answers") or {}
    texts = answers.get("text") if isinstance(answers, dict) else None
    aliases: list[str] = []
    if isinstance(texts, list):
        aliases = [str(t) for t in texts]
    primary = aliases[0] if aliases else None
    title = row.get("title")
    meta: dict[str, Any] = {}
    if isinstance(title, str):
        meta["title"] = title

    return CanonicalEvalRow(
        row_id=str(row.get("id", "")),
        dataset_name=registry_id,
        dataset_version=dataset_version,
        split=split,
        input={
            "question": row.get("question"),
            "context": row.get("context"),
            "metadata": meta,
        },
        reference={
            "answer": primary,
            "aliases": aliases,
            "supporting_facts": [],
        },
        task_type="qa",
        difficulty=None,
        tags=sorted(t for t in entry_tags if t != "public"),
        raw=dict(row),
        provenance=None,
    )


def normalize_hotpot_raw(
    row: dict[str, Any],
    *,
    registry_id: str,
    dataset_version: str,
    split: str | None,
    entry_tags: frozenset[str],
) -> CanonicalEvalRow:
    rid = row.get("_id") or row.get("id")
    sup = row.get("supporting_facts")
    return CanonicalEvalRow(
        row_id=str(rid or ""),
        dataset_name=registry_id,
        dataset_version=dataset_version,
        split=split,
        input={
            "question": row.get("question"),
            "context": row.get("context"),
            "metadata": {
                "question_type": row.get("type") or row.get("question_type"),
                "level": row.get("level"),
            },
        },
        reference={
            "answer": row.get("answer"),
            "aliases": [],
            "supporting_facts": sup if isinstance(sup, (list, dict)) else [],
        },
        task_type="qa",
        difficulty=str(row.get("level")) if row.get("level") is not None else None,
        tags=sorted(t for t in entry_tags if t != "public"),
        raw=dict(row),
        provenance=None,
    )


NORMALIZER_BY_REGISTRY_ID: dict[str, Any] = {
    "squad_v2": normalize_squad_v2_raw,
    "hotpot_qa_fullwiki": normalize_hotpot_raw,
}


def normalize_raw_row(
    registry_id: str,
    row: dict[str, Any],
    *,
    dataset_version: str,
    split: str | None,
) -> CanonicalEvalRow:
    from evaluation.sources.registry import get_registry_entry

    entry = get_registry_entry(registry_id)
    fn = NORMALIZER_BY_REGISTRY_ID.get(registry_id)
    if fn is None:
        raise ValueError(f"No normalizer registered for {registry_id!r}")
    return fn(
        row,
        registry_id=registry_id,
        dataset_version=dataset_version,
        split=split,
        entry_tags=entry.tags,
    )


def iter_materialized_jsonl(path: str | Path) -> Iterator[CanonicalEvalRow]:
    """Yield :class:`CanonicalEvalRow` from a JSONL file (one JSON object per line)."""
    import json

    p = Path(path)
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield CanonicalEvalRow.from_json_dict(json.loads(line))


def load_materialized_rows(path: str | Path) -> list[dict[str, Any]]:
    """Return native ``raw`` dicts for adapter compatibility."""
    return [r.raw for r in iter_materialized_jsonl(path)]
