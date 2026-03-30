"""trace_metrics helpers for eval runners."""

from evaluation.runners.utils.trace_metrics import aggregate_eval_rows, extract_tracedog_metrics


def test_extract_from_sample_response():
    td = {
        "trace_id": "t1",
        "reliability_score": 0.8,
        "hallucination_risk": 0.2,
        "grounding_score": 0.7,
        "failure_type": None,
        "failure_reason": None,
        "claim_grounding": {
            "claims": [{"claim_text": "x", "label": "supported"}],
            "response_groundedness": 0.9,
            "unsupported_ratio": 0.1,
        },
        "grounding_layers": {
            "chunk_level": {"max_chunk_similarity": 0.8},
            "claim_level": {"label_counts": {"supported": 1}},
        },
        "reliability_insights": {
            "hybrid_hallucination": {
                "aggregates": {
                    "answer_hallucination_score": 0.25,
                    "trace_reliability_score": 0.75,
                    "mean_claim_risk": 0.25,
                    "hallucination_type_distribution": {"low": 1, "medium": 0, "high": 0},
                }
            },
            "causal_rca": {"root_cause_primary": "unsupported_synthesis"},
            "repair_loop": {"steps": [{"action": "REWRITE_SPAN"}]},
            "incident": {
                "level": "SEV-3",
                "recommended_action": "log_and_eval_report",
                "matched_rules": ["risk_band_medium"],
                "signals": {},
                "time_to_resolve_target_sla": "best_effort_offline",
                "root_cause_label": "x",
            },
        },
    }
    m = extract_tracedog_metrics(td)
    assert m["hybrid_answer_hallucination"] == 0.25
    assert m["hybrid_trace_reliability"] == 0.75
    assert m["rca_primary"] == "unsupported_synthesis"
    assert m["repair_steps_count"] == 1
    assert m["incident_level"] == "SEV-3"
    assert m["incident_action"] == "log_and_eval_report"


def test_aggregate_two_rows():
    rows = [
        {
            "grounding_score": 0.5,
            "cgge_response_groundedness": 0.6,
            "cgge_unsupported_ratio": 0.2,
            "cgge_claim_count": 2,
            "hybrid_answer_hallucination": 0.4,
            "hybrid_trace_reliability": 0.6,
            "incident_level": "SEV-2",
        },
        {
            "grounding_score": 0.7,
            "cgge_response_groundedness": 0.8,
            "cgge_unsupported_ratio": 0.1,
            "cgge_claim_count": 3,
            "hybrid_answer_hallucination": 0.3,
            "hybrid_trace_reliability": 0.7,
            "incident_level": "SEV-2",
        },
    ]
    agg = aggregate_eval_rows(rows)
    assert agg["n"] == 2
    assert abs(agg["avg_chunk_grounding"] - 0.6) < 1e-6
    assert abs(agg["avg_hybrid_answer_hallucination"] - 0.35) < 1e-6
    assert agg["incident_severity_counts"] == {"SEV-2": 2}
