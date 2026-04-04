import rawDocs from "@/content/developer-docs.json";

export type DocsEndpoint = { method: string; path: string };

export type DocsBlock =
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "cards"; title?: string; items: { title: string; text: string }[] }
  | { type: "callout"; title: string; text?: string; items?: string[]; variant?: "insight" | "default" }
  | { type: "endpoints"; items: DocsEndpoint[] }
  | { type: "flow"; nodes: string[] }
  | { type: "code"; title?: string; code: string };

export type DocsSectionContent = {
  id: string;
  title?: string;
  lead?: string;
  eyebrow?: string;
  blocks: DocsBlock[];
};

type DocsContentFile = {
  sections: DocsSectionContent[];
};

export const developerDocsContent: DocsContentFile = rawDocs as DocsContentFile;

