import type { QualityTier } from "./trace-quality";
import { THRESHOLD_STRONG, THRESHOLD_WEAK } from "./trace-quality";

export function verdictPillLabel(tier: QualityTier): string {
  switch (tier) {
    case "good":
      return "Looks grounded";
    case "medium":
      return "Needs review";
    case "bad":
      return "Unsupported";
  }
}

export function heroOneLiner(
  tier: QualityTier,
  grounding: number | null,
  failure: string | null
): string {
  if (tier === "good" && grounding != null && grounding >= THRESHOLD_STRONG) {
    return "Evidence aligns well with the response.";
  }
  if (tier === "good" && grounding != null) {
    return "Grounding meets the strong threshold; spot-check for critical use.";
  }
  if (tier === "medium") {
    return "Grounding is borderline and should be reviewed.";
  }
  if (failure === "no_retrieval" || failure === "weak_retrieval") {
    return "Retrieval did not surface enough evidence to ground this answer.";
  }
  if (failure === "contradiction") {
    return "The answer may conflict with retrieved evidence.";
  }
  return "This trace shows elevated risk; inspect evidence before relying on the output.";
}

export function recommendedAction(tier: QualityTier, failure: string | null): string {
  if (tier === "good") return "Safe to use as signal";
  if (failure === "no_retrieval" || failure === "weak_retrieval") {
    return "Fix retrieval, then re-run";
  }
  if (tier === "medium") return "Review retrieved evidence before shipping";
  return "Do not ship without debugging";
}

export function riskLabel(risk: number | null): string {
  if (risk == null) return "—";
  if (risk <= 0.35) return "Low";
  if (risk <= 0.52) return "Medium";
  return "High";
}

export function reliabilityLabel(rel: number | null): string {
  if (rel == null) return "—";
  if (rel >= 0.65) return "High";
  if (rel >= 0.48) return "Medium";
  return "Low";
}

export function groundingStrengthLabel(g: number | null): string {
  if (g == null) return "—";
  if (g >= THRESHOLD_STRONG) return "Strong";
  if (g >= THRESHOLD_WEAK) return "Review";
  return "Weak";
}

export function whySectionTitle(tier: QualityTier): string {
  if (tier === "good") return "Why this scored as grounded";
  if (tier === "medium") return "Why this needs review";
  return "Why this is unsupported";
}

export function shortWhyParagraph(
  tier: QualityTier,
  lead: string,
  g: number | null,
  sentence: number | null,
  keyword: number | null
): string {
  if (lead.length > 40 && lead.length < 420) {
    return lead;
  }
  if (tier === "good") {
    const s = sentence != null ? sentence.toFixed(2) : "—";
    const k = keyword != null ? keyword.toFixed(2) : "—";
    const gs = g != null ? g.toFixed(2) : "—";
    return `The response is supported by retrieved evidence, with strong keyword overlap and sentence alignment (best grounding ${gs}, sentence ${s}, keyword ${k}).`;
  }
  if (tier === "medium") {
    return "Scores sit near the decision boundary — confirm alignment with the evidence panel before trusting this output.";
  }
  return "Risk signals or weak retrieval mean this answer should not be treated as verified against sources.";
}

export function responseSupportNote(tier: QualityTier): string {
  if (tier === "good") return "Response appears consistent with retrieved evidence.";
  if (tier === "medium") return "Mixed support — verify claims against sources.";
  return "Elevated risk — treat output as unverified.";
}
