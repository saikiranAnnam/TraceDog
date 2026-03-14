from sqlalchemy.orm import Session

from app.models.agent import Agent


def get_or_create_agent(db: Session, name: str, environment: str) -> Agent:
    agent = db.query(Agent).filter_by(name=name, environment=environment).first()
    if agent:
        return agent
    agent = Agent(name=name, environment=environment)
    db.add(agent)
    db.flush()
    return agent
