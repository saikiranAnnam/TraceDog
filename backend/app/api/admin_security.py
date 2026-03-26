from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer = HTTPBearer(auto_error=False)


def require_admin(
    creds: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> None:
    if not settings.admin_api_key:
        raise HTTPException(
            status_code=503,
            detail="Admin experiments are disabled (set ADMIN_API_KEY on the API).",
        )
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization bearer token.",
        )
    if creds.credentials != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid admin credentials.")
