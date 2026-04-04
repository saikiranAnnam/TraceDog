/** Sidebar structure for developer docs — product tabs switch IA (guides vs API reference). */

export type DocsNavItem = {
  id: string;
  label: string;
  /** If false, show muted “soon” badge */
  ready?: boolean;
  /** Navigate to app route instead of scrolling to #id */
  href?: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

/** Top bar: narrative docs vs API reference (sidebar swaps). */
export type DocsProductTab = "guides" | "api";

/** Guides / tutorials — default “Docs” tab. */
export const DOCS_NAV_GUIDES: DocsNavSection[] = [
  {
    title: "Start here",
    items: [
      { id: "introduction", label: "What is TraceDog?", ready: true },
      { id: "overview", label: "Getting started", ready: true },
      { id: "quickstart", label: "Quickstart", ready: true },
      { id: "use-cases", label: "Use cases", ready: true },
      { id: "how-it-works", label: "System flow", ready: true },
    ],
  },
  {
    title: "Core APIs",
    items: [
      { id: "authentication", label: "Authentication", ready: true },
      { id: "api", label: "API — ingest traces", ready: true },
      { id: "api-reference", label: "API reference", ready: true },
      { id: "claim-graph", label: "Claim graph", ready: true },
      { id: "repair", label: "Repair + reverify", ready: true },
    ],
  },
  {
    title: "Concepts",
    items: [
      { id: "technical-concepts", label: "Technical concepts", ready: true },
      { id: "tracing", label: "Trace schema", ready: true },
      { id: "evaluation", label: "Evaluation + CGGE", ready: true },
      { id: "reliability-scoring", label: "Reliability scoring", ready: true },
      { id: "claim-graph-guide", label: "Claim graph guide", ready: true },
      { id: "architecture", label: "Architecture", ready: true },
      { id: "backend-architecture", label: "Backend architecture", ready: true },
      { id: "data-plane", label: "Data plane (eval)", ready: true },
      { id: "processing-plane", label: "Processing plane", ready: true },
    ],
  },
  {
    title: "Operate",
    items: [
      { id: "experiments", label: "Experiments", ready: true },
      { id: "dashboard-usage", label: "Dashboard usage", ready: true },
      { id: "release-readiness", label: "Release readiness", ready: true },
      { id: "roadmap", label: "Roadmap", ready: true },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "debugging", label: "Debug a trace", ready: true },
      { id: "examples", label: "Examples", ready: true },
      { id: "sdk-python", label: "Python SDK", ready: true },
      { id: "sdks", label: "All SDKs", ready: false },
    ],
  },
];

/** API tab — reference-first sidebar (same #anchors, different grouping). */
export const DOCS_NAV_API: DocsNavSection[] = [
  {
    title: "Endpoints",
    items: [
      { id: "authentication", label: "Authentication", ready: true },
      { id: "api", label: "POST /api/v1/traces", ready: true },
      { id: "api-reference", label: "Full API reference", ready: true },
      { id: "claim-graph", label: "GET claim graph", ready: true },
      { id: "repair", label: "POST repair/*", ready: true },
      { id: "policies", label: "Policies API", ready: true },
    ],
  },
  {
    title: "Models",
    items: [
      { id: "tracing", label: "Trace payload", ready: true },
      { id: "evaluation", label: "CGGE scoring", ready: true },
      { id: "reliability-scoring", label: "Reliability score", ready: true },
      { id: "sdk-python", label: "Python SDK", ready: true },
      { id: "technical-concepts", label: "Core concepts", ready: true },
      { id: "architecture", label: "Architecture", ready: true },
      { id: "backend-architecture", label: "Backend architecture", ready: true },
      { id: "data-plane", label: "Data plane (eval)", ready: true },
      { id: "processing-plane", label: "Processing plane", ready: true },
    ],
  },
  {
    title: "Setup",
    items: [
      { id: "quickstart", label: "Run frontend + API", ready: true },
      { id: "how-it-works", label: "Pipeline overview", ready: true },
      { id: "release-readiness", label: "Release readiness", ready: true },
    ],
  },
];

export function docsNavFor(tab: DocsProductTab): DocsNavSection[] {
  return tab === "api" ? DOCS_NAV_API : DOCS_NAV_GUIDES;
}

export type DocsPaletteEntry = {
  id: string;
  label: string;
  section: string;
  href?: string;
};

/** Single ordered list for scroll spy + ⌘K palette (unique ids). */
export const DOCS_PALETTE_ENTRIES: DocsPaletteEntry[] = [
  { id: "introduction", label: "What is TraceDog?", section: "Start" },
  { id: "overview", label: "Getting started", section: "Start" },
  { id: "quickstart", label: "Quickstart", section: "Start" },
  { id: "use-cases", label: "Use cases", section: "Start" },
  { id: "how-it-works", label: "System flow", section: "Start" },
  { id: "authentication", label: "Authentication", section: "Core APIs" },
  { id: "api", label: "API — ingest traces", section: "Core APIs" },
  { id: "api-reference", label: "API reference", section: "Core APIs" },
  { id: "claim-graph", label: "Claim graph", section: "Core APIs" },
  { id: "repair", label: "Repair + reverify", section: "Core APIs" },
  { id: "technical-concepts", label: "Technical concepts", section: "Concepts" },
  { id: "tracing", label: "Trace schema", section: "Concepts" },
  { id: "evaluation", label: "Evaluation + CGGE", section: "Concepts" },
  { id: "reliability-scoring", label: "Reliability scoring", section: "Concepts" },
  { id: "claim-graph-guide", label: "Claim graph guide", section: "Concepts" },
  { id: "architecture", label: "Architecture", section: "Concepts" },
  { id: "backend-architecture", label: "Backend architecture", section: "Concepts" },
  { id: "data-plane", label: "Data plane (eval)", section: "Concepts" },
  { id: "processing-plane", label: "Processing plane", section: "Concepts" },
  { id: "experiments", label: "Experiments", section: "Operate" },
  { id: "dashboard-usage", label: "Dashboard usage", section: "Operate" },
  { id: "release-readiness", label: "Release readiness", section: "Operate" },
  { id: "roadmap", label: "Roadmap", section: "Operate" },
  { id: "debugging", label: "Debug a trace", section: "Guides" },
  { id: "examples", label: "Examples", section: "Guides" },
  { id: "sdk-python", label: "Python SDK", section: "Guides" },
  { id: "policies", label: "Policies & Guardrails", section: "Guides" },
  { id: "sdks", label: "All SDKs", section: "Guides" },
];

export function flatDocsNavIds(): string[] {
  return DOCS_PALETTE_ENTRIES.filter((e) => !e.href).map((e) => e.id);
}
