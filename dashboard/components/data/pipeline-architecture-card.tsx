"use client";

import clsx from "clsx";

export type ArchitectureTone = "blue" | "purple" | "green" | "orange" | "slate";

export type ArchitectureStatus = "healthy" | "processing" | "degraded";

export type PipelineArchitectureCardProps = {
  title: string;
  /** Uppercase section line (e.g. "External inputs") */
  subtitle?: string;
  bullets?: string[];
  tone: ArchitectureTone;
  featured?: boolean;
  selected?: boolean;
  status?: ArchitectureStatus;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
  /** Optional hint under bullets (internal diagram) */
  hint?: string;
};

function StatusDot({ status }: { status: ArchitectureStatus }) {
  return (
    <span
      className={clsx("td-arch-status-dot", `td-arch-status-dot--${status}`)}
      aria-hidden
    />
  );
}

/** Shared NodeCard-style module (no Tailwind / no backdrop blur). */
export function PipelineArchitectureCard({
  title,
  subtitle = "Module",
  bullets = [],
  tone,
  featured = false,
  selected = false,
  status = "healthy",
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  hint,
}: PipelineArchitectureCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      className={clsx(
        "td-arch-card",
        `td-arch-card--tone-${tone}`,
        featured && "td-arch-card--featured",
        selected && "td-arch-card--selected",
        onClick && "td-arch-card--clickable",
        className,
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={onClick ? `Details: ${title}` : undefined}
    >
      <div className="td-arch-card-head">
        <span className="td-arch-card-subtitle">{subtitle}</span>
        <StatusDot status={status} />
      </div>
      <div className="td-arch-card-title">{title}</div>
      {bullets.length > 0 ? (
        <ul className="td-arch-card-bullets">
          {bullets.map((item) => (
            <li key={item} className="td-arch-card-bullet">
              <span className="td-arch-card-bullet-dot" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="td-arch-card-hint">{hint}</p> : null}
    </Comp>
  );
}

/** Animated horizontal flow segment between sections */
export function ArchitectureFlowHairline({ vertical }: { vertical?: boolean }) {
  return (
    <div
      className={clsx(
        "td-arch-flow-hairline",
        vertical ? "td-arch-flow-hairline--v" : "td-arch-flow-hairline--h",
      )}
      aria-hidden
    />
  );
}

/** Vertical drop + optional label (e.g. flow down from runners) */
export function ArchitectureFlowJoint({ label }: { label?: string }) {
  return (
    <div className="td-arch-flow-joint" aria-hidden>
      {label ? <span className="td-arch-flow-joint-label">{label}</span> : null}
      <ArchitectureFlowHairline vertical />
    </div>
  );
}
