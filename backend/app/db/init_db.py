import app.models  # noqa: F401
from app.db.base import Base
from app.db.schema_patches import apply_schema_patches
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    apply_schema_patches(engine)
