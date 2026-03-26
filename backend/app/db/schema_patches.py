"""
Add columns introduced after the first deploy. SQLAlchemy create_all() does not
ALTER existing tables, so Docker volumes / old Postgres need these patches.
"""

from __future__ import annotations

import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def apply_schema_patches(engine: Engine) -> None:
    dialect = engine.dialect.name
    insp = inspect(engine)

    with engine.begin() as conn:
        if insp.has_table("reliability_results"):
            cols = {c["name"] for c in insp.get_columns("reliability_results")}
            if "explanation" not in cols:
                logger.info("Applying schema patch: reliability_results.explanation")
                conn.execute(
                    text("ALTER TABLE reliability_results ADD COLUMN explanation TEXT")
                )

        if insp.has_table("retrieved_documents"):
            cols = {c["name"] for c in insp.get_columns("retrieved_documents")}
            if "similarity_score" not in cols:
                logger.info("Applying schema patch: retrieved_documents.similarity_score")
                sql_type = "DOUBLE PRECISION" if dialect == "postgresql" else "FLOAT"
                conn.execute(
                    text(
                        f"ALTER TABLE retrieved_documents ADD COLUMN similarity_score {sql_type}"
                    )
                )

        if insp.has_table("traces"):
            cols = {c["name"] for c in insp.get_columns("traces")}
            if "ingest_metadata" not in cols:
                logger.info("Applying schema patch: traces.ingest_metadata")
                if dialect == "postgresql":
                    conn.execute(
                        text("ALTER TABLE traces ADD COLUMN ingest_metadata JSONB")
                    )
                else:
                    conn.execute(text("ALTER TABLE traces ADD COLUMN ingest_metadata JSON"))
