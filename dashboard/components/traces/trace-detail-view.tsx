import type { ReactNode } from "react";
import Link from "next/link";
import { ExplanationBody } from "@/lib/format-explanation";
import {
  docSimilarityTier,
  isShortAnswerResponse,
  qualityTier,
  tierLabel,
  THRESHOLD_STRONG,
  THRESHOLD_WEAK,
} from "@/lib/trace-quality";
import type { TraceDetail } from "@/lib/types";

function Badge({
  children,
  tier,
}: {
  children: ReactNode;
  tier: "good" | "medium" | "bad" | "neutral";
}) {
  return <span className={`trace-badge trace-badge-${tier}`}>{children}</span>;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="trace-metric-card">
      <div className="trace-metric-label">{label}</div>
      <div className="trace-metric-value">{value}</div>
      {hint ? <div className="trace-metric-hint">{hint}</div> : null}
    </div>
  );
}

function SpanTimeline({
  spans,
  totalLatencyMs,
}: {
  spans: TraceDetail["spans"];
  totalLatencyMs: number;
}) {
  const total =
    spans.reduce((s, x) => s + (x.duration_ms ?? 0), 0) || totalLatencyMs || 1;

  return (
    <div className="trace-timeline">
      <div className="trace-timeline-bars">
        {spans.map((s) => {
          const w = Math.max(
            4,
            Math.round(((s.duration_ms ?? 0) / total) * 100)
          );
          return (
            <div
              key={`${s.position}-${s.span_type}`}
              className="trace-timeline-segment"
              style={{ flex: `${w} 1 0` }}
              title={`${s.label || s.span_type}: ${s.duration_ms ?? "?"}ms`}
            >
              <div className="trace-timeline-bar" />
              <span className="trace-timeline-caption">
                {s.label || s.span_type}
              </span>
            </div>
          );
        })}
      </div>
      <p className="trace-timeline-note">
        Bar width ∝ reported span duration (total {totalLatencyMs}ms trace latency).
      </p>
    </div>
  );
}

export function TraceDetailView({ t }: { t: TraceDetail }) {
  const tier = qualityTier(t);
  const failure = t.failure_type;

  return (
    <div className="trace-detail">
      <nav className="trace-breadcrumb">
        <Link href="/traces">← Traces</Link>
        <span className="trace-breadcrumb-sep">/</span>
        <span className="trace-breadcrumb-current">Detail</span>
      </nav>

      <header className="trace-header">
        <div className="trace-header-row">
          <h1 className="trace-title">Trace</h1>
          <div className="trace-header-badges">
            <Badge tier={tier}>{tierLabel(tier)}</Badge>
            {failure ? (
              <Badge tier="neutral">{failure.replace(/_/g, " ")}</Badge>
            ) : (
              <Badge tier="good">No failure flag</Badge>
            )}
          </div>
        </div>
        <code className="trace-id">{t.trace_id}</code>
        <p className="trace-meta">
          <span>
            <strong>{t.agent_name}</strong> · {t.environment}
          </span>
          <span className="trace-meta-sep">·</span>
          <span>{t.model_name}</span>
          <span className="trace-meta-sep">·</span>
          <span>{t.latency_ms}ms</span>
          <span className="trace-meta-sep">·</span>
          <span className="trace-muted">{t.created_at}</span>
        </p>
      </header>

      {t.ingest_metadata && Object.keys(t.ingest_metadata).length > 0 ? (
        <section className="trace-section">
          <h2 className="trace-section-title">Run metadata</h2>
          <pre className="trace-pre trace-pre-sm">
            {JSON.stringify(t.ingest_metadata, null, 2)}
          </pre>
        </section>
      ) : null}

      {isShortAnswerResponse(t.response) ? (
        <div className="trace-short-answer-caveat" role="note">
          <strong>Short answer</strong> — similarity vs. a long retrieved passage can look
          weaker than it is. Scores use the best-matching sentence and keyword overlap;
          treat them as a signal, not a verdict.
        </div>
      ) : null}

      <section className="trace-section">
        <h2 className="trace-section-title">Summary</h2>
        <div className="trace-metric-grid">
          <MetricCard
            label="Reliability"
            value={
              t.reliability_score != null ? t.reliability_score.toFixed(2) : "—"
            }
            hint="0–1 composite"
          />
          <MetricCard
            label="Hallucination risk"
            value={
              t.hallucination_risk != null
                ? t.hallucination_risk.toFixed(2)
                : "—"
            }
            hint="↑ when grounding is weak"
          />
          <MetricCard
            label="Grounding (hybrid best chunk)"
            value={
              t.grounding_score != null ? t.grounding_score.toFixed(2) : "—"
            }
            hint={`sentence + keyword blend · strong ≥ ${THRESHOLD_STRONG}, weak < ${THRESHOLD_WEAK}`}
          />
        </div>
      </section>

      {t.explanation ? (
        <section className={`trace-section trace-why trace-why-${tier}`}>
          <h2 className="trace-section-title">Why TraceDog scored it this way</h2>
          <div className="trace-why-card">
            <ExplanationBody text={t.explanation} />
          </div>
        </section>
      ) : null}

      <section className="trace-section">
        <h2 className="trace-section-title">Execution flow</h2>
        {t.spans && t.spans.length > 0 ? (
          <>
            <SpanTimeline spans={t.spans} totalLatencyMs={t.latency_ms} />
            <ol className="trace-span-list">
              {t.spans.map((s) => (
                <li key={`${s.position}-${s.span_type}`}>
                  <strong>{s.label || s.span_type}</strong>
                  <span className="trace-muted">
                    {" "}
                    · {s.span_type}
                    {s.duration_ms != null ? ` · ${s.duration_ms}ms` : ""}
                    {s.status ? ` · ${s.status}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="trace-muted">No spans recorded.</p>
        )}
      </section>

      <section className="trace-section trace-two-col">
        <div>
          <h2 className="trace-section-title">Prompt</h2>
          <pre className="trace-pre">{t.prompt}</pre>
        </div>
        <div>
          <h2 className="trace-section-title">Response</h2>
          <pre className="trace-pre">{t.response}</pre>
        </div>
      </section>

      <section className="trace-section">
        <h2 className="trace-section-title">Retrieved documents</h2>
        {t.retrieved_docs?.length ? (
          <ul className="trace-doc-list">
            {t.retrieved_docs.map((d) => {
              const sim = d.similarity_score;
              const st =
                sim != null ? docSimilarityTier(sim) : ("neutral" as const);
              return (
                <li key={d.doc_id} className="trace-doc-card">
                  <div className="trace-doc-card-head">
                    <strong>{d.doc_id}</strong>
                    {sim != null ? (
                      <Badge tier={st}>
                        similarity {sim.toFixed(3)} ({st})
                      </Badge>
                    ) : (
                      <span className="trace-muted">no score</span>
                    )}
                  </div>
                  <pre className="trace-pre trace-pre-sm">{d.content}</pre>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="trace-muted">No documents attached to this trace.</p>
        )}
      </section>
    </div>
  );
}
