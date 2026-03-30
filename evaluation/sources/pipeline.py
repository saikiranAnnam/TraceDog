"""Source fetch pipeline: retries, validation, caching, descriptor enrichment, stats."""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Literal

from evaluation.sources.cache import (
    default_cache_root,
    read_slice_cache,
    slice_cache_key,
    write_slice_cache,
)
from evaluation.sources.pipeline_events import (
    build_source_fetch_complete_event,
    emit_pipeline_event,
)
from evaluation.sources.types import EvalRowSource, SourceDescriptor, with_slice_and_hash


@dataclass
class PipelineStats:
    """Observability for the data stage (logs / JSONL / future metrics sink)."""

    fetch_ms: float
    rows_loaded: int
    rows_quarantined: int
    cache_hit: bool
    normalization_failures: int = 0
    fetch_attempts: int = 1
    materialization_ms: float = 0.0

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SourceFetchResult:
    rows: list[dict[str, Any]]
    descriptor: SourceDescriptor
    stats: PipelineStats


def emit_source_fetch_complete(
    *,
    run_id: str,
    registry_id: str,
    stats: PipelineStats,
    descriptor: SourceDescriptor,
    offset: int,
    limit: int,
    load_mode: str = "live_fetch",
) -> None:
    emit_pipeline_event(
        build_source_fetch_complete_event(
            run_id=run_id,
            dataset_id=registry_id,
            cache_hit=stats.cache_hit,
            fetch_ms=stats.fetch_ms,
            rows_loaded=stats.rows_loaded,
            rows_quarantined=stats.rows_quarantined,
            fetch_attempts=stats.fetch_attempts,
            normalization_failures=stats.normalization_failures,
            materialization_ms=stats.materialization_ms,
            source_descriptor=asdict(descriptor),
            offset=offset,
            limit=limit,
            load_mode=load_mode,
        )
    )


def short_hash_rows(rows: list[dict[str, Any]]) -> str:
    import hashlib

    h = hashlib.sha256()
    for r in rows:
        h.update(json.dumps(r, sort_keys=True, default=str).encode())
        h.update(b"\n")
    return h.hexdigest()[:16]


def enriched_descriptor_for_materialized(
    path: Path, rows: list[dict[str, Any]]
) -> SourceDescriptor:
    """Descriptor + slice/hash after loading a materialized JSONL file."""
    from evaluation.sources.canonical import descriptor_from_materialized_jsonl

    base = descriptor_from_materialized_jsonl(path)
    return with_slice_and_hash(
        base,
        offset=0,
        limit=len(rows),
        source_hash=short_hash_rows(rows),
    )


def validate_raw_row(registry_id: str, row: dict[str, Any]) -> tuple[bool, str | None]:
    """Return (ok, reason_code) for source health checks before adapters run."""
    if registry_id == "squad_v2":
        for k in ("id", "question", "context"):
            if k not in row:
                return False, f"missing_field:{k}"
        return True, None
    if registry_id == "hotpot_qa_fullwiki":
        if "question" not in row:
            return False, "missing_field:question"
        has_ctx = row.get("context") is not None
        has_ans = row.get("answer") is not None
        if not has_ctx and not has_ans:
            return False, "missing_context_and_answer"
        return True, None
    return True, None


def _retry_call(fn: Any, *, attempts: int, label: str) -> tuple[Any, int]:
    last: Exception | None = None
    n = max(1, attempts)
    for i in range(n):
        try:
            return fn(), i + 1
        except Exception as e:
            last = e
            if i + 1 >= n:
                break
            delay = min(8.0, 0.5 * (2**i))
            time.sleep(delay)
            print(
                f"[eval-sources] {label} retry {i + 2}/{n} after {type(e).__name__}: {e}",
                file=sys.stderr,
            )
    assert last is not None
    raise last


def _resolve_run_id(explicit: str | None) -> str:
    if explicit:
        return explicit
    env = (os.environ.get("TRACE_EVAL_RUN_ID") or "").strip()
    if env:
        return env
    return uuid.uuid4().hex


def fetch_rows_pipeline(
    source: EvalRowSource,
    *,
    registry_id: str,
    offset: int,
    limit: int,
    use_cache: bool = False,
    cache_root: Path | None = None,
    max_retries: int = 3,
    validate_rows: bool = True,
    on_validation_error: Literal["skip", "fail"] = "skip",
    run_id: str | None = None,
) -> SourceFetchResult:
    """
    Fetch native rows with optional cache, retries, and row-level validation.

    When ``on_validation_error`` is ``skip``, malformed rows are dropped and
    ``rows_quarantined`` is incremented (rows_loaded may be < limit).
    """
    rid = _resolve_run_id(run_id)
    base_desc = source.describe()
    root = cache_root if cache_root is not None else default_cache_root()
    cache_key = slice_cache_key(base_desc, offset, limit)
    cache_hit = False
    fetch_attempts = 1
    t0 = time.perf_counter()

    if use_cache:
        cached, _meta = read_slice_cache(root, cache_key)
        if cached is not None:
            cache_hit = True
            rows = cached
            h = short_hash_rows(rows)
            desc = with_slice_and_hash(base_desc, offset=offset, limit=limit, source_hash=h)
            stats = PipelineStats(
                fetch_ms=(time.perf_counter() - t0) * 1000.0,
                rows_loaded=len(rows),
                rows_quarantined=0,
                cache_hit=True,
                fetch_attempts=0,
            )
            emit_source_fetch_complete(
                run_id=rid,
                registry_id=registry_id,
                stats=stats,
                descriptor=desc,
                offset=offset,
                limit=limit,
            )
            return SourceFetchResult(rows=rows, descriptor=desc, stats=stats)

    quarantined = 0

    def _do_fetch() -> list[dict[str, Any]]:
        return source.fetch_rows(offset, limit)

    try:
        rows, fetch_attempts = _retry_call(
            _do_fetch, attempts=max_retries, label=registry_id
        )
    except Exception:
        raise

    if validate_rows:
        kept: list[dict[str, Any]] = []
        for r in rows:
            ok, reason = validate_raw_row(registry_id, r)
            if ok:
                kept.append(r)
            else:
                quarantined += 1
                print(
                    f"[eval-sources] quarantine row registry={registry_id} reason={reason}",
                    file=sys.stderr,
                )
                if on_validation_error == "fail":
                    raise ValueError(
                        f"Source validation failed for {registry_id}: {reason} row_preview={str(r)[:200]!r}"
                    )
        rows = kept

    fetch_ms = (time.perf_counter() - t0) * 1000.0
    h = short_hash_rows(rows)
    desc = with_slice_and_hash(base_desc, offset=offset, limit=limit, source_hash=h)

    if use_cache and rows:
        try:
            write_slice_cache(root, cache_key, rows, descriptor=desc, offset=offset, limit=limit)
        except OSError as e:
            print(f"[eval-sources] cache write skipped: {e}", file=sys.stderr)

    stats = PipelineStats(
        fetch_ms=fetch_ms,
        rows_loaded=len(rows),
        rows_quarantined=quarantined,
        cache_hit=cache_hit,
        fetch_attempts=fetch_attempts,
    )
    emit_source_fetch_complete(
        run_id=rid,
        registry_id=registry_id,
        stats=stats,
        descriptor=desc,
        offset=offset,
        limit=limit,
    )
    return SourceFetchResult(rows=rows, descriptor=desc, stats=stats)


def log_pipeline_stats(stats: PipelineStats, *, registry_id: str) -> None:
    print(
        f"[eval-sources] registry={registry_id} "
        f"fetch_ms={stats.fetch_ms:.1f} rows={stats.rows_loaded} "
        f"quarantined={stats.rows_quarantined} cache_hit={stats.cache_hit}",
        file=sys.stderr,
    )
