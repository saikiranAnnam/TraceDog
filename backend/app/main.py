from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    init_db()
    yield


app = FastAPI(title="TraceDog API", version="0.1.0", lifespan=lifespan)
_cors_origins = [
    o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root() -> dict:
    return {"service": "tracedog", "docs": "/docs"}
