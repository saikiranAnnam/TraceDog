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
      { id: "overview", label: "Getting started", ready: true },
      { id: "quickstart", label: "Quickstart", ready: true },
      { id: "how-it-works", label: "How it works", ready: true },
    ],
  },
  {
    title: "Build",
    items: [
      { id: "api", label: "API — ingest traces", ready: true },
      { id: "claim-graph", label: "Claim graph", ready: true },
      { id: "sdks", label: "SDKs", ready: false },
    ],
  },
  {
    title: "Concepts",
    items: [
      { id: "tracing", label: "Tracing concepts", ready: true },
      { id: "evaluation", label: "Evaluation (CGGE)", ready: true },
      { id: "architecture", label: "Architecture", ready: true },
      { id: "data-pipeline", label: "Data plane (eval)", ready: true },
    ],
  },
  {
    title: "Product",
    items: [
      { id: "alerts", label: "Alerts & rules", ready: false },
      { id: "experiments", label: "Experiments", ready: true },
      { id: "dashboard-usage", label: "Dashboard usage", ready: true },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "debugging", label: "Debug a trace", ready: true },
      { id: "examples", label: "Examples", ready: true },
    ],
  },
];

/** API tab — reference-first sidebar (same #anchors, different grouping). */
export const DOCS_NAV_API: DocsNavSection[] = [
  {
    title: "Endpoints",
    items: [
      { id: "api", label: "POST /api/v1/traces", ready: true },
      { id: "claim-graph", label: "GET claim graph", ready: true },
    ],
  },
  {
    title: "Models",
    items: [
      { id: "tracing", label: "Trace payload", ready: true },
      { id: "evaluation", label: "CGGE scoring", ready: true },
      { id: "architecture", label: "Architecture", ready: true },
      { id: "data-pipeline", label: "Data plane (eval)", ready: true },
    ],
  },
  {
    title: "Setup",
    items: [
      { id: "quickstart", label: "Run API & dashboard", ready: true },
      { id: "how-it-works", label: "Pipeline overview", ready: true },
      { id: "sdks", label: "SDKs", ready: false },
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
  { id: "overview", label: "Getting started", section: "Start" },
  { id: "quickstart", label: "Quickstart", section: "Start" },
  { id: "how-it-works", label: "How it works", section: "Start" },
  { id: "api", label: "API — ingest traces", section: "Build" },
  { id: "claim-graph", label: "Claim graph", section: "Build" },
  { id: "sdks", label: "SDKs", section: "Build" },
  { id: "tracing", label: "Tracing concepts", section: "Concepts" },
  { id: "evaluation", label: "Evaluation (CGGE)", section: "Concepts" },
  { id: "architecture", label: "Architecture", section: "Concepts" },
  { id: "alerts", label: "Alerts & rules", section: "Product" },
  { id: "experiments", label: "Experiments", section: "Product" },
  { id: "dashboard-usage", label: "Dashboard usage", section: "Product" },
  { id: "debugging", label: "Debug a trace", section: "Guides" },
  { id: "examples", label: "Examples", section: "Guides" },
];

export function flatDocsNavIds(): string[] {
  return DOCS_PALETTE_ENTRIES.filter((e) => !e.href).map((e) => e.id);
}
