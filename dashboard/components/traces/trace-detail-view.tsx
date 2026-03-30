import { ExplanationBody } from "@/lib/format-explanation";
import { docExcerpt, highlightExcerpt } from "@/lib/excerpt-highlight";
import { parseExplanationMetrics, explanationLeadParagraph } from "@/lib/parse-explanation-metrics";
import { buildExecutionSegments } from "@/lib/trace-execution-segments";
import {
  heroOneLiner,
  recommendedAction,
  reliabilityLabel,
  responseSupportNote,
  rootCauseConclusion,
  shortWhyParagraph,
} from "@/lib/trace-hero-copy";
import {
  docSimilarityTier,
  isShortAnswerResponse,
  qualityTier,
  THRESHOLD_STRONG,
  THRESHOLD_WEAK,
  type QualityTier,
} from "@/lib/trace-quality";
import type { ClaimGraphPayload, TraceDetail } from "@/lib/types";
import { ClaimGraphSection } from "@/components/traces/claim-graph-section";
import { TraceMetadataKvList } from "@/components/traces/trace-metadata-kv";
import { TraceCollapsibleSection } from "@/components/traces/trace-collapsible-section";
import {
  ContributionBlendVisual,
  ExecutionTimelineVisual,
  FailureMixVisual,
  GroundingSpectrumVisual,
} from "@/components/traces/trace-debugger-visuals";

function statusTone(tier: ReturnType<typeof qualityTier>): "good" | "medium" | "bad" {
  if (tier === "good") return "good";
  if (tier === "medium") return "medium";
  return "bad";
}

function statusLabel(tier: ReturnType<typeof qualityTier>): string {
  if (tier === "good") return "Likely grounded";
  if (tier === "medium") return "Needs review";
  return "High risk";
}

function bulletTone(v: number | null | undefined): "ok" | "warn" | "bad" {
  if (v == null) return "warn";
  if (v >= THRESHOLD_STRONG) return "ok";
  if (v >= THRESHOLD_WEAK) return "warn";
  return "bad";
}

function simMatchLabel(tier: QualityTier): string {
  switch (tier) {
    case "good":
      return "strong match";
    case "medium":
      return "weak match";
    default:
      return "poor match";
  }
}

function simChipClass(tier: QualityTier): string {
  switch (tier) {
    case "good":
      return "tdv-chip-sim tdv-chip-sim--good";
    case "medium":
      return "tdv-chip-sim tdv-chip-sim--warn";
    default:
      return "tdv-chip-sim tdv-chip-sim--bad";
  }
}

export function TraceDetailView({
  t,
  claimGraph,
}: {
  t: TraceDetail;
  claimGraph: ClaimGraphPayload | null;
}) {
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

  const topSim = t.retrieved_docs?.[0]?.similarity_score ?? null;
  const simTier = topSim != null ? docSimilarityTier(topSim) : null;
  const st = statusTone(tier);

  const hybridBest =
    parsed?.hybridBest != null ? parsed.hybridBest : g != null ? g : null;

  const rel = t.reliability_score;
  const relLabel = reliabilityLabel(rel);

  return (
    <div className="trace-debugger">
      <header className="tdv-page-head">
        <div className="tdv-page-head-titles">
          <h1 className="tdv-page-title">Trace</h1>
          <p className="tdv-page-sub">Run detail for one scored trace</p>
        </div>
        <div className="tdv-page-meta" aria-label="Run metadata">
          <span className="tdv-page-meta-item">{t.model_name}</span>
          <span className="tdv-page-meta-item">{t.latency_ms}ms</span>
          {experimentName ? <span className="tdv-page-meta-item">{experimentName}</span> : null}
          <span className="tdv-page-meta-item tdv-page-meta-time">{t.created_at}</span>
        </div>
      </header>

      {shortAns ? (
        <div className="tdv-caveat-pro" role="note">
          Short answers often score lower against long passages — treat sentence match as a signal only.
        </div>
      ) : null}

      {/* 1 — Status summary (decisive rail) */}
      <section className={`tdv-status-rail tdv-status-rail--${st}`} aria-labelledby="status-heading">
        <h2 id="status-heading" className="tdv-sr-only">
          Status summary
        </h2>
        <div className="tdv-status-rail-main">
          <div className="tdv-status-rail-badge">{statusLabel(tier)}</div>
          <div className="tdv-status-reliability-row">
            <span className="tdv-status-rel-label">Reliability</span>
            <span className="tdv-status-rel-num">{rel != null ? rel.toFixed(2) : "—"}</span>
            {rel != null ? (
              <span className="tdv-status-rel-tag">({relLabel})</span>
            ) : null}
          </div>
          <p className="tdv-status-interpret">{heroOneLiner(tier, g, failure)}</p>
          <div className="tdv-status-rec-block">
            <span className="tdv-status-rec-k">Recommendation</span>
            <p className="tdv-status-rec-v">{recommendedAction(tier, failure)}</p>
          </div>
        </div>
        <dl className="tdv-status-rail-side">
          <div className="tdv-status-rail-kv">
            <dt>Grounding</dt>
            <dd>{g != null ? g.toFixed(2) : "—"}</dd>
          </div>
          <div className="tdv-status-rail-kv">
            <dt>Hallucination risk</dt>
            <dd>{t.hallucination_risk != null ? t.hallucination_risk.toFixed(2) : "—"}</dd>
          </div>
          <div className="tdv-status-rail-kv">
            <dt>Model</dt>
            <dd>{t.model_name}</dd>
          </div>
          <div className="tdv-status-rail-kv">
            <dt>Runtime</dt>
            <dd>{t.latency_ms}ms</dd>
          </div>
          {experimentName ? (
            <div className="tdv-status-rail-kv">
              <dt>Dataset / job</dt>
              <dd>{experimentName}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="tdv-flow-stack">
        {/* 2 — Root cause (hero) */}
        <section aria-labelledby="rc-heading">
          <h2 className="tdv-section-h" id="rc-heading">
            Root cause analysis
          </h2>
          <p className="tdv-section-sub">What failed the scoring gates and why it matters.</p>
          <div className="tdv-rc-panel">
            <p className="tdv-rc-lead">{whyPara}</p>
            <h3 className="tdv-rc-subh">Problems detected</h3>
            <ul className="tdv-rc-rows">
              <li className="tdv-rc-row" data-tone={bulletTone(hybridBest)}>
                <span className="tdv-rc-row-icon" aria-hidden>
                  {bulletTone(hybridBest) === "ok" ? "✓" : "✕"}
                </span>
                <span className="tdv-rc-row-label">Hybrid grounding (best)</span>
                <span className="tdv-rc-row-val">{hybridBest != null ? hybridBest.toFixed(2) : "—"}</span>
                <span className="tdv-rc-row-hint">
                  weak &lt; {THRESHOLD_WEAK}, strong ≥ {THRESHOLD_STRONG}
                </span>
              </li>
              <li className="tdv-rc-row" data-tone={bulletTone(sentenceScore ?? undefined)}>
                <span className="tdv-rc-row-icon" aria-hidden>
                  {bulletTone(sentenceScore ?? undefined) === "ok" ? "✓" : "✕"}
                </span>
                <span className="tdv-rc-row-label">Sentence match</span>
                <span className="tdv-rc-row-val">{sentenceScore != null ? sentenceScore.toFixed(2) : "—"}</span>
                <span className="tdv-rc-row-hint" />
              </li>
              <li className="tdv-rc-row" data-tone={bulletTone(keywordScore ?? undefined)}>
                <span className="tdv-rc-row-icon" aria-hidden>
                  {bulletTone(keywordScore ?? undefined) === "ok" ? "✓" : "✕"}
                </span>
                <span className="tdv-rc-row-label">Keyword overlap</span>
                <span className="tdv-rc-row-val">{keywordScore != null ? keywordScore.toFixed(2) : "—"}</span>
                <span className="tdv-rc-row-hint" />
              </li>
            </ul>
            <div className="tdv-rc-conclusion">
              <span className="tdv-rc-conclusion-k">Conclusion</span>
              <p className="tdv-rc-conclusion-p">{rootCauseConclusion(tier)}</p>
            </div>
            {t.explanation ? (
              <details className="tdv-advanced tdv-advanced--rc">
                <summary>Full scorer narrative</summary>
                <ExplanationBody text={t.explanation} />
              </details>
            ) : null}
          </div>
        </section>

        {/* 3 — Claim graph (supporting viz) */}
        {claimGraph ? <ClaimGraphSection graph={claimGraph} /> : null}

        {/* 4 — Evidence (log style) */}
        <section aria-labelledby="ev-heading">
          <h2 className="tdv-section-h" id="ev-heading">
            Evidence
          </h2>
          <p className="tdv-section-sub tdv-ev-section-sub">
            {t.retrieved_docs?.length
              ? `${t.retrieved_docs.length} document${t.retrieved_docs.length === 1 ? "" : "s"}`
              : "None"}
            {topSim != null ? ` · top similarity ${topSim.toFixed(3)}` : ""}
            {simTier ? ` · ${simMatchLabel(simTier)}` : ""}
          </p>
          <div className="tdv-ev-log">
            {t.retrieved_docs?.length ? (
              t.retrieved_docs.map((d) => {
                const sim = d.similarity_score;
                const tierDoc = sim != null ? docSimilarityTier(sim) : null;
                const excerpt = docExcerpt(d.content);
                return (
                  <div key={d.doc_id} className="tdv-ev-log-row">
                    <div className="tdv-ev-log-head">
                      <code className="tdv-ev-log-id">{d.doc_id}</code>
                      {sim != null && tierDoc ? (
                        <span className={simChipClass(tierDoc)}>{sim.toFixed(3)}</span>
                      ) : null}
                    </div>
                    <p className="tdv-ev-log-body">{highlightExcerpt(excerpt, t.response)}</p>
                    <details className="tdv-ev-log-expand">
                      <summary>Full passage</summary>
                      <pre className="tdv-pre tdv-pre--passage">{d.content}</pre>
                    </details>
                  </div>
                );
              })
            ) : (
              <p className="tdv-muted tdv-ev-empty">No retrieved documents on this trace.</p>
            )}
          </div>
        </section>

        {/* 5 — Input / output (debug) */}
        <section aria-labelledby="io-heading">
          <h2 className="tdv-section-h" id="io-heading">
            Input / output
          </h2>
          <p className="tdv-section-sub">Request and model response — inspect like a log.</p>
          <div className="tdv-io-split">
            <div className="tdv-io-pane">
              <div className="tdv-io-pane-k">Prompt</div>
              <div className="tdv-io-pane-body">
                <pre className="tdv-io-pre">{t.prompt}</pre>
              </div>
            </div>
            <div className="tdv-io-pane">
              <div className="tdv-io-pane-k">Model output</div>
              <div className="tdv-io-pane-body">
                <pre className="tdv-io-pre">{t.response}</pre>
                <p className="tdv-io-note">{responseSupportNote(tier)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6 — Execution timeline */}
        <section aria-labelledby="exec-heading">
          <h2 className="tdv-section-h" id="exec-heading">
            Execution timeline
          </h2>
          <p className="tdv-section-sub">Where time went for this run (from spans).</p>
          <div className="tdv-exec-section">
            <ExecutionTimelineVisual segments={segments} totalMs={t.latency_ms} />
          </div>
        </section>

        {/* 7 — Signals (collapsed) */}
        <section aria-labelledby="sig-heading">
          <h2 className="tdv-section-h tdv-sr-only" id="sig-heading">
            Signals
          </h2>
          <TraceCollapsibleSection
            sectionKey="signals"
            traceId={t.trace_id}
            title="Signals"
            subtitle="Grounding thresholds, blend composition, classification"
            defaultOpen={false}
          >
            <div className="tdv-signals-grid">
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
              <FailureMixVisual trace={t} />
            </div>
          </TraceCollapsibleSection>
        </section>

        {/* 8 — Technical details (collapsed) */}
        <section className="tdv-debug-band" aria-labelledby="dbg-heading">
          <h2 className="tdv-section-h tdv-sr-only" id="dbg-heading">
            Technical details
          </h2>
          <TraceCollapsibleSection
            sectionKey="debug"
            traceId={t.trace_id}
            title="Technical details"
            subtitle="IDs, metadata, spans"
            defaultOpen={false}
          >
            <p className="tdv-debug-note">
              Scoring: weak &lt; {THRESHOLD_WEAK}, strong ≥ {THRESHOLD_STRONG}. Blend{" "}
              {shortAns ? "45% / 55% sentence · keyword" : "70% / 30% sentence · keyword"}.
            </p>
            <dl className="tdv-kv-list tdv-kv-list--tight">
              <div className="tdv-kv-item">
                <dt className="tdv-kv-dt">Trace ID</dt>
                <dd className="tdv-kv-dd">
                  <code className="tdv-code-inline tdv-code-id">{t.trace_id}</code>
                </dd>
              </div>
              <div className="tdv-kv-item">
                <dt className="tdv-kv-dt">Agent</dt>
                <dd className="tdv-kv-dd">
                  <code className="tdv-code-inline tdv-code-id">
                    {t.agent_name} · {t.environment}
                  </code>
                </dd>
              </div>
              {t.failure_type ? (
                <div className="tdv-kv-item">
                  <dt className="tdv-kv-dt">Failure type</dt>
                  <dd className="tdv-kv-dd">
                    <code className="tdv-code-inline">{t.failure_type}</code>
                  </dd>
                </div>
              ) : null}
              {t.failure_reason ? (
                <div className="tdv-kv-item">
                  <dt className="tdv-kv-dt">Root cause (v1)</dt>
                  <dd className="tdv-kv-dd">
                    <code className="tdv-code-inline">{t.failure_reason}</code>
                  </dd>
                </div>
              ) : null}
            </dl>
            {t.ingest_metadata && Object.keys(t.ingest_metadata).length > 0 ? (
              <>
                <h3 className="tdv-subpanel-title">Run metadata</h3>
                <TraceMetadataKvList data={t.ingest_metadata} />
              </>
            ) : null}
            {t.spans && t.spans.length > 0 ? (
              <>
                <h3 className="tdv-subpanel-title">Spans (raw)</h3>
                <pre className="tdv-json-block tdv-json-block--scroll">{JSON.stringify(t.spans, null, 2)}</pre>
              </>
            ) : null}
          </TraceCollapsibleSection>
        </section>
      </div>
    </div>
  );
}
