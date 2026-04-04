"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import type { DocsNavSection } from "@/lib/docs-nav";
import { DocsNavItemIcon } from "@/components/docs/docs-nav-item-icon";

type Props = {
  sections: DocsNavSection[];
  activeId: string;
  search: string;
  onSearch: (v: string) => void;
  onSelectId?: (id: string) => void;
  /** Nested under app shell Docs item — tighter chrome */
  variant?: "default" | "embed";
};

export function DocsSidebar({
  sections,
  activeId,
  search,
  onSearch,
  onSelectId,
  variant = "default",
}: Props) {
  const pathname = usePathname() ?? "";

  const selectSection = useCallback((id: string) => {
    onSelectId?.(id);
    window.history.replaceState(null, "", `#${id}`);
  }, [onSelectId]);

  const showFilter = variant !== "embed";

  const linkClass = (active: boolean) =>
    `docs-nav-link${active ? " docs-nav-link--active" : ""}`;

  return (
    <nav
      className={`docs-sidebar${variant === "embed" ? " docs-sidebar--embed" : ""}`}
      aria-label="Documentation"
    >
      {showFilter ? (
        <div className="docs-sidebar-search">
          <label htmlFor="docs-search" className="docs-sr-only">
            Search docs
          </label>
          <input
            id="docs-search"
            type="search"
            className="docs-sidebar-input"
            placeholder="Filter nav…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          <button
            type="button"
            className="docs-sidebar-kbd"
            title="Open command palette (⌘K)"
            onClick={() => window.dispatchEvent(new CustomEvent("docs-open-command-palette"))}
          >
            ⌘K
          </button>
        </div>
      ) : null}
      {sections.map((sec) => {
        const items = sec.items.filter((i) => {
          const t = search.trim().toLowerCase();
          if (!t) return true;
          return i.label.toLowerCase().includes(t) || i.id.includes(t);
        });
        if (items.length === 0) return null;
        return (
          <div key={sec.title} className="docs-nav-group">
            <p className="docs-nav-group-title">{sec.title}</p>
            <ul className="docs-nav-list">
              {items.map((item) => {
                const routeActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
                const anchorActive = !item.href && activeId === item.id;
                const active = item.href ? routeActive : anchorActive;

                const inner = (
                  <>
                    <span className="docs-nav-link-main">
                      <DocsNavItemIcon id={item.id} className="docs-nav-icon" />
                      <span className="docs-nav-link-label">{item.label}</span>
                    </span>
                    {item.ready === false ? (
                      <span className="docs-nav-soon" title="Coming soon">
                        soon
                      </span>
                    ) : null}
                  </>
                );

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" className={linkClass(active)} onClick={() => selectSection(item.id)}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
