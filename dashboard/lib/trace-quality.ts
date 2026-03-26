import type { TraceDetail } from "./types";

/** Keep in sync with backend `T_STRONG` / `T_WEAK` in `app/reliability/scorer.py` */
export const THRESHOLD_STRONG = 0.52;
export const THRESHOLD_WEAK = 0.35;

export type QualityTier = "good" | "medium" | "bad";

export function qualityTier(t: TraceDetail): QualityTier {
  const f = t.failure_type;
  if (f === "contradiction" || f === "no_retrieval") return "bad";
  if (
    f === "weak_grounding" ||
    f === "weak_retrieval" ||
    f === "unsupported" ||
    f === "likely_supported_but_short"
  )
    return "medium";

  const rel = t.reliability_score ?? 0;
  const risk = t.hallucination_risk ?? 0;
  if (rel >= 0.62 && risk <= 0.42) return "good";
  if (rel >= 0.45 && risk <= 0.58) return "medium";
  return "bad";
}

export function tierLabel(tier: QualityTier): string {
  switch (tier) {
    case "good":
      return "Looks grounded";
    case "medium":
      return "Needs review";
    case "bad":
      return "High risk";
  }
}

export function docSimilarityTier(sim: number): QualityTier {
  if (sim >= THRESHOLD_STRONG) return "good";
  if (sim >= THRESHOLD_WEAK) return "medium";
  return "bad";
}

/** Match backend `similarity.py` short-answer heuristic for UI caveat. */
const SHORT_ANSWER_MAX_WORDS = 5;
const SHORT_ANSWER_MAX_CHARS = 48;

export function isShortAnswerResponse(response: string): boolean {
  const r = response.trim();
  if (!r) return false;
  return (
    r.split(/\s+/).filter(Boolean).length <= SHORT_ANSWER_MAX_WORDS ||
    r.length <= SHORT_ANSWER_MAX_CHARS
  );
}
