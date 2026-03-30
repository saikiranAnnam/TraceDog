#!/usr/bin/env python3
"""
Compare aggregate metrics from two eval JSONL files (before vs after a change).

Each line should be one JSON object from `run_squad_eval` / `run_hotpot_eval` with a
successful TraceDog POST (includes `grounding_score`, `hybrid_*`, etc.).

Usage (from repo root):
  PYTHONPATH=. python scripts/compare_jsonl_runs.py \\
    runs/baseline.jsonl runs/improved.jsonl

Optional labels:
  PYTHONPATH=. python scripts/compare_jsonl_runs.py before.jsonl after.jsonl \\
    --label-a main --label-b hybrid-scorer-v2

Stdlib only.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _load_rows(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"{path}:{line_no}: invalid JSON: {e}", file=sys.stderr)
                continue
            if not isinstance(obj, dict):
                continue
            # Only rows that ingested to TraceDog
            if obj.get("dry_run") or "grounding_score" not in obj:
                continue
            rows.append(obj)
    return rows


def main() -> int:
    p = argparse.ArgumentParser(description="Compare eval JSONL aggregate metrics (A vs B)")
    p.add_argument("jsonl_a", type=Path, help="Earlier / baseline run")
    p.add_argument("jsonl_b", type=Path, help="Newer / improved run")
    p.add_argument("--label-a", default="A (baseline)")
    p.add_argument("--label-b", default="B (new)")
    args = p.parse_args()

    if not args.jsonl_a.is_file():
        print(f"Not a file: {args.jsonl_a}", file=sys.stderr)
        return 1
    if not args.jsonl_b.is_file():
        print(f"Not a file: {args.jsonl_b}", file=sys.stderr)
        return 1

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from evaluation.runners.utils.trace_metrics import aggregate_eval_rows

    rows_a = _load_rows(args.jsonl_a)
    rows_b = _load_rows(args.jsonl_b)
    agg_a = aggregate_eval_rows(rows_a)
    agg_b = aggregate_eval_rows(rows_b)

    def fmt(x: float | None) -> str:
        return f"{x:.4f}" if x is not None else "n/a"

    keys = [
        ("n", "rows (traces)", False),
        ("avg_chunk_grounding", "avg chunk grounding", True),
        ("avg_cgge_response_groundedness", "avg CGGE response groundedness", True),
        ("avg_cgge_unsupported_ratio", "avg CGGE unsupported ratio", False),
        ("avg_claims_per_answer", "avg claims per answer", True),
        ("avg_hybrid_answer_hallucination", "avg hybrid answer hallucination (lower better)", False),
        ("avg_hybrid_trace_reliability", "avg hybrid trace reliability (higher better)", True),
    ]

    print("\n=== Compare eval runs ===")
    print(f"  {args.label_a}: {args.jsonl_a}  (n={agg_a.get('n', 0)})")
    print(f"  {args.label_b}: {args.jsonl_b}  (n={agg_b.get('n', 0)})")
    print()
    print(f"{'metric':<42} {'A':>12} {'B':>12} {'delta':>12} {'better':>8}")
    print("-" * 90)

    for key, label, higher_is_better in keys:
        va = agg_a.get(key) if key != "n" else agg_a.get("n")
        vb = agg_b.get(key) if key != "n" else agg_b.get("n")
        if key == "n":
            na, nb = int(va or 0), int(vb or 0)
            d = nb - na
            print(f"{label:<42} {na:>12} {nb:>12} {d:>+12} {'':>8}")
            continue
        if not isinstance(va, (int, float)) and va is not None:
            va = None
        if not isinstance(vb, (int, float)) and vb is not None:
            vb = None
        fa = float(va) if va is not None else None
        fb = float(vb) if vb is not None else None
        delta_s = "n/a"
        better = ""
        if fa is not None and fb is not None:
            d = fb - fa
            delta_s = f"{d:+.4f}"
            if higher_is_better:
                better = "B" if d > 1e-6 else ("A" if d < -1e-6 else "~")
            else:
                better = "B" if d < -1e-6 else ("A" if d > 1e-6 else "~")
        print(f"{label:<42} {fmt(fa) if fa is not None else 'n/a':>12} {fmt(fb) if fb is not None else 'n/a':>12} {delta_s:>12} {better:>8}")

    ba = agg_a.get("hybrid_risk_band_totals")
    bb = agg_b.get("hybrid_risk_band_totals")
    if (
        isinstance(ba, dict)
        and isinstance(bb, dict)
        and (any(ba.values()) or any(bb.values()))
    ):
        print("\nHybrid risk band totals (claims across traces):")
        for band in ("low", "medium", "high"):
            print(f"  {band:<8}  A={ba.get(band, 0) if isinstance(ba, dict) else 0}  B={bb.get(band, 0) if isinstance(bb, dict) else 0}")

    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
