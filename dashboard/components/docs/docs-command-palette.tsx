"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DOCS_PALETTE_ENTRIES, type DocsPaletteEntry } from "@/lib/docs-nav";

export function DocsCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const flat = useMemo(() => DOCS_PALETTE_ENTRIES, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return flat;
    return flat.filter(
      (i) =>
        i.label.toLowerCase().includes(t) ||
        i.id.toLowerCase().includes(t) ||
        i.section.toLowerCase().includes(t),
    );
  }, [flat, q]);

  const go = useCallback(
    (entry: DocsPaletteEntry) => {
      if (entry.href) {
        router.push(entry.href);
      } else {
        const el = document.getElementById(entry.id);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `#${entry.id}`);
      }
      setOpen(false);
      setQ("");
    },
    [router],
  );

  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener("docs-open-command-palette", openPalette);
    return () => window.removeEventListener("docs-open-command-palette", openPalette);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="docs-cmd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="docs-cmd-panel">
        <div className="docs-cmd-head">
          <input
            type="search"
            className="docs-cmd-input"
            placeholder="Search sections…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            aria-label="Filter documentation sections"
          />
          <kbd className="docs-cmd-hint">esc</kbd>
        </div>
        <ul className="docs-cmd-list" role="listbox">
          {filtered.map((i) => (
            <li key={i.id}>
              <button type="button" className="docs-cmd-item" onClick={() => go(i)}>
                <span className="docs-cmd-item-label">{i.label}</span>
                <span className="docs-cmd-item-meta">
                  {i.href ? "Page" : i.section}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="docs-cmd-empty">No matches</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
