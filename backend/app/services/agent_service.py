from sqlalchemy.orm import Session

from app.repositories import agent_repository


def get_or_create_agent(db: Session, name: str, environment: str):
    return agent_repository.get_or_create_agent(db, name, environment)
