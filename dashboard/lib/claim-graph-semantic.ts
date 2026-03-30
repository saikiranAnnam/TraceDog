/**
 * Builds React-Flow-ready semantic graph: horizontal bands, grid evidence,
 * anchors for short edges, overflow caps.
 */

import type { ClaimGraphPayload } from "@/lib/types";
import {
  CG_LAYOUT,
  CG_MAX_VISIBLE_PER_LANE,
  LANE_ORDER,
  LANE_TITLE,
  edgeKindToLane,
  worstLane,
  type EvidenceLane,
} from "@/lib/claim-graph-layout";

export type SemanticNodeSpec = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width: number;
  height: number;
  draggable?: boolean;
  selectable?: boolean;
};

export type SemanticEdgeSpec = {
  id: string;
  source: string;
  target: string;
  kind?: string;
};

function collectEvidenceLanes(
  graph: ClaimGraphPayload,
): {
  evidenceLane: Record<string, EvidenceLane>;
  buckets: Record<EvidenceLane, (typeof graph.nodes)[number][]>;
} {
  const incomingByTarget = new Map<string, typeof graph.edges>();
  for (const e of graph.edges) {
    if (!incomingByTarget.has(e.target)) incomingByTarget.set(e.target, []);
    incomingByTarget.get(e.target)!.push(e);
  }

  const evidence = graph.nodes.filter((n) => (n.type ?? "") === "evidence");
  const evidenceLane: Record<string, EvidenceLane> = {};
  const buckets: Record<EvidenceLane, (typeof graph.nodes)[number][]> = {
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

  for (const lane of LANE_ORDER) {
    buckets[lane].sort((a, b) => a.id.localeCompare(b.id));
  }

  return { evidenceLane, buckets };
}

/** Edges from claim id -> evidence id with kind string */
function claimToEvidenceEdges(graph: ClaimGraphPayload): Map<string, { target: string; kind: string }[]> {
  const m = new Map<string, { target: string; kind: string }[]>();
  for (const e of graph.edges) {
    const src = e.source;
    const tgt = e.target;
    const kind = typeof e.data?.kind === "string" ? e.data.kind : "unsupported";
    if (!m.has(src)) m.set(src, []);
    m.get(src)!.push({ target: tgt, kind });
  }
  return m;
}

export function buildSemanticClaimGraph(graph: ClaimGraphPayload): {
  nodes: SemanticNodeSpec[];
  edges: SemanticEdgeSpec[];
  evidenceLane: Record<string, EvidenceLane>;
} {
  const claims = graph.nodes
    .filter((n) => (n.type ?? "") === "claim")
    .sort((a, b) => a.id.localeCompare(b.id));
  const { evidenceLane, buckets } = collectEvidenceLanes(graph);
  const claimEdges = claimToEvidenceEdges(graph);

  const visibleByLane: Record<EvidenceLane, (typeof graph.nodes)[number][]> = {
    support: [],
    partial: [],
    contradiction: [],
    unsupported: [],
  };
  const overflowCount: Record<EvidenceLane, number> = {
    support: 0,
    partial: 0,
    contradiction: 0,
    unsupported: 0,
  };

  for (const lane of LANE_ORDER) {
    const all = buckets[lane];
    visibleByLane[lane] = all.slice(0, CG_MAX_VISIBLE_PER_LANE);
    overflowCount[lane] = Math.max(0, all.length - CG_MAX_VISIBLE_PER_LANE);
  }

  const hiddenInLane: Record<EvidenceLane, Set<string>> = {
    support: new Set(),
    partial: new Set(),
    contradiction: new Set(),
    unsupported: new Set(),
  };
  for (const lane of LANE_ORDER) {
    const vis = new Set(visibleByLane[lane].map((n) => n.id));
    for (const n of buckets[lane]) {
      if (!vis.has(n.id)) hiddenInLane[lane].add(n.id);
    }
  }

  type BandInfo = { top: number; centerY: number; height: number };
  const bandMeta: Record<EvidenceLane, BandInfo> = {
    support: { top: 0, centerY: 0, height: 0 },
    partial: { top: 0, centerY: 0, height: 0 },
    contradiction: { top: 0, centerY: 0, height: 0 },
    unsupported: { top: 0, centerY: 0, height: 0 },
  };

  const positions: Record<string, { x: number; y: number }> = {};
  const nodes: SemanticNodeSpec[] = [];

  let yCursor = 52;

  for (const lane of LANE_ORDER) {
    const vis = visibleByLane[lane];
    const hasOverflow = overflowCount[lane] > 0;
    const nSlots = vis.length + (hasOverflow ? 1 : 0);
    const rows = Math.max(1, Math.ceil(Math.max(1, nSlots) / CG_LAYOUT.colsPerRow));

    const bandTop = yCursor;
    const labelY = bandTop;
    const gridTop = bandTop + CG_LAYOUT.bandLabelH;
    const bandHeight = CG_LAYOUT.bandLabelH + rows * CG_LAYOUT.dotGapY + 8;
    const centerY = gridTop + ((rows * CG_LAYOUT.dotGapY) / 2);

    bandMeta[lane] = { top: bandTop, centerY, height: bandHeight };

    const labelId = `cg-lane-label-${lane}`;
    nodes.push({
      id: labelId,
      type: "laneLabel",
      position: { x: CG_LAYOUT.evidenceGridX, y: labelY },
      data: { title: LANE_TITLE[lane], lane },
      width: 280,
      height: CG_LAYOUT.bandLabelH,
      draggable: false,
      selectable: false,
    });
    positions[labelId] = { x: CG_LAYOUT.evidenceGridX, y: labelY };

    vis.forEach((n, k) => {
      const col = k % CG_LAYOUT.colsPerRow;
      const row = Math.floor(k / CG_LAYOUT.colsPerRow);
      const px = CG_LAYOUT.evidenceGridX + col * CG_LAYOUT.dotGapX;
      const py = gridTop + row * CG_LAYOUT.dotGapY;
      positions[n.id] = { x: px, y: py };
    });

    if (hasOverflow) {
      const k = vis.length;
      const col = k % CG_LAYOUT.colsPerRow;
      const row = Math.floor(k / CG_LAYOUT.colsPerRow);
      const oid = `cg-overflow-${lane}`;
      positions[oid] = {
        x: CG_LAYOUT.evidenceGridX + col * CG_LAYOUT.dotGapX,
        y: gridTop + row * CG_LAYOUT.dotGapY,
      };
      nodes.push({
        id: oid,
        type: "overflow",
        position: positions[oid],
        data: { overflowCount: overflowCount[lane], lane },
        width: Math.max(72, CG_LAYOUT.evidenceDot + 44),
        height: CG_LAYOUT.evidenceDot + 8,
        draggable: false,
        selectable: true,
      });
    }

    yCursor += bandHeight + CG_LAYOUT.bandGap;
  }

  const totalContentHeight = yCursor;
  const claimsBlockH =
    claims.length > 0
      ? (claims.length - 1) * (CG_LAYOUT.claimSize + CG_LAYOUT.claimGapY) + CG_LAYOUT.claimSize
      : CG_LAYOUT.claimSize;
  const claimStartY = 52 + totalContentHeight / 2 - claimsBlockH / 2;

  claims.forEach((c, i) => {
    positions[c.id] = {
      x: CG_LAYOUT.claimX,
      y: claimStartY + i * (CG_LAYOUT.claimSize + CG_LAYOUT.claimGapY),
    };
  });

  const edges: SemanticEdgeSpec[] = [];

  for (const c of claims) {
    const outs = claimEdges.get(c.id) ?? [];
    const byLane: Record<EvidenceLane, typeof outs> = {
      support: [],
      partial: [],
      contradiction: [],
      unsupported: [],
    };
    for (const o of outs) {
      const L = evidenceLane[o.target];
      if (L) byLane[L].push(o);
    }

    for (const lane of LANE_ORDER) {
      const list = byLane[lane];
      if (list.length === 0) continue;

      const anchorId = `cg-anchor:${c.id}:${lane}`;
      const cx = positions[c.id].x + CG_LAYOUT.claimSize;
      const ay = bandMeta[lane].centerY - CG_LAYOUT.anchorSize / 2;
      const ax = cx + CG_LAYOUT.anchorXOffset;
      positions[anchorId] = { x: ax, y: ay };

      nodes.push({
        id: anchorId,
        type: "anchor",
        position: positions[anchorId],
        data: { lane, claimId: c.id },
        width: CG_LAYOUT.anchorSize,
        height: CG_LAYOUT.anchorSize,
        draggable: false,
        selectable: false,
      });

      const laneKind =
        lane === "support"
          ? "support"
          : lane === "partial"
            ? "partial"
            : lane === "contradiction"
              ? "contradiction"
              : "unsupported";

      edges.push({
        id: `e-${c.id}-${anchorId}`,
        source: c.id,
        target: anchorId,
        kind: laneKind,
      });

      const visIds = new Set(visibleByLane[lane].map((n) => n.id));
      for (const o of list) {
        if (!visIds.has(o.target)) continue;
        edges.push({
          id: `e-${anchorId}-${o.target}`,
          source: anchorId,
          target: o.target,
          kind: o.kind,
        });
      }

      const overflowId = `cg-overflow-${lane}`;
      if (overflowCount[lane] > 0 && positions[overflowId]) {
        const hasHiddenEdge = list.some((o) => hiddenInLane[lane].has(o.target));
        if (hasHiddenEdge) {
          edges.push({
            id: `e-${anchorId}-${overflowId}`,
            source: anchorId,
            target: overflowId,
            kind: "unsupported",
          });
        }
      }
    }
  }

  for (const c of claims) {
    const d = c.data ?? {};
    nodes.push({
      id: c.id,
      type: "claim",
      position: positions[c.id],
      data: { ...d, nodeId: c.id },
      width: CG_LAYOUT.claimSize,
      height: CG_LAYOUT.claimSize,
      draggable: false,
      selectable: true,
    });
  }

  for (const lane of LANE_ORDER) {
    for (const n of visibleByLane[lane]) {
      const d = n.data ?? {};
      nodes.push({
        id: n.id,
        type: "evidence",
        position: positions[n.id],
        data: { ...d, nodeId: n.id, lane },
        width: CG_LAYOUT.evidenceDot,
        height: CG_LAYOUT.evidenceDot,
        draggable: false,
        selectable: true,
      });
    }
  }

  return { nodes, edges, evidenceLane };
}

export function estimateSemanticMinHeight(graph: ClaimGraphPayload): number {
  const { buckets } = collectEvidenceLanes(graph);
  let y = 52;
  for (const lane of LANE_ORDER) {
    const all = buckets[lane];
    const vis = Math.min(all.length, CG_MAX_VISIBLE_PER_LANE);
    const hasOverflow = all.length > CG_MAX_VISIBLE_PER_LANE;
    const nSlots = vis + (hasOverflow ? 1 : 0);
    const rows = Math.max(1, Math.ceil(Math.max(1, nSlots) / CG_LAYOUT.colsPerRow));
    const bandHeight = CG_LAYOUT.bandLabelH + rows * CG_LAYOUT.dotGapY + 8;
    y += bandHeight + CG_LAYOUT.bandGap;
  }
  const claims = graph.nodes.filter((n) => (n.type ?? "") === "claim").length;
  const claimBlock =
    claims > 0
      ? (claims - 1) * (CG_LAYOUT.claimSize + CG_LAYOUT.claimGapY) + CG_LAYOUT.claimSize
      : CG_LAYOUT.claimSize;
  return Math.max(400, y + 48, claimBlock + 140);
}
