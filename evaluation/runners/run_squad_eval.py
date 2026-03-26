#!/usr/bin/env python3
"""
SQuAD v2 → LLM → TraceDog.

Usage (from repo root):
  cp evaluation/.env.example evaluation/.env   # add keys + models
  PYTHONPATH=. python -m evaluation.runners.run_squad_eval --limit 10

Loads env from repo `.env` then `evaluation/.env` (latter overrides).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

_EVAL_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]


def _load_eval_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(_REPO_ROOT / ".env", override=False)
    load_dotenv(_EVAL_ROOT / ".env", override=True)


def _normalize_provider(raw: str | None) -> str:
    p = (raw or "openai").strip().lower()
    return p if p in ("openai", "anthropic") else "openai"


# Anthropic returns 404 for retired snapshot ids still common in old .env files.
_RETIRED_ANTHROPIC_MODELS: dict[str, str] = {
    "claude-3-5-haiku-20241022": "claude-haiku-4-5",
    "claude-3-5-sonnet-20241022": "claude-sonnet-4-6",
    "claude-3-5-sonnet-20240620": "claude-sonnet-4-6",
}


def _resolve_anthropic_model_id(model_name: str) -> str:
    m = model_name.strip()
    replacement = _RETIRED_ANTHROPIC_MODELS.get(m)
    if replacement:
        print(
            f"[warn] Anthropic model {m!r} is retired; using {replacement!r} instead.",
            file=sys.stderr,
        )
        return replacement
    return m


def _load_squad_rows(split: str, offset: int, limit: int) -> list[dict]:
    from datasets import load_dataset

    ds = load_dataset("squad_v2", split=split)
    n = len(ds)
    end = min(offset + limit, n)
    if offset >= n:
        return []
    return [ds[i] for i in range(offset, end)]


def main() -> None:
    _load_eval_env()

    p = argparse.ArgumentParser(description="Run SQuAD v2 through an LLM and TraceDog")
    p.add_argument("--split", default="validation", choices=("train", "validation"))
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--limit", type=int, default=10)
    p.add_argument(
        "--provider",
        default=None,
        choices=("openai", "anthropic"),
        help="LLM API; default EVAL_LLM_PROVIDER or openai (see evaluation/.env.example)",
    )
    p.add_argument(
        "--model",
        default=None,
        help="Model id; default EVAL_OPENAI_MODEL / EVAL_ANTHROPIC_MODEL or built-in fallback",
    )
    p.add_argument(
        "--tracedog-url",
        default=os.environ.get("TRACEDOG_URL", "http://localhost:8000"),
    )
    p.add_argument("--experiment", default="squad-v2-eval")
    p.add_argument("--agent-name", default="squad-eval-runner")
    p.add_argument("--environment", default="evaluation")
    p.add_argument("--dry-run", action="store_true", help="Do not POST to TraceDog")
    p.add_argument(
        "--output-jsonl",
        type=Path,
        default=None,
        help="Append one JSON line per case (scores + ids) to this file",
    )
    args = p.parse_args()

    from evaluation.runners.adapters.squad_adapter import (
        docs_for_tracedog_payload,
        squad_row_to_eval_case,
    )
    from evaluation.runners.utils.prompt_builder import build_prompt

    default_models = {
        "openai": "gpt-4o-mini",
        # Anthropic retires dated snapshots; alias tracks current Haiku 4.5
        "anthropic": "claude-haiku-4-5",
    }
    provider = _normalize_provider(args.provider or os.environ.get("EVAL_LLM_PROVIDER"))
    model_env = (
        "EVAL_OPENAI_MODEL" if provider == "openai" else "EVAL_ANTHROPIC_MODEL"
    )
    model_name = (
        args.model
        or os.environ.get(model_env)
        or default_models[provider]
    )
    model_name = model_name.strip()
    if provider == "anthropic":
        model_name = _resolve_anthropic_model_id(model_name)

    env_keys = {
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
    }
    api_key = (os.environ.get(env_keys[provider]) or "").strip() or None
    if not args.dry_run and not api_key:
        print(
            f"Set {env_keys[provider]} for provider {provider} "
            "(evaluation/.env or repo .env), or pass --dry-run",
            file=sys.stderr,
        )
        sys.exit(1)

    rows = _load_squad_rows(args.split, args.offset, args.limit)
    if not rows:
        print("No rows in range", file=sys.stderr)
        sys.exit(1)

    runner = None
    if api_key:
        if provider == "openai":
            from evaluation.runners.providers.openai_runner import OpenAIChatRunner

            runner = OpenAIChatRunner(model_name, api_key=api_key)
        else:
            from evaluation.runners.providers.claude_runner import ClaudeMessagesRunner

            runner = ClaudeMessagesRunner(model_name, api_key=api_key)

    out_path = args.output_jsonl
    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)

    for i, row in enumerate(rows):
        if (i + 1) % max(1, len(rows) // 5 or 1) == 0 or i == 0:
            print(f"[squad_v2] {i + 1}/{len(rows)}", file=sys.stderr)
        case = squad_row_to_eval_case(row)
        prompt = build_prompt(case.question, case.retrieved_docs)
        payload_docs = docs_for_tracedog_payload(case.retrieved_docs)

        meta = {
            "run_type": "evaluation",
            "dataset_name": "squad_v2",
            "split": args.split,
            "case_id": case.case_id,
            "experiment_name": args.experiment,
            "llm_provider": provider,
            "is_answerable": case.is_answerable,
            "reference_answer": case.reference_answer,
            "title": case.title,
        }

        if runner:
            try:
                result = runner.run(prompt)
            except Exception as e:
                print(f"[llm-error] case={case.case_id} provider={provider}: {e}", file=sys.stderr)
                raise
        else:
            result = None

        record: dict = {
            "case_id": case.case_id,
            "provider": provider,
            "model": model_name,
            "dry_run": args.dry_run,
        }

        if result:
            record["latency_ms"] = result.latency_ms
            record["response_preview"] = result.response_text[:200]

        if args.dry_run or not result:
            print(f"[dry-run] {case.case_id} prompt_chars={len(prompt)}", file=sys.stderr)
        else:
            from evaluation.runners.utils.tracedog_client import submit_trace

            td = submit_trace(
                args.tracedog_url,
                agent_name=args.agent_name,
                environment=args.environment,
                question=case.question,
                model_name=result.model_name,
                response_text=result.response_text,
                latency_ms=result.latency_ms,
                retrieved_docs=payload_docs,
                ingest_metadata=meta,
            )
            record.update(
                {
                    "trace_id": td.get("trace_id"),
                    "reliability_score": td.get("reliability_score"),
                    "hallucination_risk": td.get("hallucination_risk"),
                    "grounding_score": td.get("grounding_score"),
                    "failure_type": td.get("failure_type"),
                }
            )
            print(
                f"{case.case_id}\t{result.model_name}\trel={td.get('reliability_score')}\t"
                f"risk={td.get('hallucination_risk')}\tft={td.get('failure_type')}",
                file=sys.stderr,
            )

        if out_path:
            with out_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
