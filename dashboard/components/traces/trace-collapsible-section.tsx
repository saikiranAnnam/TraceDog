"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  sectionKey: string;
  traceId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

function storageKey(traceId: string, sectionKey: string) {
  return `td-trace-open-${traceId}-${sectionKey}`;
}

export function TraceCollapsibleSection({
  sectionKey,
  traceId,
  title,
  subtitle,
  defaultOpen = false,
  children,
  className = "",
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(storageKey(traceId, sectionKey));
      if (v === "1") setOpen(true);
      if (v === "0") setOpen(false);
    } catch {
      /* ignore */
    }
  }, [traceId, sectionKey]);

  const toggle = useCallback(() => {
    setOpen((o) => {
      const next = !o;
      try {
        window.localStorage.setItem(
          storageKey(traceId, sectionKey),
          next ? "1" : "0"
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [traceId, sectionKey]);

  return (
    <div className={`tdv-expand ${className}`.trim()}>
      <button
        type="button"
        id={`${id}-btn`}
        className="tdv-expand-trigger"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="tdv-expand-trigger-main">
          <span className="tdv-expand-title">{title}</span>
          {subtitle ? (
            <span className="tdv-expand-sub">{subtitle}</span>
          ) : null}
        </span>
        <span className="tdv-expand-chevron" data-open={open}>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-btn`}
          className="tdv-expand-panel"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
