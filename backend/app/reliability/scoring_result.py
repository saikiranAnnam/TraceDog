from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScoringResult:
    grounding_score: float
    hallucination_risk: float
    reliability_score: float
    failure_type: str | None
    explanation: str
    per_doc_similarity: list[float]
