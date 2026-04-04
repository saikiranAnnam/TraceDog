"use client";

import type { DocsSectionContent, DocsBlock } from "@/lib/docs-content";

type Props = {
  sections: DocsSectionContent[];
};

function renderBlock(block: DocsBlock, key: string) {
  if (block.type === "subheading") {
    return (
      <h3 key={key} className="docs-h3">
        {block.text}
      </h3>
    );
  }
  if (block.type === "paragraph") {
    return (
      <p key={key} className="docs-p">
        {block.text}
      </p>
    );
  }
  if (block.type === "bullets") {
    return (
      <ul key={key} className="docs-callout-list">
        {block.items.map((item, i) => (
          <li key={`${key}-${i}`}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === "steps") {
    return (
      <ol key={key} className="docs-steps">
        {block.items.map((item, i) => (
          <li key={`${key}-${i}`}>{item}</li>
        ))}
      </ol>
    );
  }
  if (block.type === "cards") {
    return (
      <div key={key}>
        {block.title ? <p className="docs-callout-title">{block.title}</p> : null}
        <div style={{ display: "grid", gap: "0.65rem", marginTop: block.title ? "0.5rem" : 0 }}>
          {block.items.map((item, i) => (
            <div key={`${key}-${i}`} className="docs-callout">
              <p className="docs-callout-title">{item.title}</p>
              <p className="docs-p">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (block.type === "callout") {
    const cls = block.variant === "insight" ? "docs-callout docs-callout--insight" : "docs-callout";
    return (
      <div key={key} className={cls}>
        <p className="docs-callout-title">{block.title}</p>
        {block.text ? <p className="docs-p">{block.text}</p> : null}
        {block.items?.length ? (
          <ul className="docs-callout-list">
            {block.items.map((item, i) => (
              <li key={`${key}-${i}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (block.type === "endpoints") {
    return (
      <div key={key}>
        {block.items.map((ep, i) => (
          <div key={`${key}-${i}`} className="docs-endpoint">
            <span className="docs-method">{ep.method}</span>
            <code className="docs-endpoint-path">{ep.path}</code>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "flow") {
    return (
      <div key={key} className="docs-flow docs-flow--hero" aria-hidden>
        <div className="docs-flow-track">
          {block.nodes.map((node, i) => (
            <span key={`${key}-${i}`}>
              <span className="docs-flow-node">{node}</span>
              {i < block.nodes.length - 1 ? <span className="docs-flow-arrow">→</span> : null}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (block.type === "code") {
    return (
      <div key={key}>
        {block.title ? <h3 className="docs-h3">{block.title}</h3> : null}
        <pre className="docs-live-json docs-live-json--mini">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }
  return null;
}

export function DocsJsonSections({ sections }: Props) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="docs-section" data-doc-section>
          {section.eyebrow ? <p className="docs-eyebrow">{section.eyebrow}</p> : null}
          {section.eyebrow ? (
            <h1 className="docs-h1">{section.title}</h1>
          ) : (
            <h2 className="docs-h2">{section.title}</h2>
          )}
          {section.lead ? <p className="docs-lead">{section.lead}</p> : null}
          {section.blocks.map((block, i) => renderBlock(block, `${section.id}-${i}`))}
        </section>
      ))}
    </>
  );
}

