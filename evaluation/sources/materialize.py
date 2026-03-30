"""Materialize registry sources → canonical JSONL (+ ``.provenance.json`` sidecar)."""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from evaluation.sources.canonical import CANONICAL_SCHEMA_VERSION, normalize_raw_row
from evaluation.sources.pipeline import fetch_rows_pipeline, log_pipeline_stats
from evaluation.sources.registry import SOURCE_REGISTRY, build_registered_source


def materialize_to_jsonl(
    *,
    source_id: str,
    out_path: Path,
    offset: int,
    limit: int,
    split: str | None,
    json_path: Path | None,
    use_cache: bool,
    max_retries: int,
) -> None:
    kwargs: dict = {}
    if source_id == "squad_v2":
        kwargs["split"] = split or "validation"
    elif source_id == "hotpot_qa_fullwiki":
        kwargs["split"] = split or "validation"
        kwargs["json_path"] = json_path
    else:
        raise KeyError(f"materialize not wired for {source_id!r}")
    source = build_registered_source(source_id, **kwargs)
    result = fetch_rows_pipeline(
        source,
        registry_id=source_id,
        offset=offset,
        limit=limit,
        use_cache=use_cache,
        max_retries=max_retries,
        validate_rows=True,
        on_validation_error="skip",
    )
    log_pipeline_stats(result.stats, registry_id=source_id)
    written = 0
    nf = 0
    t0 = time.perf_counter()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        for row in result.rows:
            try:
                can = normalize_raw_row(
                    source_id,
                    row,
                    dataset_version=result.descriptor.dataset_version or "unknown",
                    split=result.descriptor.split,
                )
                can.provenance = {"source_descriptor": asdict(result.descriptor)}
                f.write(json.dumps(can.to_json_dict(), ensure_ascii=False) + "\n")
                written += 1
            except Exception:
                nf += 1
    result.stats.materialization_ms = (time.perf_counter() - t0) * 1000.0
    result.stats.normalization_failures = nf
    prov = {
        "registry_id": source_id,
        "materialized_at_utc": datetime.now(timezone.utc).isoformat(),
        "canonical_schema": CANONICAL_SCHEMA_VERSION,
        "source_descriptor": asdict(result.descriptor),
        "pipeline_stats": result.stats.as_dict(),
        "rows_written": written,
    }
    prov_path = out_path.with_name(out_path.name + ".provenance.json")
    prov_path.write_text(json.dumps(prov, indent=2), encoding="utf-8")
    print(f"[materialize] wrote {written} rows -> {out_path}", flush=True)


def main() -> None:
    p = argparse.ArgumentParser(
        description="Fetch a registry dataset slice, normalize to canonical JSONL + provenance sidecar."
    )
    p.add_argument("--dataset", required=True, choices=sorted(SOURCE_REGISTRY.keys()))
    p.add_argument("--out", type=Path, required=True, help="Output .jsonl path")
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--split", default=None, help="HF split (dataset default if omitted)")
    p.add_argument(
        "--json-path",
        type=Path,
        default=None,
        help="Hotpot only: local official JSON array",
    )
    p.add_argument(
        "--source-cache",
        action="store_true",
        help="Use TRACE_EVAL_SOURCE_CACHE slice cache for the raw fetch",
    )
    p.add_argument("--max-retries", type=int, default=3)
    args = p.parse_args()
    materialize_to_jsonl(
        source_id=args.dataset,
        out_path=args.out,
        offset=args.offset,
        limit=args.limit,
        split=args.split,
        json_path=args.json_path,
        use_cache=args.source_cache,
        max_retries=args.max_retries,
    )


if __name__ == "__main__":
    main()
