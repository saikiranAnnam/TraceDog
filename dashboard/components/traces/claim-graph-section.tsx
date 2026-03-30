import { ClaimGraphView } from "@/components/traces/claim-graph-view";
import type { ClaimGraphPayload } from "@/lib/types";

export function ClaimGraphSection({ graph }: { graph: ClaimGraphPayload }) {
  const nClaims = graph.nodes.filter((n) => n.type === "claim").length;
  if (nClaims === 0) {
    return (
      <section aria-labelledby="cg-empty">
        <h2 className="tdv-section-h" id="cg-empty">
          Claim–evidence graph
        </h2>
        <p className="tdv-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
          No atomic claims extracted from this response.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="cg-heading">
      <h2 className="tdv-section-h" id="cg-heading">
        Claim–evidence graph
      </h2>
      <p className="tdv-section-sub">
        Lane layout: claims on the left, evidence grouped by relation strength. Edge color encodes support, partial,
        contradiction, or weak. Click a node for full text in the inspector — the canvas stays structural.
      </p>
      <div className="cg-section">
        <ClaimGraphView graph={graph} />
      </div>
    </section>
  );
}
