"""Evaluation run lineage for reproducibility and TraceDog ingest metadata."""

from __future__ import annotations

import os
import platform
import subprocess
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from evaluation.sources.types import SourceDescriptor


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _git_head() -> str | None:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=_repo_root(),
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if r.returncode == 0:
            return (r.stdout or "").strip() or None
    except (OSError, subprocess.TimeoutExpired):
        pass
    return None


@dataclass
class EvalRunLineage:
    """Bundle to embed under ``ingest_metadata`` (and offline JSONL)."""

    prompt_version: str
    adapter_id: str
    scoring_version: str
    runner_name: str
    llm_model: str | None = None
    llm_provider: str | None = None
    git_commit: str | None = None
    timestamp_utc: str | None = None
    python_version: str | None = None
    platform_info: str | None = None
    source_descriptor: dict[str, Any] | None = None
    pipeline_stats: dict[str, Any] | None = None
    run_id: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    def as_ingest_fragment(self) -> dict[str, Any]:
        """Nested blob suitable for ``ingest_metadata['eval_lineage']``."""
        d = asdict(self)
        d.pop("extra", None)
        out = {k: v for k, v in d.items() if v is not None}
        if self.extra:
            out["extra"] = dict(self.extra)
        return out


def collect_lineage(
    *,
    runner_name: str,
    adapter_id: str,
    prompt_version: str = "prompt_builder_v1",
    scoring_version: str = "tracedog_cgge_v1",
    llm_model: str | None = None,
    llm_provider: str | None = None,
    source_descriptor: SourceDescriptor | None = None,
    pipeline_stats: dict[str, Any] | None = None,
    run_id: str | None = None,
    extra: dict[str, Any] | None = None,
) -> EvalRunLineage:
    desc_dict = None
    if source_descriptor is not None:
        desc_dict = asdict(source_descriptor)
    return EvalRunLineage(
        prompt_version=prompt_version,
        adapter_id=adapter_id,
        scoring_version=scoring_version,
        runner_name=runner_name,
        llm_model=llm_model,
        llm_provider=llm_provider,
        git_commit=os.environ.get("TRACE_EVAL_GIT_SHA") or _git_head(),
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        python_version=platform.python_version(),
        platform_info=f"{platform.system()} {platform.release()}",
        source_descriptor=desc_dict,
        pipeline_stats=dict(pipeline_stats) if pipeline_stats else None,
        run_id=run_id,
        extra=dict(extra) if extra else {},
    )
