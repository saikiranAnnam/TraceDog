from fastapi import APIRouter

from app.api.v1.endpoints import admin_experiments, health, traces

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(traces.router, prefix="/traces", tags=["traces"])
api_router.include_router(admin_experiments.router, prefix="/admin", tags=["admin"])
