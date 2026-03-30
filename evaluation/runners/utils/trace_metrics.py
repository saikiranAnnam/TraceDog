"""
Extract chunk / CGGE / hybrid (`reliability_insights`) scalars from TraceDog POST responses.

Used by eval runners for per-row JSONL and aggregate summaries.
"""

from __future__ import annotations

from typing import Any


def extract_tracedog_metrics(td: dict[str, Any]) -> dict[str, Any]:
    """Flatten useful fields from one `POST /api/v1/traces` JSON body."""
    cg = td.get("claim_grounding") or {}
    claims = cg.get("claims") or []
    gl = td.get("grounding_layers") or {}
    cl = gl.get("claim_level") or {}
    ch = gl.get("chunk_level") or {}

    ri = td.get("reliability_insights") or {}
    inc = ri.get("incident") if isinstance(ri.get("incident"), dict) else {}
    _inc_top = td.get("incident")
    inc_top = _inc_top if isinstance(_inc_top, dict) else {}
    hybrid = ri.get("hybrid_hallucination") or {}
    agg = hybrid.get("aggregates") or {}
    rca = ri.get("causal_rca") or {}

    out: dict[str, Any] = {
        "trace_id": td.get("trace_id"),
        "reliability_score": td.get("reliability_score"),
        "hallucination_risk": td.get("hallucination_risk"),
        "grounding_score": td.get("grounding_score"),
        "failure_type": td.get("failure_type"),
        "failure_reason": td.get("failure_reason"),
        "cgge_response_groundedness": cg.get("response_groundedness"),
        "cgge_unsupported_ratio": cg.get("unsupported_ratio"),
        "cgge_claim_count": len(claims),
        "chunk_max_similarity": ch.get("max_chunk_similarity"),
        "cgge_label_counts": cl.get("label_counts"),
        # Phase 1–3 bundle (may be absent on older backends)
        "hybrid_answer_hallucination": agg.get("answer_hallucination_score"),
        "hybrid_trace_reliability": agg.get("trace_reliability_score"),
        "hybrid_mean_claim_risk": agg.get("mean_claim_risk"),
        "hybrid_risk_band_counts": agg.get("hallucination_type_distribution"),
        "rca_primary": rca.get("root_cause_primary"),
        "rca_secondary": rca.get("root_cause_secondary"),
        "repair_steps_count": len((ri.get("repair_loop") or {}).get("steps") or []),
        "incident_level": inc.get("level") or inc_top.get("level"),
        "incident_action": inc.get("recommended_action") or inc_top.get("recommended_action"),
    }
    return out


def aggregate_eval_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Mean aggregates for summary printing. Rows are typically `extract_tracedog_metrics`
    outputs or JSONL dicts that include the same keys.
    """
    if not rows:
        return {}

    def mean(key: str) -> float | None:
        vals = [r[key] for r in rows if r.get(key) is not None]
        if not vals:
            return None
        return sum(float(v) for v in vals) / len(vals)

    # Sum risk bands across traces (when present)
    band_totals: dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for r in rows:
        dist = r.get("hybrid_risk_band_counts")
        if isinstance(dist, dict):
            for k in band_totals:
                band_totals[k] += int(dist.get(k) or 0)

    sev_counts: dict[str, int] = {}
    for r in rows:
        lv = r.get("incident_level")
        if isinstance(lv, str) and lv:
            sev_counts[lv] = sev_counts.get(lv, 0) + 1

    out = {
        "n": len(rows),
        "avg_chunk_grounding": mean("grounding_score"),
        "avg_cgge_response_groundedness": mean("cgge_response_groundedness"),
        "avg_cgge_unsupported_ratio": mean("cgge_unsupported_ratio"),
        "avg_claims_per_answer": mean("cgge_claim_count"),
        "avg_hybrid_answer_hallucination": mean("hybrid_answer_hallucination"),
        "avg_hybrid_trace_reliability": mean("hybrid_trace_reliability"),
        "hybrid_risk_band_totals": band_totals if any(band_totals.values()) else None,
        "incident_severity_counts": sev_counts if sev_counts else None,
    }
    return out


def format_summary_line(prefix: str, agg: dict[str, Any], *, extra_suffix: str = "") -> str:
    """Human-readable one-line summary for stderr."""
    n = agg.get("n") or 0
    if not n:
        return f"\n[{prefix}] n=0 (no rows)"
    parts: list[str] = [f"n={n}"]
    if agg.get("avg_chunk_grounding") is not None:
        parts.append(f"avg_chunk_grounding={agg['avg_chunk_grounding']:.3f}")
    else:
        parts.append("avg_chunk_grounding=n/a")
    if agg.get("avg_cgge_response_groundedness") is not None:
        parts.append(f"avg_cgge_response_groundedness={agg['avg_cgge_response_groundedness']:.3f}")
    else:
        parts.append("avg_cgge_response_groundedness=n/a")
    if agg.get("avg_cgge_unsupported_ratio") is not None:
        parts.append(f"avg_cgge_unsupported_ratio={agg['avg_cgge_unsupported_ratio']:.3f}")
    else:
        parts.append("avg_cgge_unsupported_ratio=n/a")
    if agg.get("avg_claims_per_answer") is not None:
        parts.append(f"avg_claims_per_answer={agg['avg_claims_per_answer']:.2f}")
    else:
        parts.append("avg_claims_per_answer=n/a")
    if agg.get("avg_hybrid_answer_hallucination") is not None:
        parts.append(f"avg_hybrid_answer_hallucination={agg['avg_hybrid_answer_hallucination']:.3f}")
    else:
        parts.append("avg_hybrid_answer_hallucination=n/a")
    if agg.get("avg_hybrid_trace_reliability") is not None:
        parts.append(f"avg_hybrid_trace_reliability={agg['avg_hybrid_trace_reliability']:.3f}")
    else:
        parts.append("avg_hybrid_trace_reliability=n/a")
    sev = agg.get("incident_severity_counts")
    if isinstance(sev, dict) and sev:
        ordered = " ".join(f"{k}:{sev[k]}" for k in sorted(sev.keys()))
        parts.append(f"SEV[{ordered}]")
    return f"\n[{prefix}] " + "  ".join(parts) + extra_suffix
