from typing import Any

from pydantic import BaseModel


class AdminJobEnqueueResponse(BaseModel):
    job_id: str


class AdminJobStatusResponse(BaseModel):
    job_id: str
    kind: str
    status: str
    result: dict[str, Any] | None = None
    error: str | None = None
