#!/usr/bin/env python3
"""
Populate TraceDog with demo data for the dashboard (model comparison, etc.).

Why the default is *hardcoded* JSON (not SQuAD inline)
------------------------------------------------------
  • No OpenAI/Anthropic keys, no HuggingFace dataset download, no extra pip deps.
  • Fast, deterministic, cheap — good for recruiters, screenshots, CI smoke tests.
  • Still exercises the real ingestion + scoring path (`POST /api/v1/traces`).

Real SQuAD v2 runs (LLM + dataset) live in `evaluation/runners/run_squad_eval.py`.
This script can *delegate* to that runner with `--squad` so you do not maintain two
pipelines — we only wrap the CLI.

Usage
-----
  # Hardcoded demo traces (stdlib only):
  TRACEDOG_URL=http://127.0.0.1:8000 python scripts/seed_demo_traces.py

  # SQuAD → LLM → TraceDog (needs: pip install -r evaluation/requirements.txt,
  # OPENAI_API_KEY or ANTHROPIC_API_KEY, see evaluation/.env.example):
  TRACEDOG_URL=https://your-api.example.com python scripts/seed_demo_traces.py --squad --limit 5

  # Or call the runner directly (same behavior as --squad):
  PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 10 --experiment my-run
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]


def _tracedog_base() -> str:
    return os.environ.get("TRACEDOG_URL", "http://127.0.0.1:8000").rstrip("/")


# Varied models + experiment tags + grounding-ish payloads so charts are not flat.
_DEMOS: list[dict] = [
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "What is the capital of France?",
        "response": "Paris is the capital of France.",
        "model_name": "gpt-4o-mini",
        "latency_ms": 420,
        "retrieved_docs": [
            {
                "doc_id": "wiki-fr",
                "content": "Paris has been the capital of France since the late medieval period.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "geo-1"},
    },
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "What is the capital of France?",
        "response": "Lyon is the capital of France.",
        "model_name": "claude-haiku",
        "latency_ms": 890,
        "retrieved_docs": [
            {
                "doc_id": "wiki-fr",
                "content": "Paris is the capital and largest city of France.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "geo-1"},
    },
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "Refund policy in one sentence?",
        "response": "Refunds are processed within seven business days after approval.",
        "model_name": "gpt-4o-mini",
        "latency_ms": 510,
        "retrieved_docs": [
            {
                "doc_id": "policy",
                "content": "Refunds require manager approval; processing may take up to seven business days.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "policy-2"},
    },
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "Refund policy in one sentence?",
        "response": "You get instant refunds with no approval needed.",
        "model_name": "claude-haiku",
        "latency_ms": 720,
        "retrieved_docs": [
            {
                "doc_id": "policy",
                "content": "Refunds require manager approval; processing may take up to seven business days.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "policy-2"},
    },
    {
        "agent_name": "sales-assistant",
        "environment": "staging",
        "prompt": "Summarize pricing tiers.",
        "response": "Starter is $10/mo, Pro is $49/mo, Enterprise is custom.",
        "model_name": "gpt-4o",
        "latency_ms": 1200,
        "retrieved_docs": [
            {
                "doc_id": "pricing",
                "content": "Starter $10/mo, Pro $49/mo, Enterprise contact sales.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "price-3"},
    },
    {
        "agent_name": "sales-assistant",
        "environment": "staging",
        "prompt": "Summarize pricing tiers.",
        "response": "Everything is free forever for all customers.",
        "model_name": "gpt-4o-mini",
        "latency_ms": 380,
        "retrieved_docs": [
            {
                "doc_id": "pricing",
                "content": "Starter $10/mo, Pro $49/mo, Enterprise contact sales.",
            }
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "price-3"},
    },
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "Name two planets.",
        "response": "Earth and Mars are planets in our solar system.",
        "model_name": "gpt-4o",
        "latency_ms": 640,
        "retrieved_docs": [
            {"doc_id": "space", "content": "Earth and Mars orbit the Sun."}
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "space-4"},
    },
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "Name two planets.",
        "response": "The Sun and the Moon.",
        "model_name": "claude-haiku",
        "latency_ms": 950,
        "retrieved_docs": [
            {"doc_id": "space", "content": "Earth and Mars orbit the Sun."}
        ],
        "ingest_metadata": {"experiment": "recruiter-demo-v1", "case_id": "space-4"},
    },
    # Portfolio: CGGE graph — one claim strongly supported, one risky / conflicted vs evidence
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "How does DynamoDB scale?",
        "response": (
            "DynamoDB scales to millions of requests and guarantees zero latency."
        ),
        "model_name": "gpt-4o-mini",
        "latency_ms": 640,
        "retrieved_docs": [
            {
                "doc_id": "aws-scale",
                "content": (
                    "DynamoDB is designed to scale horizontally and supports "
                    "millions of requests per second."
                ),
            },
            {
                "doc_id": "aws-latency",
                "content": (
                    "DynamoDB offers low-latency performance, though actual latency "
                    "depends on workload and network conditions."
                ),
            },
        ],
        "ingest_metadata": {"experiment": "portfolio-v1", "case_id": "cgge-partial-hallucination"},
    },
    # Portfolio: trivial fully-grounded answer (good case for graph + metrics)
    {
        "agent_name": "eval-bot",
        "environment": "demo",
        "prompt": "What is two plus two?",
        "response": "Two plus two equals four.",
        "model_name": "claude-haiku",
        "latency_ms": 210,
        "retrieved_docs": [
            {
                "doc_id": "math-facts",
                "content": "Basic arithmetic: 2 + 2 = 4.",
            }
        ],
        "ingest_metadata": {"experiment": "portfolio-v1", "case_id": "cgge-all-supported"},
    },
]


def seed_hardcoded(base: str) -> int:
    url = f"{base}/api/v1/traces"
    ok = 0
    for i, payload in enumerate(_DEMOS):
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status != 200:
                    print(f"[{i}] HTTP {resp.status}", file=sys.stderr)
                    continue
                data = json.loads(resp.read().decode())
                tid = data.get("trace_id", "?")
                print(f"[{i}] ok trace_id={tid} model={payload['model_name']}")
                ok += 1
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            print(f"[{i}] HTTP {e.code}: {err}", file=sys.stderr)
        except urllib.error.URLError as e:
            print(f"[{i}] {e.reason}", file=sys.stderr)
            print(f"    Is the API up? TRACEDOG_URL={base!r}", file=sys.stderr)
            return 1

    print(
        f"\nDone: {ok}/{len(_DEMOS)} ingested. "
        "Filter experiment tag `recruiter-demo-v1` in the dashboard if needed.",
    )
    return 0 if ok else 1


def run_squad_delegate(
    base: str,
    limit: int,
    experiment: str,
    provider: str | None,
    passthrough: list[str],
) -> int:
    """Shell out to evaluation/runners/run_squad_eval.py (single source of truth)."""
    cmd: list[str] = [
        sys.executable,
        "-m",
        "evaluation.runners.run_squad_eval",
        "--limit",
        str(limit),
        "--tracedog-url",
        base,
        "--experiment",
        experiment,
    ]
    if provider:
        cmd.extend(["--provider", provider])
    cmd.extend(passthrough)

    env = os.environ.copy()
    root = str(_REPO_ROOT)
    env["PYTHONPATH"] = root + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")

    print("[seed_demo_traces] delegating to:", " ".join(cmd), file=sys.stderr)
    return subprocess.call(cmd, cwd=root, env=env)


def main() -> int:
    p = argparse.ArgumentParser(
        description="Seed TraceDog with hardcoded demo traces, or run SQuAD via the evaluation runner.",
    )
    p.add_argument(
        "--squad",
        action="store_true",
        help="Run SQuAD v2 through evaluation/runners/run_squad_eval.py (requires LLM key + evaluation deps).",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=10,
        help="For --squad: number of SQuAD rows (default: 10). Ignored for hardcoded mode.",
    )
    p.add_argument(
        "--experiment",
        default="squad-v2-seed",
        help="For --squad: experiment name tag (default: squad-v2-seed).",
    )
    p.add_argument(
        "--provider",
        choices=("openai", "anthropic"),
        default=None,
        help="For --squad: LLM provider (else EVAL_LLM_PROVIDER / openai).",
    )
    args, rest = p.parse_known_args()
    base = _tracedog_base()

    if args.squad:
        return run_squad_delegate(
            base,
            limit=args.limit,
            experiment=args.experiment,
            provider=args.provider,
            passthrough=rest,
        )

    if rest:
        print(f"Unknown arguments (use --squad for SQuAD extras): {rest}", file=sys.stderr)
        return 2

    return seed_hardcoded(base)


if __name__ == "__main__":
    raise SystemExit(main())
