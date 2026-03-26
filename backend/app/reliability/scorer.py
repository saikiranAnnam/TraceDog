from __future__ import annotations

from app.reliability.contradiction import numeric_contradiction_hint
from app.reliability.scoring_result import ScoringResult
from app.reliability.similarity import (
    aggregate_grounding,
    compute_per_doc_breakdowns,
    is_short_answer,
)
from app.schemas.trace import TraceCreate

# Tunable thresholds (v1) — align dashboard badge breakpoints in `dashboard/lib/trace-quality.ts`
T_WEAK = 0.35
T_STRONG = 0.52
T_CONTRADICTION_SIM = 0.38
T_SHORT_ANSWER_KEYWORD = 0.85


def _metrics_block(
    max_hybrid: float,
    mean_hybrid: float,
    max_sentence: float,
    max_keyword: float,
    short_answer: bool,
) -> str:
    blend = "short-answer blend (45% sentence + 55% keyword)" if short_answer else (
        "standard blend (70% best-sentence + 30% keyword)"
    )
    return (
        "What we measured\n"
        f"• Hybrid grounding (per chunk): best {max_hybrid:.2f} (strong ≥ {T_STRONG:.2f})\n"
        f"• Mean hybrid across chunks: {mean_hybrid:.2f}\n"
        f"• Best raw sentence match: {max_sentence:.2f} "
        f"(short answers often score low vs. whole paragraphs)\n"
        f"• Lexical overlap with sources: {max_keyword:.2f}\n"
        f"• Blend: {blend}\n"
        f"• Weak / strong cutoffs: {T_WEAK:.2f} / {T_STRONG:.2f}"
    )


def score_trace(payload: TraceCreate) -> ScoringResult:
    response = (payload.response or "").strip()
    contents = [d.content for d in payload.retrieved_docs]

    if not contents:
        return ScoringResult(
            grounding_score=0.0,
            hallucination_risk=1.0,
            reliability_score=0.2,
            failure_type="no_retrieval",
            explanation=(
                "No retrieved documents were provided, so the response could not be "
                "grounded against sources.\n\n"
                "What to do\n"
                "• Pass retrieved_docs from your RAG / search step when ingesting traces.\n"
                "• Without sources, TraceDog cannot score grounding or contradiction."
            ),
            per_doc_similarity=[],
        )

    if not response:
        breakdowns = compute_per_doc_breakdowns("", contents)
        per_doc = [b.hybrid for b in breakdowns]
        g = aggregate_grounding(per_doc)
        max_h = max(per_doc) if per_doc else 0.0
        mean_h = sum(per_doc) / len(per_doc) if per_doc else 0.0
        max_s = max(b.best_sentence for b in breakdowns) if breakdowns else 0.0
        max_k = max(b.keyword for b in breakdowns) if breakdowns else 0.0
        return ScoringResult(
            grounding_score=round(g, 4),
            hallucination_risk=round(1.0 - g, 4),
            reliability_score=round(0.55 * g + 0.15, 4),
            failure_type="unsupported",
            explanation=(
                "The model response is empty; nothing to align with retrieved evidence.\n\n"
                + _metrics_block(max_h, mean_h, max_s, max_k, False)
            ),
            per_doc_similarity=per_doc,
        )

    breakdowns = compute_per_doc_breakdowns(payload.response, contents)
    per_doc = [b.hybrid for b in breakdowns]
    max_hybrid = max(per_doc) if per_doc else 0.0
    mean_hybrid = sum(per_doc) / len(per_doc) if per_doc else 0.0
    max_sentence = max(b.best_sentence for b in breakdowns) if breakdowns else 0.0
    max_keyword = max(b.keyword for b in breakdowns) if breakdowns else 0.0

    short = is_short_answer(response)
    grounding = round(aggregate_grounding(per_doc), 4)
    hallucination_risk = round(1.0 - grounding, 4)
    reliability = round(0.6 * max_hybrid + 0.25 * mean_hybrid + 0.15, 4)
    reliability = min(1.0, max(0.0, reliability))

    numeric_hint = numeric_contradiction_hint(payload.response, contents)

    failure: str | None = None
    explanation: str

    if numeric_hint and max_hybrid >= T_CONTRADICTION_SIM:
        failure = "contradiction"
        best_i = int(max(range(len(per_doc)), key=lambda i: per_doc[i]))
        explanation = (
            f"The response appears numerically inconsistent with retrieved document "
            f"'{payload.retrieved_docs[best_i].doc_id}' (best hybrid match {max_hybrid:.2f}).\n\n"
            "What we checked\n"
            "• Compared numbers in the answer vs. numbers appearing in retrieved chunks.\n"
            "• High text similarity can still co‑exist with conflicting facts — treat as a signal, not proof.\n\n"
            + _metrics_block(max_hybrid, mean_hybrid, max_sentence, max_keyword, short)
        )
    elif (
        short
        and max_keyword >= T_SHORT_ANSWER_KEYWORD
        and max_sentence < T_STRONG
        and max_hybrid < T_STRONG
    ):
        failure = "likely_supported_but_short"
        explanation = (
            "Short extractive answer: the response is brief and may be correct even when "
            "sentence-level semantic similarity stays below the “strong” threshold.\n\n"
            "What we did\n"
            "• Scored the answer against the best-matching sentence in each chunk (not only the full paragraph).\n"
            "• Boosted the score using lexical overlap when your answer’s words appear in the sources.\n\n"
            + _metrics_block(max_hybrid, mean_hybrid, max_sentence, max_keyword, short)
        )
    elif max_hybrid < T_WEAK:
        failure = "weak_grounding"
        explanation = (
            f"Retrieved chunks align weakly with the response after answer-aware scoring "
            f"(best hybrid {max_hybrid:.2f} < {T_WEAK:.2f}).\n\n"
            "Likely causes\n"
            "• Retrieval returned irrelevant passages.\n"
            "• The answer uses wording that still does not match any sentence closely.\n\n"
            + _metrics_block(max_hybrid, mean_hybrid, max_sentence, max_keyword, short)
        )
    elif max_hybrid < T_STRONG:
        failure = "unsupported"
        explanation = (
            f"The response is not strongly supported by retrieved evidence "
            f"(best hybrid {max_hybrid:.2f}; strong threshold {T_STRONG:.2f}).\n\n"
            "Next steps\n"
            "• Inspect retrieved docs below — scores blend best-sentence similarity with keyword overlap.\n"
            "• Tighten retrieval or add citations in the agent prompt.\n\n"
            + _metrics_block(max_hybrid, mean_hybrid, max_sentence, max_keyword, short)
        )
    else:
        explanation = (
            f"Retrieved evidence aligns reasonably well with the response "
            f"(best hybrid {max_hybrid:.2f}).\n\n"
            + _metrics_block(max_hybrid, mean_hybrid, max_sentence, max_keyword, short)
        )

    return ScoringResult(
        grounding_score=grounding,
        hallucination_risk=hallucination_risk,
        reliability_score=reliability,
        failure_type=failure,
        explanation=explanation,
        per_doc_similarity=per_doc,
    )
