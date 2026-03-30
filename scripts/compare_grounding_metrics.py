#!/usr/bin/env python3
"""
POST a trace and print chunk-level vs CGGE metrics side by side.

Usage (from repo root, API running):
  TRACEDOG_API_URL=http://localhost:8000 python scripts/compare_grounding_metrics.py

Uses stdlib only (no extra deps).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any


def _post_json(url: str, body: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    base = os.environ.get("TRACEDOG_API_URL", "http://127.0.0.1:8000").rstrip("/")
    url = f"{base}/api/v1/traces"

    # Classic “high chunk / bad claim” style example (adjust to your stack).
    payload = {
        "agent_name": "cgge-compare-demo",
        "environment": "dev",
        "prompt": "How does DynamoDB scale?",
        "response": "DynamoDB scales to millions of requests and guarantees zero latency.",
        "model_name": "demo",
        "latency_ms": 100,
        "retrieved_docs": [
            {
                "doc_id": "doc_1",
                "content": (
                    "DynamoDB is designed to scale horizontally and supports millions "
                    "of requests per second."
                ),
            },
            {
                "doc_id": "doc_2",
                "content": (
                    "DynamoDB offers low-latency performance, though actual latency "
                    "depends on workload and network conditions."
                ),
            },
        ],
    }

    try:
        data = _post_json(url, payload)
    except urllib.error.URLError as e:
        print(f"Request failed: {e}", file=sys.stderr)
        print(f"Set TRACEDOG_API_URL (e.g. http://127.0.0.1:8000) and ensure the API is up.", file=sys.stderr)
        return 1

    layers = data.get("grounding_layers")
    if not layers:
        print(json.dumps(data, indent=2))
        print("\n(no grounding_layers in response — backend may need updating)", file=sys.stderr)
        return 2

    ch = layers["chunk_level"]
    cl = layers["claim_level"]
    co = layers["comparison"]

    print("=== Chunk-level (legacy hybrid per doc vs full answer) ===")
    print(f"  grounding_score:        {ch['grounding_score']}")
    print(f"  hallucination_risk:     {ch['hallucination_risk']}")
    print(f"  reliability_score:    {ch['reliability_score']}")
    print(f"  failure_type:           {ch['failure_type']}")
    print(f"  per_doc_similarity:     {ch['per_doc_similarity']}")
    print(f"  max / mean chunk sim:   {ch['max_chunk_similarity']} / {ch['mean_chunk_similarity']}")

    print("\n=== Claim-level (CGGE) ===")
    print(f"  response_groundedness:       {cl['response_groundedness']}")
    print(f"  unsupported_ratio:           {cl['unsupported_ratio']}")
    print(f"  supported_or_partial_ratio:  {cl['supported_or_partial_ratio']}")
    print(f"  claim_count:                 {cl['claim_count']}")
    print(f"  label_counts:                {cl['label_counts']}")

    print("\n=== Comparison ===")
    print(f"  partial_hallucination_signal: {co['partial_hallucination_signal']}")
    print(f"  strong_chunk_threshold:       {co['strong_chunk_threshold']}")
    print(f"  notes:                        {co['notes']}")

    print("\n=== Raw claims (first 5) ===")
    for c in (data.get("claim_grounding") or {}).get("claims", [])[:5]:
        print(f"  [{c.get('label')}] {c.get('claim_text')}")

    ri = data.get("reliability_insights")
    if isinstance(ri, dict):
        hy = ri.get("hybrid_hallucination") or {}
        agg = hy.get("aggregates") or {}
        rca = ri.get("causal_rca") or {}
        rep = ri.get("repair_loop") or {}
        print("\n=== Hybrid + RCA + repair (Phases 1–3) ===")
        print(f"  answer_hallucination_score:  {agg.get('answer_hallucination_score')}")
        print(f"  trace_reliability_score:     {agg.get('trace_reliability_score')}")
        print(f"  risk_band distribution:      {agg.get('hallucination_type_distribution')}")
        print(f"  root_cause_primary:          {rca.get('root_cause_primary')}")
        print(f"  repair_steps (count):          {len(rep.get('steps') or [])}")
    else:
        print("\n(no reliability_insights — upgrade backend or re-ingest)", file=sys.stderr)

    print(f"\ntrace_id: {data.get('trace_id')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
