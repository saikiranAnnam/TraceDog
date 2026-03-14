from app.reliability.heuristics import grounding_from_docs
from app.schemas.trace import TraceCreate


def score_trace(payload: TraceCreate) -> tuple[float, float, float, str | None]:
    """
    high grounding ==> low hallucination risk ==> high reliability score.
    low grounding ==> high hallucination risk ==> low reliability score.
    Returns (grounding_score, hallucination_risk, reliability_score, failure_type).
    """
    contents = [d.content for d in payload.retrieved_docs]
    grounding = grounding_from_docs(payload.response, contents)

    # hallucination risk is the inverse of grounding.
    hallucination_risk = round(1.0 - grounding, 4)

    # reliability score is a weighted average of grounding and hallucination risk.
    reliability = round(0.7 * grounding + 0.3 * (1.0 if contents else 0.2), 4)
    failure = None
    
    if grounding < 0.25 and contents:
        failure = "possible_hallucination"
    elif not contents:
        failure = "no_retrieval_context"

    return round(grounding, 4), hallucination_risk, reliability, failure
