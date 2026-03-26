from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracedog:tracedog@localhost:5432/tracedog"
    debug: bool = False

    # tfidf | sentence_transformers | auto (try ST, else tfidf)
    similarity_backend: str = "tfidf"
    sentence_transformer_model: str = "all-MiniLM-L6-v2"

    # Bearer token for POST /api/v1/admin/... (dashboard forwards the same header).
    admin_api_key: str | None = Field(default=None, validation_alias="ADMIN_API_KEY")
    cors_allow_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        validation_alias="CORS_ALLOW_ORIGINS",
    )

    @field_validator("admin_api_key", mode="before")
    @classmethod
    def admin_key_blank_is_none(cls, v: object) -> str | None:
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return str(v).strip()

    # Render/Postgres usually provides DATABASE_URL as `postgres://...` (or `postgresql://...`)
    # Without an explicit driver, SQLAlchemy defaults to the `psycopg2` dialect, which
    # requires `psycopg2` to be installed. We use `psycopg` (psycopg3) instead.
    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not isinstance(v, str):
            return v

        v = v.strip()
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql+psycopg2://"):
            return v.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        return v


settings = Settings()
