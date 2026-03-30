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
import uuid
from pathlib import Path
from typing import Any

import requests

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
    p.add_argument(
        "--summary",
        action="store_true",
        help="After the run, print aggregate chunk + CGGE + hybrid metrics (requires successful TraceDog POSTs).",
    )
    p.add_argument(
        "--write-summary-json",
        type=Path,
        default=None,
        help="Write aggregate metrics JSON (same as --summary) for diffing across runs.",
    )
    p.add_argument(
        "--source-cache",
        action="store_true",
        help="Cache raw slice fetches under TRACE_EVAL_SOURCE_CACHE (or evaluation/.cache/source_fetches).",
    )
    p.add_argument(
        "--materialized",
        type=Path,
        default=None,
        help="Load rows from canonical JSONL (python -m evaluation.sources.materialize --help).",
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

    use_source_cache = args.source_cache or os.environ.get(
        "TRACE_EVAL_USE_SOURCE_CACHE", ""
    ).lower() in ("1", "true", "yes")

    run_rid = (os.environ.get("TRACE_EVAL_RUN_ID") or "").strip() or uuid.uuid4().hex

    from evaluation.sources.lineage import collect_lineage
    from evaluation.sources.pipeline import (
        PipelineStats,
        emit_source_fetch_complete,
        fetch_rows_pipeline,
        log_pipeline_stats,
    )

    if args.materialized:
        from evaluation.sources.canonical import load_materialized_rows
        from evaluation.sources.pipeline import enriched_descriptor_for_materialized

        try:
            rows = load_materialized_rows(args.materialized)
        except (ValueError, OSError) as e:
            print(f"[squad] materialized load failed: {e}", file=sys.stderr)
            sys.exit(1)
        source_descriptor = enriched_descriptor_for_materialized(
            args.materialized, rows
        )
        stats_obj = PipelineStats(
            fetch_ms=0.0,
            rows_loaded=len(rows),
            rows_quarantined=0,
            cache_hit=False,
        )
        pipeline_stats = stats_obj.as_dict()
        emit_source_fetch_complete(
            run_id=run_rid,
            registry_id="squad_v2",
            stats=stats_obj,
            descriptor=source_descriptor,
            offset=0,
            limit=len(rows),
            load_mode="materialized_jsonl",
        )
    else:
        from evaluation.sources import SquadV2RowSource

        source = SquadV2RowSource(split=args.split)
        try:
            fr = fetch_rows_pipeline(
                source,
                registry_id="squad_v2",
                offset=args.offset,
                limit=args.limit,
                use_cache=use_source_cache,
                max_retries=3,
                validate_rows=True,
                on_validation_error="skip",
                run_id=run_rid,
            )
        except Exception as e:
            print(f"[squad] failed to load data: {e}", file=sys.stderr)
            sys.exit(1)
        rows = fr.rows
        source_descriptor = fr.descriptor
        pipeline_stats = fr.stats.as_dict()
        log_pipeline_stats(fr.stats, registry_id="squad_v2")

    split_for_meta = (
        source_descriptor.split
        if args.materialized
        else args.split
    )

    lineage_frag = collect_lineage(
        runner_name="run_squad_eval",
        adapter_id="squad_adapter",
        llm_model=model_name,
        llm_provider=provider,
        source_descriptor=source_descriptor,
        pipeline_stats=pipeline_stats,
        run_id=run_rid,
    ).as_ingest_fragment()

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

    cgge_rows: list[dict[str, Any]] = []

    for i, row in enumerate(rows):
        if (i + 1) % max(1, len(rows) // 5 or 1) == 0 or i == 0:
            print(f"[squad_v2] {i + 1}/{len(rows)}", file=sys.stderr)
        case = squad_row_to_eval_case(row)
        prompt = build_prompt(case.question, case.retrieved_docs)
        payload_docs = docs_for_tracedog_payload(case.retrieved_docs)

        meta = {
            "run_type": "evaluation",
            "task_type": "short_answer_qa",
            "dataset_name": "squad_v2",
            "split": split_for_meta,
            "case_id": case.case_id,
            "experiment_name": args.experiment,
            "llm_provider": provider,
            "eval_question": case.question,
            "is_answerable": case.is_answerable,
            "reference_answer": case.reference_answer,
            "title": case.title,
            "eval_lineage": lineage_frag,
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

            try:
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
            except requests.exceptions.ConnectionError:
                print(
                    f"\n[squad] TraceDog API is not reachable at {args.tracedog_url!r} "
                    "(connection refused — nothing listening).\n"
                    "  • Start the backend: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\n"
                    "  • Or set TRACEDOG_URL / --tracedog-url to your API.\n"
                    "  • Or use --dry-run to skip POST (still runs the LLM if keys are set).\n",
                    file=sys.stderr,
                )
                sys.exit(1)
            from evaluation.runners.utils.trace_metrics import extract_tracedog_metrics

            m = extract_tracedog_metrics(td)
            record.update(m)
            cgge_rows.append(m)
            cg = td.get("claim_grounding") or {}
            claims = cg.get("claims") or []
            hy_h = m.get("hybrid_answer_hallucination")
            hy_t = m.get("hybrid_trace_reliability")
            hy_s = f"\thybrid_h={hy_h}\thybrid_rel={hy_t}" if hy_h is not None else ""
            sev = (td.get("incident") or {}).get("level")
            if not sev and isinstance(td.get("reliability_insights"), dict):
                sev = (td["reliability_insights"].get("incident") or {}).get("level")
            sev_s = f"\tSEV={sev}" if sev else ""
            print(
                f"{case.case_id}\t{result.model_name}\trel={td.get('reliability_score')}\t"
                f"risk={td.get('hallucination_risk')}\tft={td.get('failure_type')}\t"
                f"cgge_u={cg.get('unsupported_ratio')}\tfr={td.get('failure_reason')!r}"
                f"{hy_s}{sev_s}",
                file=sys.stderr,
            )

        if out_path:
            with out_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

    if args.summary and cgge_rows:
        from evaluation.runners.utils.trace_metrics import aggregate_eval_rows, format_summary_line

        agg = aggregate_eval_rows(cgge_rows)
        print(format_summary_line("squad_v2 summary", agg), file=sys.stderr)
        if args.write_summary_json:
            args.write_summary_json.parent.mkdir(parents=True, exist_ok=True)
            args.write_summary_json.write_text(
                json.dumps({"experiment": args.experiment, "aggregate": agg}, indent=2),
                encoding="utf-8",
            )
            print(f"[squad_v2] wrote {args.write_summary_json}", file=sys.stderr)
    elif args.summary and not cgge_rows:
        print("\n[squad_v2 summary] no TraceDog rows (dry-run or all LLM errors?)", file=sys.stderr)


if __name__ == "__main__":
    main()
