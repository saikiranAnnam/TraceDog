"use client";

import { useMemo } from "react";
import {
  Background,
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

function ArchNode({ data }: NodeProps) {
  const label = String(data?.label ?? "");
  const sub = String(data?.sub ?? "");
  return (
    <div className="arch-node">
      <Handle type="target" position={Position.Left} className="arch-handle" />
      <span className="arch-node-label">{label}</span>
      <span className="arch-node-sub">{sub}</span>
      <Handle type="source" position={Position.Right} className="arch-handle" />
    </div>
  );
}

const archNodeTypes: NodeTypes = {
  arch: ArchNode,
};

/** Read-only product map: clients → API → scoring → storage → dashboard. */
export function SystemArchitectureFlow() {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "clients",
        position: { x: 0, y: 24 },
        data: {
          label: "Clients",
          sub: "SDK · agents · eval runners",
        },
        type: "arch",
        style: { width: 160, height: 76 },
      },
      {
        id: "api",
        position: { x: 200, y: 16 },
        data: {
          label: "TraceDog API",
          sub: "POST /api/v1/traces",
        },
        type: "arch",
        style: { width: 168, height: 92 },
      },
      {
        id: "score",
        position: { x: 408, y: 8 },
        data: {
          label: "Reliability layer",
          sub: "Hybrid scorer · CGGE · grounding layers",
        },
        type: "arch",
        style: { width: 200, height: 100 },
      },
      {
        id: "db",
        position: { x: 640, y: 20 },
        data: {
          label: "PostgreSQL",
          sub: "traces · scores · metadata",
        },
        type: "arch",
        style: { width: 152, height: 84 },
      },
      {
        id: "dash",
        position: { x: 820, y: 24 },
        data: {
          label: "Dashboard",
          sub: "Next.js · overview · traces",
        },
        type: "arch",
        style: { width: 160, height: 76 },
      },
    ];

    const edgeStyle = { stroke: "#64748b", strokeWidth: 1.5, opacity: 0.85 };
    const edges: Edge[] = [
      { id: "e1", source: "clients", target: "api", style: edgeStyle, type: "smoothstep" },
      { id: "e2", source: "api", target: "score", style: edgeStyle, type: "smoothstep" },
      { id: "e3", source: "score", target: "db", style: edgeStyle, type: "smoothstep" },
      {
        id: "e4",
        source: "db",
        target: "dash",
        style: { ...edgeStyle, strokeDasharray: "6 4" },
        type: "smoothstep",
        label: "GET",
        labelStyle: { fill: "#94a3b8", fontSize: 11 },
        labelBgStyle: { fill: "#0f1115", fillOpacity: 0.95 },
      },
    ];

    return { initialNodes: nodes, initialEdges: edges };
  }, []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="arch-flow-wrap" style={{ width: "100%", height: 320 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={archNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        minZoom={0.5}
        maxZoom={1}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
      >
        <Background gap={20} size={1} color="rgba(148,163,184,0.12)" />
      </ReactFlow>
    </div>
  );
}
