/** Site-wide links (override via env when repo is public). */
export const SITE = {
  name: "TraceDog",
  github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com",
  tagline: "Observability and reliability for AI agents — built in the open.",
  /** One-line positioning for meta / footer. */
  positioning:
    "Open-source tool for tracing AI runs, measuring grounding, and explaining whether outputs look trustworthy or weak.",
} as const;
