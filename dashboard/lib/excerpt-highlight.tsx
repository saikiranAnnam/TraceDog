import { Fragment, type ReactNode } from "react";

/** Short excerpt from doc (first ~380 chars at word boundary). */
export function docExcerpt(content: string, maxLen = 380): string {
  const t = content.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const sp = cut.lastIndexOf(" ");
  return (sp > 80 ? cut.slice(0, sp) : cut) + "…";
}

/**
 * Highlight response tokens that appear in excerpt (simple substring match).
 */
export function highlightExcerpt(excerpt: string, response: string): ReactNode {
  const words = Array.from(
    new Set(
      response
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4)
        .slice(0, 12)
    )
  );
  if (words.length === 0) return excerpt;

  let remaining = excerpt;
  const parts: ReactNode[] = [];
  let key = 0;

  while (remaining.length > 0) {
    let bestIdx = -1;
    let bestLen = 0;
    let bestWord = "";
    for (const w of words) {
      const idx = remaining.toLowerCase().indexOf(w);
      if (idx >= 0 && w.length > bestLen) {
        bestIdx = idx;
        bestLen = w.length;
        bestWord = w;
      }
    }
    if (bestIdx < 0) {
      parts.push(remaining);
      break;
    }
    if (bestIdx > 0) {
      parts.push(remaining.slice(0, bestIdx));
    }
    const raw = remaining.slice(bestIdx, bestIdx + bestLen);
    parts.push(
      <mark key={key++} className="tdv-mark">
        {raw}
      </mark>
    );
    remaining = remaining.slice(bestIdx + bestLen);
  }

  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
