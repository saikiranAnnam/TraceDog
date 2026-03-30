"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ClaimGraphPayload } from "@/lib/types";
import {
  LANE_TITLE,
  neighborIdsFromEdges,
  type EvidenceLane,
} from "@/lib/claim-graph-layout";
import { buildSemanticClaimGraph, estimateSemanticMinHeight } from "@/lib/claim-graph-semantic";

function shortClaimLabel(id: string): string {
  const m = /^c-(\d+)$/.exec(id);
  return m ? `C${m[1]}` : id.slice(0, 6);
}

function shortEvidenceLabel(id: string): string {
  const parts = id.split("-");
  const tail = parts.slice(-2).join("·");
  return tail || id.slice(0, 8);
}

function claimStatusClass(status: string): string {
  if (status === "supported") return "cg-disc--claim-supported";
  if (status === "conflicted") return "cg-disc--claim-conflicted";
  if (status === "partially_supported") return "cg-disc--claim-partial";
  return "cg-disc--claim-weak";
}

function ClaimDiscNode({ data, selected }: NodeProps) {
  const label = String(data?.label ?? "");
  const status = String(data?.status ?? "");
  const sc = claimStatusClass(status);
  const tip = label.length > 200 ? `${label.slice(0, 200)}…` : label;
  return (
    <div className={`cg-disc cg-disc--claim ${sc}${selected ? " cg-disc--selected" : ""}`} title={tip}>
      <Handle type="source" position={Position.Right} className="cg-disc-handle" />
      <span className="cg-disc-claim-id">{shortClaimLabel(String(data?.nodeId ?? ""))}</span>
      <span className="cg-disc-status-dot" aria-hidden />
    </div>
  );
}

const laneDiscClass: Record<EvidenceLane, string> = {
  support: "cg-disc--ev-support",
  partial: "cg-disc--ev-partial",
  contradiction: "cg-disc--ev-contradiction",
  unsupported: "cg-disc--ev-weak",
};

function EvidenceDiscNode({ data, selected }: NodeProps) {
  const lane = (data?.lane as EvidenceLane) ?? "unsupported";
  const docId = data?.doc_id != null ? String(data.doc_id) : "";
  const tip = String(data?.label ?? "");
  return (
    <div
      className={`cg-disc cg-disc--evidence ${laneDiscClass[lane]}${selected ? " cg-disc--selected" : ""}`}
      title={tip ? `${docId ? `${docId}\n` : ""}${tip}` : docId}
    >
      <Handle type="target" position={Position.Left} className="cg-disc-handle" />
      <span className="cg-disc-ev-sublabel">{shortEvidenceLabel(String(data?.nodeId ?? ""))}</span>
    </div>
  );
}

function AnchorNode() {
  return (
    <div className="cg-anchor" aria-hidden>
      <Handle type="target" position={Position.Left} className="cg-anchor-handle" />
      <Handle type="source" position={Position.Right} className="cg-anchor-handle" />
    </div>
  );
}

function LaneLabelNode({ data }: NodeProps) {
  const title = String(data?.title ?? "");
  return (
    <div className="cg-lane-band-title" title={title}>
      {title}
    </div>
  );
}

function OverflowNode({ data, selected }: NodeProps) {
  const n = typeof data?.overflowCount === "number" ? data.overflowCount : 0;
  const lane = String(data?.lane ?? "");
  return (
    <div
      className={`cg-overflow-pill${selected ? " cg-overflow-pill--selected" : ""}`}
      title={`${n} more evidence in this band (${lane})`}
    >
      <Handle type="target" position={Position.Left} className="cg-disc-handle" />
      +{n} more
    </div>
  );
}

const nodeTypes: NodeTypes = {
  claim: ClaimDiscNode,
  evidence: EvidenceDiscNode,
  anchor: AnchorNode,
  laneLabel: LaneLabelNode,
  overflow: OverflowNode,
};

function edgeStyle(kind: string | undefined): {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  strokeDasharray?: string;
} {
  switch (kind) {
    case "support":
      return { stroke: "#22c55e", strokeWidth: 1.75, opacity: 0.62 };
    case "partial":
      return { stroke: "#d97706", strokeWidth: 1.5, opacity: 0.58 };
    case "contradiction":
      return { stroke: "#ef4444", strokeWidth: 1.75, opacity: 0.62 };
    default:
      return { stroke: "#64748b", strokeWidth: 1.35, opacity: 0.48, strokeDasharray: "5 4" };
  }
}

function buildFlowState(graph: ClaimGraphPayload): {
  nodes: Node[];
  edges: Edge[];
} {
  const { nodes: specs, edges: especs } = buildSemanticClaimGraph(graph);

  const nodes: Node[] = specs.map((s) => ({
    id: s.id,
    type: s.type,
    position: s.position,
    data: s.data,
    style: { width: s.width, height: s.height },
    width: s.width,
    height: s.height,
    draggable: s.draggable ?? false,
    selectable: s.selectable ?? true,
  }));

  const edges: Edge[] = especs.map((e) => {
    const st = edgeStyle(e.kind);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      style: st,
    };
  });

  return { nodes, edges };
}

function withFocus(
  baseNodes: Node[],
  baseEdges: Edge[],
  selectedId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const focus = selectedId ? neighborIdsFromEdges(baseEdges, selectedId) : null;
  const nodes = baseNodes.map((n) => {
    if (n.type === "laneLabel") {
      return {
        ...n,
        style: { ...n.style, opacity: 1 },
      };
    }
    return {
      ...n,
      style: {
        ...n.style,
        opacity: focus && !focus.has(n.id) ? 0.38 : 1,
        transition: "opacity 0.18s ease",
      },
    };
  });
  const edges = baseEdges.map((e) => {
    const hit = selectedId && (e.source === selectedId || e.target === selectedId);
    const base = (e.style ?? {}) as { opacity?: number };
    return {
      ...e,
      style: {
        ...e.style,
        opacity: selectedId ? (hit ? 1 : 0.2) : base.opacity ?? 1,
        transition: "opacity 0.18s ease",
      },
    };
  });
  return { nodes, edges };
}

function InspectorPanel({
  graph,
  selectedId,
  selectedData,
}: {
  graph: ClaimGraphPayload;
  selectedId: string | null;
  selectedData: Record<string, unknown> | undefined;
}) {
  if (!selectedId) {
    return (
      <div className="cg-inspector cg-inspector--empty">
        <p className="cg-inspector-kicker">Inspector</p>
        <p className="cg-inspector-placeholder">
          Select a claim or evidence node. Full text and scores stay here — the graph stays structural.
        </p>
      </div>
    );
  }

  if (selectedId.startsWith("cg-overflow-")) {
    const lane = String(selectedData?.lane ?? selectedId.replace("cg-overflow-", ""));
    const n = typeof selectedData?.overflowCount === "number" ? selectedData.overflowCount : 0;
    return (
      <div className="cg-inspector">
        <p className="cg-inspector-kicker">Collapsed evidence</p>
        <p className="cg-inspector-meta">{LANE_TITLE[lane as keyof typeof LANE_TITLE] ?? lane}</p>
        <p className="cg-inspector-body">
          {n} more document{n === 1 ? "" : "s"} in this band are hidden to keep the graph readable. Open the evidence
          list below for the full set.
        </p>
      </div>
    );
  }

  const node = graph.nodes.find((n) => n.id === selectedId);
  if (!node) return null;

  const d = node.data ?? {};
  const isClaim = (node.type ?? "") === "claim";

  if (isClaim) {
    const status = String(d.status ?? "—");
    const safe = status.replace(/[^a-z0-9_]/gi, "_");
    return (
      <div className="cg-inspector">
        <p className="cg-inspector-kicker">Claim</p>
        <p className="cg-inspector-meta">{node.id}</p>
        <p className={`cg-inspector-pill cg-inspector-pill--${safe}`}>{status}</p>
        <div className="cg-inspector-body">{String(d.label ?? "")}</div>
        <dl className="cg-inspector-dl">
          <div>
            <dt>Support</dt>
            <dd>{d.support_score != null ? Number(d.support_score).toFixed(3) : "—"}</dd>
          </div>
          <div>
            <dt>Contradiction</dt>
            <dd>{d.contradiction_score != null ? Number(d.contradiction_score).toFixed(3) : "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="cg-inspector">
      <p className="cg-inspector-kicker">Evidence</p>
      <p className="cg-inspector-meta">{d.doc_id != null ? String(d.doc_id) : node.id}</p>
      <div className="cg-inspector-body cg-inspector-body--muted">{String(d.label ?? "")}</div>
    </div>
  );
}

export function ClaimGraphView({ graph }: { graph: ClaimGraphPayload }) {
  const base = useMemo(() => buildFlowState(graph), [graph]);
  const flowMinH = useMemo(() => estimateSemanticMinHeight(graph), [graph]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [graph.trace_id]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => withFocus(base.nodes, base.edges, selectedId),
    [base.nodes, base.edges, selectedId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const next = withFocus(base.nodes, base.edges, selectedId);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [graph.trace_id, base.nodes, base.edges, selectedId, setNodes, setEdges]);

  const selectedData = useMemo(
    () => nodes.find((n) => n.id === selectedId)?.data as Record<string, unknown> | undefined,
    [nodes, selectedId],
  );

  const onNodeClick = useCallback(
    (_: MouseEvent, n: Node) => {
      if (n.type === "anchor" || n.type === "laneLabel") return;
      setSelectedId((prev) => (prev === n.id ? null : n.id));
    },
    [],
  );

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  return (
    <div className="cg-graph-shell">
      <div className="cg-flow-wrap cg-flow-wrap--lanes" style={{ width: "100%", minHeight: flowMinH }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.05 }}
          minZoom={0.35}
          maxZoom={1.35}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          elevateNodesOnSelect
        />
      </div>
      <aside className="cg-inspector-rail" aria-label="Node inspector">
        <InspectorPanel graph={graph} selectedId={selectedId} selectedData={selectedData} />
      </aside>
    </div>
  );
}
