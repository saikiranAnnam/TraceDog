"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { ExperimentsLabCompare } from "@/components/experiments/experiments-lab-compare";
import { ExperimentsLabRunner } from "@/components/experiments/experiments-lab-runner";
import { ExperimentsRepairLlmLive } from "@/components/experiments/experiments-repair-llm-live";
import { EXPERIMENTS, type ExperimentId } from "@/lib/experiments-catalog";

export function ExperimentsOverview() {
  const [id, setId] = useState<ExperimentId>(EXPERIMENTS[0]!.id);
  const selectId = useId();
  const experiment = useMemo(() => EXPERIMENTS.find((e) => e.id === id)!, [id]);

  return (
    <div className="td-data-page td-data-page--tabbed td-lab-page">
      <header className="td-data-product-header">
        <div className="td-data-product-header-main">
          <h1 className="tdv-page-title">Experiments</h1>
          <p className="td-data-product-tagline tdv-section-sub">
            Evaluation runs and reliability algorithms: pick a test and inspect example inputs and outputs.
          </p>
        </div>
        <nav className="td-data-product-header-links" aria-label="Related docs">
          <Link href="/docs#architecture" className="td-data-product-doc-link">
            Architecture
          </Link>
          <Link href="/data" className="td-data-product-doc-link">
            Data pipeline
          </Link>
          <Link href="/experiments" className="td-data-product-doc-link">
            Public benchmarks
          </Link>
        </nav>
      </header>

      <div className="td-lab-toolbar">
        <div className="td-lab-select-wrap">
          <label className="td-lab-select-label" htmlFor={selectId}>
            Experiment
          </label>
          <select
            id={selectId}
            className="td-lab-select"
            value={id}
            onChange={(e) => setId(e.target.value as ExperimentId)}
          >
            {EXPERIMENTS.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>
        <p className="td-lab-desc">{experiment.description}</p>
      </div>

      <div className="td-lab-io-grid">
        <section className="td-lab-io-card" aria-labelledby={`${selectId}-in`}>
          <div className="td-lab-io-head">
            <h2 className="td-lab-io-title" id={`${selectId}-in`}>
              {experiment.inputLabel}
            </h2>
          </div>
          <pre className="td-lab-io-pre">{experiment.inputExample}</pre>
        </section>
        <section className="td-lab-io-card" aria-labelledby={`${selectId}-out`}>
          <div className="td-lab-io-head">
            <h2 className="td-lab-io-title" id={`${selectId}-out`}>
              {experiment.outputLabel}
            </h2>
          </div>
          <pre className="td-lab-io-pre">{experiment.outputExample}</pre>
        </section>
      </div>

      <section className="td-lab-cmd" aria-label="How to run">
        <span className="td-lab-cmd-label">Command</span>
        <code className="td-lab-cmd-code">{experiment.command}</code>
      </section>

      <ExperimentsLabRunner />
      <ExperimentsRepairLlmLive />
      <ExperimentsLabCompare />
    </div>
  );
}
