from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.agent import Agent


class Trace(Base):
    __tablename__ = "traces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="processed")
    ingest_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    agent: Mapped[Agent] = relationship(back_populates="traces")
    reliability_result: Mapped[Any] = relationship(
        "ReliabilityResult", back_populates="trace", uselist=False
    )
    retrieved_documents: Mapped[list[Any]] = relationship(
        "RetrievedDocument",
        back_populates="trace",
        cascade="all, delete-orphan",
        order_by="RetrievedDocument.position",
    )
    spans: Mapped[list[Any]] = relationship(
        "TraceSpan",
        back_populates="trace",
        cascade="all, delete-orphan",
        order_by="TraceSpan.position",
    )
