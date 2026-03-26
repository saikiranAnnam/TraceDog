import Link from "next/link";
import { ExplanationBody } from "@/lib/format-explanation";
import { docExcerpt, highlightExcerpt } from "@/lib/excerpt-highlight";
import { parseExplanationMetrics, explanationLeadParagraph } from "@/lib/parse-explanation-metrics";
import { buildExecutionSegments } from "@/lib/trace-execution-segments";
import {
  groundingStrengthLabel,
  heroOneLiner,
  recommendedAction,
  reliabilityLabel,
  responseSupportNote,
  riskLabel,
  shortWhyParagraph,
  verdictPillLabel,
  whySectionTitle,
} from "@/lib/trace-hero-copy";
import {
  docSimilarityTier,
  isShortAnswerResponse,
  qualityTier,
  THRESHOLD_STRONG,
  THRESHOLD_WEAK,
} from "@/lib/trace-quality";
import type { TraceDetail } from "@/lib/types";
import { TraceCollapsibleSection } from "@/components/traces/trace-collapsible-section";
import {
  ConfidenceSparklineVisual,
  ContributionBlendVisual,
  ExecutionTimelineVisual,
  FailureMixVisual,
  GroundingSpectrumVisual,
} from "@/components/traces/trace-debugger-visuals";

function tierWord(t: "good" | "medium" | "bad" | null) {
  if (!t) return "";
  return t === "good" ? "Good" : t === "medium" ? "Medium" : "Poor";
}

export function TraceDetailView({ t }: { t: TraceDetail }) {
  const tier = qualityTier(t);
  const failure = t.failure_type;
  const g = t.grounding_score;
  const parsed = parseExplanationMetrics(t.explanation);
  const shortAns = isShortAnswerResponse(t.response);
  const sentenceW = shortAns ? 0.45 : 0.7;
  const keywordW = shortAns ? 0.55 : 0.3;
  const sentenceScore = parsed?.sentence ?? g;
  const keywordScore = parsed?.keyword ?? g;
  const lead = explanationLeadParagraph(t.explanation ?? "");
  const whyPara = shortWhyParagraph(tier, lead, g, sentenceScore, keywordScore);
  const segments = buildExecutionSegments(t.spans, t.latency_ms);
  const meta = t.ingest_metadata ?? {};
  const experimentName =
    (typeof meta.title === "string" && meta.title) ||
    (typeof meta.case_id === "string" && meta.case_id) ||
    null;

  const heroClass =
    tier === "good" ? "tdv-hero--good" : tier === "medium" ? "tdv-hero--medium" : "tdv-hero--bad";
  const actionClass =
    tier === "good"
      ? "tdv-action--good"
      : tier === "medium"
        ? "tdv-action--medium"
        : "tdv-action--bad";
  const pillClass =
    tier === "good" ? "tdv-pill--good" : tier === "medium" ? "tdv-pill--medium" : "tdv-pill--bad";

  const topSim = t.retrieved_docs?.[0]?.similarity_score ?? null;
  const simTier = topSim != null ? docSimilarityTier(topSim) : null;

  return (
    <div className="trace-debugger">
      <nav className="tdv-breadcrumb">
        <Link href="/traces">← Traces</Link>
        <span className="trace-breadcrumb-sep"> / </span>
        <span style={{ color: "#e5e7eb" }}>Detail</span>
      </nav>
      <h1 className="tdv-page-title">Trace decision</h1>

      {shortAns ? (
        <div className="tdv-caveat" role="note">
          <strong>Short answer</strong> — sentence scores vs long passages can look low; treat as a
          signal.
        </div>
      ) : null}

      {/* 1 — Hero verdict (full width, 3 columns on large screens) */}
      <header className={`tdv-hero tdv-hero--shell ${heroClass}`}>
        <div className="tdv-hero-col--lead">
          <span className={`tdv-pill ${pillClass}`}>{verdictPillLabel(tier)}</span>
          <p className="tdv-hero-lead">{heroOneLiner(tier, g, failure)}</p>
        </div>
        <div className="tdv-hero-metrics" aria-label="Key metrics">
          <div className="tdv-hero-metric-block" title="Hybrid grounding score">
            <span className="tdv-card-title">Grounding</span>
            <span className="tdv-metric-value tdv-metric-value--teal">
              {g != null ? g.toFixed(2) : "—"}
            </span>
            {g != null ? (
              <span className="tdv-metric-sub">{groundingStrengthLabel(g)}</span>
            ) : null}
          </div>
          <div className="tdv-hero-metric-block" title="Hallucination risk">
            <span className="tdv-card-title">Risk</span>
            <span className="tdv-metric-value tdv-metric-value--risk">
              {t.hallucination_risk != null ? t.hallucination_risk.toFixed(2) : "—"}
            </span>
            {t.hallucination_risk != null ? (
              <span className="tdv-metric-sub">{riskLabel(t.hallucination_risk)}</span>
            ) : null}
          </div>
          <div className="tdv-hero-metric-block" title="Reliability composite">
            <span className="tdv-card-title">Reliability</span>
            <span className="tdv-metric-value tdv-metric-value--rel">
              {t.reliability_score != null ? t.reliability_score.toFixed(2) : "—"}
            </span>
            {t.reliability_score != null ? (
              <span className="tdv-metric-sub">{reliabilityLabel(t.reliability_score)}</span>
            ) : null}
          </div>
        </div>
        <div className="tdv-hero-col--action">
          <div className={`tdv-action ${actionClass}`}>
            <span className="tdv-action-k">Recommended action</span>
            {recommendedAction(tier, failure)}
          </div>
        </div>
        <div className="tdv-hero-meta-row">
          <span>{t.model_name}</span>
          <span>{t.latency_ms}ms total</span>
          {experimentName ? <span>{experimentName}</span> : null}
          <span>{t.created_at}</span>
        </div>
      </header>

      {/* 2 — Main column + insights rail */}
      <section className="tdv-analysis" aria-labelledby="why-heading">
        <span className="tdv-kicker" id="why-heading" style={{ display: "block", marginBottom: "0.75rem" }}>
          Why it scored this way
        </span>
        <div className="tdv-dashboard-grid">
          <div className="tdv-dashboard-main">
            <div className="tdv-why-copy tdv-card tdv-card--lift">
              <span className="tdv-kicker">{whySectionTitle(tier)}</span>
              <p className="tdv-why-p">{whyPara}</p>
              <ul className="tdv-why-bullets">
                <li>
                  Best grounding score:{" "}
                  <strong style={{ color: "#e5e7eb" }}>
                    {parsed?.hybridBest != null ? parsed.hybridBest.toFixed(2) : g != null ? g.toFixed(2) : "—"}
                  </strong>
                </li>
                <li>
                  Sentence match:{" "}
                  <strong style={{ color: "#e5e7eb" }}>
                    {sentenceScore != null ? sentenceScore.toFixed(2) : "—"}
                  </strong>
                </li>
                <li>
                  Keyword overlap:{" "}
                  <strong style={{ color: "#e5e7eb" }}>
                    {keywordScore != null ? keywordScore.toFixed(2) : "—"}
                  </strong>
                </li>
              </ul>
              {t.explanation ? (
                <details className="tdv-advanced">
                  <summary>Full scorer narrative</summary>
                  <ExplanationBody text={t.explanation} />
                </details>
              ) : null}
            </div>

            {/* 3 — Evidence */}
            <section className="tdv-grid-cell">
              <span className="tdv-kicker" style={{ display: "block", marginBottom: "0.5rem" }}>
                Evidence
              </span>
              <TraceCollapsibleSection
                className="tdv-card tdv-card--lift"
                sectionKey="evidence"
                traceId={t.trace_id}
                title={
                  <>
                    Retrieved evidence
                    {t.retrieved_docs?.length ? (
                      <span style={{ fontWeight: 500, color: "#94a3b8" }}>
                        {" "}
                        ({t.retrieved_docs.length} document{t.retrieved_docs.length === 1 ? "" : "s"})
                      </span>
                    ) : null}
                  </>
                }
                subtitle={
                  topSim != null && simTier ? (
                    <>
                      Top similarity{" "}
                      <span className="tdv-pill-sim">
                        {topSim.toFixed(2)} {tierWord(simTier)}
                      </span>
                    </>
                  ) : (
                    "No documents"
                  )
                }
              >
          {t.retrieved_docs?.length ? (
            t.retrieved_docs.map((d) => {
              const sim = d.similarity_score;
              const st = sim != null ? docSimilarityTier(sim) : null;
              const excerpt = docExcerpt(d.content);
              return (
                <div key={d.doc_id} className="tdv-ev-card">
                  <div className="tdv-ev-head">
                    <strong style={{ fontSize: "0.88rem", wordBreak: "break-all" }}>{d.doc_id}</strong>
                    {sim != null ? (
                      <span className="tdv-pill-sim">
                        {sim.toFixed(3)} {tierWord(st)}
                      </span>
                    ) : null}
                  </div>
                  <p className="tdv-ev-excerpt">{highlightExcerpt(excerpt, t.response)}</p>
                  <div className="tdv-ev-metrics">
                    <span>Similarity {sim != null ? sim.toFixed(3) : "—"}</span>
                    <span>
                      Coverage {sim != null ? (sim >= THRESHOLD_STRONG ? "strong" : "partial") : "—"}
                    </span>
                  </div>
                  <details style={{ marginTop: "0.65rem" }}>
                    <summary style={{ cursor: "pointer", fontSize: "0.78rem", color: "#38bdf8" }}>
                      Show full document
                    </summary>
                    <pre className="tdv-pre" style={{ marginTop: "0.5rem" }}>
                      {d.content}
                    </pre>
                  </details>
                </div>
              );
            })
          ) : (
            <p className="tdv-muted" style={{ margin: 0 }}>
              No documents attached.
            </p>
          )}
              </TraceCollapsibleSection>
            </section>

            {/* 4 — Prompt / response */}
            <section className="tdv-grid-cell">
              <span className="tdv-kicker" style={{ display: "block", marginBottom: "0.5rem" }}>
                Prompt & response
              </span>
              <TraceCollapsibleSection
                className="tdv-card tdv-card--lift"
                sectionKey="prompt"
                traceId={t.trace_id}
                title="Question & model output"
                subtitle="Side-by-side"
              >
          <div className="tdv-pr-grid">
            <div className="tdv-pr-card">
              <div className="tdv-pr-k">Question</div>
              <pre className="tdv-pre">{t.prompt}</pre>
            </div>
            <div className="tdv-pr-card">
              <div className="tdv-pr-k">Answer generated</div>
              <pre className="tdv-pre">{t.response}</pre>
              <p className="tdv-pr-note">{responseSupportNote(tier)}</p>
            </div>
          </div>
              </TraceCollapsibleSection>
            </section>
          </div>

          <aside className="tdv-dashboard-rail" aria-label="Grounding and execution insights">
            {g != null ? (
              <GroundingSpectrumVisual
                score={g}
                strongThreshold={THRESHOLD_STRONG}
                weakThreshold={THRESHOLD_WEAK}
              />
            ) : null}
            <ContributionBlendVisual
              sentenceWeight={sentenceW}
              keywordWeight={keywordW}
              sentenceScore={sentenceScore}
              keywordScore={keywordScore}
            />
            <ConfidenceSparklineVisual score={g} />
            <FailureMixVisual trace={t} />
            <ExecutionTimelineVisual segments={segments} totalMs={t.latency_ms} />
          </aside>
        </div>
      </section>

      {/* 6 — Debug */}
      <section className="tdv-debug-band">
        <span className="tdv-kicker" style={{ display: "block", marginBottom: "0.5rem" }}>
          Debug
        </span>
        <TraceCollapsibleSection
          sectionKey="debug"
          traceId={t.trace_id}
          title="Technical details"
          subtitle="IDs, metadata, thresholds"
        >
          <p className="tdv-muted" style={{ fontSize: "0.78rem", marginTop: 0 }}>
            Thresholds: weak &lt; {THRESHOLD_WEAK}, strong ≥ {THRESHOLD_STRONG}. Blend:{" "}
            {shortAns ? "45% sentence / 55% keyword" : "70% sentence / 30% keyword"}.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", wordBreak: "break-all" }}>
            <strong style={{ color: "#cbd5e1" }}>Trace ID</strong> {t.trace_id}
          </p>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            <strong style={{ color: "#cbd5e1" }}>Agent</strong> {t.agent_name} · {t.environment}
          </p>
          {t.failure_type ? (
            <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              <strong style={{ color: "#cbd5e1" }}>Failure type</strong> {t.failure_type}
            </p>
          ) : null}
          {t.ingest_metadata && Object.keys(t.ingest_metadata).length > 0 ? (
            <>
              <div className="tdv-kicker" style={{ marginTop: "0.75rem" }}>
                Run metadata (JSON)
              </div>
              <pre className="tdv-debug-pre">{JSON.stringify(t.ingest_metadata, null, 2)}</pre>
            </>
          ) : null}
          {t.spans && t.spans.length > 0 ? (
            <>
              <div className="tdv-kicker" style={{ marginTop: "0.75rem" }}>
                Raw spans
              </div>
              <pre className="tdv-debug-pre">
                {JSON.stringify(t.spans, null, 2)}
              </pre>
            </>
          ) : null}
        </TraceCollapsibleSection>
      </section>
    </div>
  );
}
