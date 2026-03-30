/**
 * Semantic clustered layout: claim anchor on the left, four horizontal bands (lanes)
 * with evidence in compact grids — not a single vertical evidence column.
 */

import type { ClaimGraphPayload } from "@/lib/types";

export type EvidenceLane = "support" | "partial" | "contradiction" | "unsupported";

export const LANE_ORDER: EvidenceLane[] = ["support", "partial", "contradiction", "unsupported"];

const LANE_RANK: Record<EvidenceLane, number> = {
  contradiction: 0,
  unsupported: 1,
  partial: 2,
  support: 3,
};

export function edgeKindToLane(kind: string | undefined): EvidenceLane {
  switch (kind) {
    case "support":
      return "support";
    case "partial":
      return "partial";
    case "contradiction":
      return "contradiction";
    default:
      return "unsupported";
  }
}

export function worstLane(lanes: EvidenceLane[]): EvidenceLane {
  if (lanes.length === 0) return "unsupported";
  return lanes.reduce((a, b) => (LANE_RANK[a] < LANE_RANK[b] ? a : b));
}

/** Visible evidence per lane; rest collapse to +N overflow node. */
export const CG_MAX_VISIBLE_PER_LANE = 3;

export const CG_LAYOUT = {
  claimX: 40,
  claimSize: 96,
  claimGapY: 92,
  evidenceDot: 28,
  /** Horizontal spacing between evidence dots in a band */
  dotGapX: 42,
  dotGapY: 40,
  /** Where evidence grids start (right of claim) */
  evidenceGridX: 320,
  bandLabelH: 22,
  bandGap: 36,
  /** Space reserved for anchor between claim and grid */
  anchorXOffset: 108,
  anchorSize: 4,
  colsPerRow: 4,
} as const;

export const LANE_TITLE: Record<EvidenceLane, string> = {
  support: "Strong support",
  partial: "Partial support",
  contradiction: "Contradiction",
  unsupported: "Weak / unattributed",
};

export type LaidOutGraph = {
  positions: Record<string, { x: number; y: number }>;
  evidenceLane: Record<string, EvidenceLane>;
};

/** Legacy: kept for tests; prefer buildSemanticFlow from claim-graph-view pipeline. */
export function computeClaimGraphLayout(graph: ClaimGraphPayload): LaidOutGraph {
  const incomingByTarget = new Map<string, typeof graph.edges>();
  for (const e of graph.edges) {
    if (!incomingByTarget.has(e.target)) incomingByTarget.set(e.target, []);
    incomingByTarget.get(e.target)!.push(e);
  }

  const evidence = graph.nodes.filter((n) => (n.type ?? "") === "evidence");
  const evidenceLane: Record<string, EvidenceLane> = {};
  const buckets: Record<EvidenceLane, typeof evidence> = {
    support: [],
    partial: [],
    contradiction: [],
    unsupported: [],
  };

  for (const n of evidence) {
    const incoming = incomingByTarget.get(n.id) ?? [];
    const lanes = incoming.map((e) =>
      edgeKindToLane(typeof e.data?.kind === "string" ? e.data.kind : undefined),
    );
    const lane = worstLane(lanes.length ? lanes : ["unsupported"]);
    evidenceLane[n.id] = lane;
    buckets[lane].push(n);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  let y = 56;
  LANE_ORDER.forEach((lane) => {
    const col = buckets[lane];
    col.sort((a, b) => a.id.localeCompare(b.id));
    col.forEach((n, j) => {
      const colIdx = j % CG_LAYOUT.colsPerRow;
      const row = Math.floor(j / CG_LAYOUT.colsPerRow);
      positions[n.id] = {
        x: CG_LAYOUT.evidenceGridX + colIdx * CG_LAYOUT.dotGapX,
        y: y + row * CG_LAYOUT.dotGapY,
      };
    });
    const rows = Math.ceil(col.length / CG_LAYOUT.colsPerRow) || 1;
    y += CG_LAYOUT.bandLabelH + rows * CG_LAYOUT.dotGapY + CG_LAYOUT.bandGap;
  });

  const claims = graph.nodes
    .filter((n) => (n.type ?? "") === "claim")
    .sort((a, b) => a.id.localeCompare(b.id));
  const midY = y / 2;
  claims.forEach((c, i) => {
    positions[c.id] = {
      x: CG_LAYOUT.claimX,
      y: midY - (claims.length * CG_LAYOUT.claimSize + (claims.length - 1) * CG_LAYOUT.claimGapY) / 2 + i * (CG_LAYOUT.claimSize + CG_LAYOUT.claimGapY),
    };
  });

  return { positions, evidenceLane };
}

export function estimateFlowMinHeight(graph: ClaimGraphPayload): number {
  const claims = graph.nodes.filter((n) => (n.type ?? "") === "claim").length;
  const incomingByTarget = new Map<string, typeof graph.edges>();
  for (const e of graph.edges) {
    if (!incomingByTarget.has(e.target)) incomingByTarget.set(e.target, []);
    incomingByTarget.get(e.target)!.push(e);
  }
  const evidence = graph.nodes.filter((n) => (n.type ?? "") === "evidence");
  const buckets: Record<EvidenceLane, number> = {
    support: 0,
    partial: 0,
    contradiction: 0,
    unsupported: 0,
  };
  for (const n of evidence) {
    const incoming = incomingByTarget.get(n.id) ?? [];
    const lanes = incoming.map((e) =>
      edgeKindToLane(typeof e.data?.kind === "string" ? e.data.kind : undefined),
    );
    const lane = worstLane(lanes.length ? lanes : ["unsupported"]);
    buckets[lane]++;
  }

  let h = 56;
  for (const lane of LANE_ORDER) {
    const n = buckets[lane];
    const vis = Math.min(n, CG_MAX_VISIBLE_PER_LANE);
    const overflow = n > CG_MAX_VISIBLE_PER_LANE ? 1 : 0;
    const slots = vis + overflow;
    const rows = Math.ceil(Math.max(1, slots) / CG_LAYOUT.colsPerRow);
    h += CG_LAYOUT.bandLabelH + rows * CG_LAYOUT.dotGapY + CG_LAYOUT.bandGap;
  }
  const claimBlock =
    claims > 0
      ? (claims - 1) * (CG_LAYOUT.claimSize + CG_LAYOUT.claimGapY) + CG_LAYOUT.claimSize
      : CG_LAYOUT.claimSize;
  return Math.max(380, h + 40, claimBlock + 120);
}

export function neighborIdsFromEdges(
  edges: Array<{ source: string; target: string }>,
  nodeId: string,
): Set<string> {
  const s = new Set<string>([nodeId]);
  for (const e of edges) {
    if (e.source === nodeId) s.add(e.target);
    if (e.target === nodeId) s.add(e.source);
  }
  return s;
}
