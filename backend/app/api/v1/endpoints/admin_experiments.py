from fastapi import APIRouter, Depends, HTTPException

from app.api.admin_security import require_admin
from app.experiments.jobs import enqueue_smoke_score, get_job
from app.schemas.admin_job import AdminJobEnqueueResponse, AdminJobStatusResponse

router = APIRouter()


@router.post(
    "/experiments/smoke-score/run",
    response_model=AdminJobEnqueueResponse,
    dependencies=[Depends(require_admin)],
)
async def enqueue_smoke_score_job() -> AdminJobEnqueueResponse:
    job_id = await enqueue_smoke_score()
    return AdminJobEnqueueResponse(job_id=job_id)


@router.get(
    "/experiments/jobs/{job_id}",
    response_model=AdminJobStatusResponse,
    dependencies=[Depends(require_admin)],
)
async def get_experiment_job(job_id: str) -> AdminJobStatusResponse:
    rec = await get_job(job_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return AdminJobStatusResponse(
        job_id=rec.job_id,
        kind=rec.kind,
        status=rec.status.value,
        result=rec.result,
        error=rec.error,
    )
