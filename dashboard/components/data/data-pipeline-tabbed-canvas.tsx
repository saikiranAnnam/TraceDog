"use client";

import { useCallback, useId, useState, type KeyboardEvent } from "react";
import clsx from "clsx";

import { DataPipelineHighLevelGrid } from "@/components/data/data-pipeline-high-level-grid";
import { DataPipelineInternalFlow } from "@/components/data/data-pipeline-internal-flow";

type PipelineTab = "high-level" | "internal";

const TABS: { id: PipelineTab; label: string;}[] = [
  {
    id: "high-level",
    label: "High-level",
  },
  {
    id: "internal",
    label: "Internal",
  },
];

/** Single shell with tabs switching between React Flow canvases (no extra duplicate figures). */
export function DataPipelineTabbedCanvas() {
  const [tab, setTab] = useState<PipelineTab>("high-level");
  const baseId = useId();
  const tabIds = TABS.map((t, i) => `${baseId}-tab-${i}`);
  const panelId = `${baseId}-panel`;

  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
        setTab(TABS[next].id);
        document.getElementById(tabIds[next])?.focus();
      }
    },
    [tabIds],
  );

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="td-pipeline-tabbed">
      <div className="td-pipeline-tab-bar" role="tablist" aria-label="Pipeline diagram view">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={tabIds[i]}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={panelId}
            tabIndex={tab === t.id ? 0 : -1}
            className={clsx("td-pipeline-tab", tab === t.id && "td-pipeline-tab--active")}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabIds[TABS.findIndex((x) => x.id === tab)]}
        className="td-pipeline-tab-panel"
      >
        {tab === "high-level" ? <DataPipelineHighLevelGrid /> : <DataPipelineInternalFlow />}
      </div>
    </div>
  );
}
