import React from "react";

/**
 * Renders scorer explanations: paragraphs + titled sections with • bullets.
 */
export function ExplanationBody({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="trace-why-body">
      {blocks.map((block, i) => (
        <ExplanationBlock key={i} block={block} isFirst={i === 0} />
      ))}
    </div>
  );
}

function ExplanationBlock({
  block,
  isFirst,
}: {
  block: string;
  isFirst: boolean;
}) {
  const lines = block.split("\n").map((l) => l.trimEnd());
  const bulletIdx = lines.findIndex((l) => l.trim().startsWith("•"));

  if (bulletIdx === -1) {
    return (
      <p className={isFirst ? "trace-why-lead" : "trace-why-para"}>{block}</p>
    );
  }

  const titleLines = lines.slice(0, bulletIdx).join(" ").trim();
  const bullets = lines
    .slice(bulletIdx)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("•"));

  return (
    <div className="trace-why-section">
      {titleLines ? <h4 className="trace-why-heading">{titleLines}</h4> : null}
      <ul className="trace-why-list">
        {bullets.map((b, j) => (
          <li key={j}>{b.replace(/^•\s*/, "")}</li>
        ))}
      </ul>
    </div>
  );
}
