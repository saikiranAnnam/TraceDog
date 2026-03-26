"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

export type GraphNodeId =
  | "prompt"
  | "retrieval"
  | "chunk_match"
  | "generation"
  | "evaluation"
  | "trust"
  | "decision";

type GraphNode = {
  id: GraphNodeId;
  title: string;
  subtitle: string;
  detail: {
    signal: string;
    latency: string;
    description: string;
  };
};

const NODES: GraphNode[] = [
  {
    id: "prompt",
    title: "Prompt",
    subtitle: "input",
    detail: {
      signal: "user input",
      latency: "~10 ms",
      description:
        "The request enters the trace as the initial query or agent instruction.",
    },
  },
  {
    id: "retrieval",
    title: "Retrieval",
    subtitle: "evidence",
    detail: {
      signal: "retriever",
      latency: "~120 ms",
      description:
        "Candidate evidence is fetched from the document or retrieval layer.",
    },
  },
  {
    id: "chunk_match",
    title: "Chunk match",
    subtitle: "best span",
    detail: {
      signal: "evidence score",
      latency: "~45 ms",
      description:
        "TraceDog identifies the strongest supporting chunk or sentence candidate.",
    },
  },
  {
    id: "generation",
    title: "Generation",
    subtitle: "LLM output",
    detail: {
      signal: "tokens + latency",
      latency: "~780 ms",
      description:
        "The model generates a response conditioned on the prompt and retrieved evidence.",
    },
  },
  {
    id: "evaluation",
    title: "Evaluation",
    subtitle: "judge + hybrid",
    detail: {
      signal: "judge + hybrid",
      latency: "~400 ms",
      description:
        "TraceDog scores grounding, failure signals, and support quality for the response.",
    },
  },
  {
    id: "trust",
    title: "Trust score",
    subtitle: "grounding",
    detail: {
      signal: "hallucination risk",
      latency: "~35 ms",
      description:
        "A reliability verdict is formed from grounding, failure type, and support strength.",
    },
  },
  {
    id: "decision",
    title: "Decision",
    subtitle: "ship / review",
    detail: {
      signal: "final verdict",
      latency: "~20 ms",
      description:
        "The run is marked grounded, weak, unsupported, or flagged for review.",
    },
  },
];

function getNode(id: GraphNodeId): GraphNode {
  return NODES.find((n) => n.id === id)!;
}

function GraphBox({
  node,
  selected,
  brain,
  compact,
  className,
  delay,
  onClick,
}: {
  node: GraphNode;
  selected: boolean;
  brain?: boolean;
  compact?: boolean;
  className?: string;
  delay?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className={clsx(
        "aeg-node",
        compact && "aeg-node--compact",
        selected && "aeg-node--selected",
        brain && selected && "aeg-node--brain",
        className
      )}
    >
      {selected && (
        <motion.span
          className={clsx("aeg-node-halo", brain && "aeg-node-halo--brain")}
          aria-hidden
          animate={
            brain
              ? { opacity: [0.28, 0.58, 0.28], scale: [1, 1.07, 1] }
              : { opacity: [0.18, 0.42, 0.18], scale: [1, 1.03, 1] }
          }
          transition={{
            duration: brain ? 2.5 : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <span className="aeg-node-inner">
        <span className="aeg-node-title">{node.title}</span>
        <span className="aeg-node-sub">{node.subtitle}</span>
      </span>
    </motion.button>
  );
}

export function AIExecutionGraph() {
  const [selected, setSelected] = useState<GraphNodeId>("evaluation");

  const selectedNode = useMemo(
    () => NODES.find((n) => n.id === selected) ?? NODES[4],
    [selected]
  );

  return (
    <section className="aeg-section" aria-labelledby="aeg-heading">
      <div className="aeg-section-head">
        <div>
          <p id="aeg-heading" className="aeg-kicker">
            AI execution graph
          </p>
        </div>
        <div className="aeg-badges">
          <span className="aeg-badge aeg-badge--path">Grounded path</span>
          <span className="aeg-badge aeg-badge--muted">live</span>
        </div>
      </div>

      <div className="aeg-canvas">
        {/* Main vertical spine + moving pulse */}
        <div className="aeg-spine" aria-hidden />
        <motion.div
          className="aeg-spine-pulse"
          aria-hidden
          animate={{ top: ["6%", "88%", "6%"] }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="aeg-stack">
          <GraphBox
            node={getNode("prompt")}
            selected={selected === "prompt"}
            onClick={() => setSelected("prompt")}
            delay={0}
          />

          <div className="aeg-branch-wrap">
            <div className="aeg-branch-main">
              <GraphBox
                node={getNode("retrieval")}
                selected={selected === "retrieval"}
                onClick={() => setSelected("retrieval")}
                delay={0.08}
              />
            </div>
            <div className="aeg-branch-arm">
              <div className="aeg-branch-line" aria-hidden>
                <motion.div
                  className="aeg-branch-pulse"
                  animate={{ left: ["0%", "calc(100% - 20px)", "0%"] }}
                  transition={{
                    duration: 2.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <GraphBox
                node={getNode("chunk_match")}
                selected={selected === "chunk_match"}
                compact
                onClick={() => setSelected("chunk_match")}
                delay={0.14}
              />
            </div>
          </div>

          <motion.p
            className="aeg-edge-label aeg-edge-label--right"
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            latency · tokens
          </motion.p>

          <GraphBox
            node={getNode("generation")}
            selected={selected === "generation"}
            onClick={() => setSelected("generation")}
            delay={0.2}
          />

          <motion.p
            className="aeg-edge-label aeg-edge-label--right"
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            hybrid score
          </motion.p>

          <GraphBox
            node={getNode("evaluation")}
            selected={selected === "evaluation"}
            brain
            onClick={() => setSelected("evaluation")}
            delay={0.26}
          />

          <motion.p
            className="aeg-edge-label aeg-edge-label--right"
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            hallucination risk
          </motion.p>

          <GraphBox
            node={getNode("trust")}
            selected={selected === "trust"}
            onClick={() => setSelected("trust")}
            delay={0.32}
          />

          <GraphBox
            node={getNode("decision")}
            selected={selected === "decision"}
            onClick={() => setSelected("decision")}
            delay={0.38}
          />
        </div>

        <p className="aeg-hint">Click a node for signals · illustrative graph</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          role="region"
          aria-live="polite"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="aeg-panel"
        >
          <div className="aeg-panel-grid">
            <div>
              <h4 className="aeg-panel-title">{selectedNode.title}</h4>
              <p className="aeg-panel-desc">{selectedNode.detail.description}</p>
            </div>
            <dl className="aeg-panel-meta">
              <dt>Latency</dt>
              <dd>
                <motion.span
                  key={selectedNode.detail.latency}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {selectedNode.detail.latency}
                </motion.span>
              </dd>
              <dt>Signal</dt>
              <dd>
                <motion.span
                  key={selectedNode.detail.signal}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {selectedNode.detail.signal}
                </motion.span>
              </dd>
            </dl>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
