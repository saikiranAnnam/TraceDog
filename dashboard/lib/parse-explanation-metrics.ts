/**
 * Pull numeric breakdowns from backend `_metrics_block` explanation text.
 */
export type ParsedExplanationMetrics = {
  hybridBest: number | null;
  sentence: number | null;
  keyword: number | null;
  shortAnswerBlend: boolean;
};

export function parseExplanationMetrics(
  text: string | null | undefined
): ParsedExplanationMetrics | null {
  if (!text?.trim()) return null;
  const hybridM = text.match(
    /Hybrid grounding \(per chunk\):\s*best\s+([\d.]+)/im
  );
  const sentenceM = text.match(/Best raw sentence match:\s*([\d.]+)/i);
  const keywordM = text.match(/Lexical overlap with sources:\s*([\d.]+)/i);
  const shortBlend = /short-answer blend/i.test(text);

  const hybridBest = hybridM ? parseFloat(hybridM[1]) : null;
  const sentence = sentenceM ? parseFloat(sentenceM[1]) : null;
  const keyword = keywordM ? parseFloat(keywordM[1]) : null;

  if (
    hybridBest == null &&
    sentence == null &&
    keyword == null
  ) {
    return null;
  }

  return {
    hybridBest: Number.isFinite(hybridBest ?? NaN) ? hybridBest : null,
    sentence: Number.isFinite(sentence ?? NaN) ? sentence : null,
    keyword: Number.isFinite(keyword ?? NaN) ? keyword : null,
    shortAnswerBlend: shortBlend,
  };
}

/** First narrative paragraph before structured "What we measured" block. */
export function explanationLeadParagraph(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  const lower = text.toLowerCase();
  const cut = lower.indexOf("what we measured");
  const slice = cut >= 0 ? text.slice(0, cut) : text;
  const para = slice.split(/\n\n+/)[0]?.trim() ?? "";
  return para.replace(/\s+/g, " ");
}
