"""Filesystem cache for source slice fetches (hash-keyed)."""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from pathlib import Path
from typing import Any

from evaluation.sources.types import SourceDescriptor


def default_cache_root() -> Path:
    env = os.environ.get("TRACE_EVAL_SOURCE_CACHE")
    if env:
        return Path(env).expanduser()
    return Path(__file__).resolve().parents[1] / ".cache" / "source_fetches"


def slice_cache_key(descriptor: SourceDescriptor, offset: int, limit: int) -> str:
    """Stable key for (descriptor identity × slice)."""
    import hashlib

    payload = {
        "provider": descriptor.provider,
        "dataset_ref": descriptor.dataset_ref,
        "split": descriptor.split,
        "config": descriptor.config_name,
        "dataset_id": descriptor.dataset_id,
        "dataset_version": descriptor.dataset_version,
        "revision": descriptor.revision,
        "offset": offset,
        "limit": limit,
    }
    h = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    )
    return h.hexdigest()[:32]


def _paths(root: Path, key: str) -> tuple[Path, Path]:
    base = root / "slices"
    base.mkdir(parents=True, exist_ok=True)
    return base / f"{key}.meta.json", base / f"{key}.rows.json"


def read_slice_cache(root: Path, key: str) -> tuple[list[dict[str, Any]] | None, dict[str, Any] | None]:
    meta_path, rows_path = _paths(root, key)
    if not meta_path.is_file() or not rows_path.is_file():
        return None, None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        rows = json.loads(rows_path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            return None, None
        return rows, meta
    except (json.JSONDecodeError, OSError):
        return None, None


def write_slice_cache(
    root: Path,
    key: str,
    rows: list[dict[str, Any]],
    *,
    descriptor: SourceDescriptor,
    offset: int,
    limit: int,
) -> None:
    meta_path, rows_path = _paths(root, key)
    meta = {
        "descriptor": asdict(descriptor),
        "offset": offset,
        "limit": limit,
        "row_count": len(rows),
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    rows_path.write_text(json.dumps(rows), encoding="utf-8")
