from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracedog:tracedog@localhost:5432/tracedog"
    debug: bool = False

    # tfidf | sentence_transformers | auto (try ST, else tfidf)
    similarity_backend: str = "tfidf"
    sentence_transformer_model: str = "all-MiniLM-L6-v2"


settings = Settings()
