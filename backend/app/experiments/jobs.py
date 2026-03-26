from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from app.reliability.scorer import score_trace
from app.schemas.trace import RetrievedDoc, TraceCreate


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass
class JobRecord:
    job_id: str
    kind: str
    status: JobStatus
    result: dict[str, Any] | None = None
    error: str | None = None


_jobs: dict[str, JobRecord] = {}
_lock = asyncio.Lock()


def clear_job_store_for_tests() -> None:
    """Reset in-memory jobs (pytest / dev only)."""
    _jobs.clear()


async def get_job(job_id: str) -> JobRecord | None:
    async with _lock:
        return _jobs.get(job_id)


def _smoke_payload() -> TraceCreate:
    return TraceCreate(
        agent_name="admin-smoke",
        environment="admin",
        prompt="What is the capital of France?",
        response="Paris is the capital of France.",
        model_name="smoke-test",
        latency_ms=1,
        retrieved_docs=[
            RetrievedDoc(
                doc_id="src1",
                content="Paris is the capital and largest city of France.",
                similarity_score=0.9,
            ),
        ],
        ingest_metadata={"experiment": "dashboard-smoke-score"},
    )


async def _run_smoke_score(job_id: str) -> None:
    try:
        async with _lock:
            rec = _jobs.get(job_id)
            if rec is None:
                return
            rec.status = JobStatus.RUNNING
        payload = _smoke_payload()
        loop = asyncio.get_running_loop()
        scored = await loop.run_in_executor(None, score_trace, payload)
        async with _lock:
            rec = _jobs.get(job_id)
            if rec is None:
                return
            rec.status = JobStatus.SUCCEEDED
            rec.result = {
                "experiment": "smoke-score",
                "grounding_score": scored.grounding_score,
                "hallucination_risk": scored.hallucination_risk,
                "reliability_score": scored.reliability_score,
                "failure_type": scored.failure_type,
            }
    except Exception as e:
        async with _lock:
            rec = _jobs.get(job_id)
            if rec is None:
                return
            rec.status = JobStatus.FAILED
            rec.error = str(e)


async def enqueue_smoke_score() -> str:
    job_id = uuid.uuid4().hex
    async with _lock:
        _jobs[job_id] = JobRecord(
            job_id=job_id,
            kind="smoke-score",
            status=JobStatus.QUEUED,
        )
    asyncio.create_task(_run_smoke_score(job_id))
    return job_id
