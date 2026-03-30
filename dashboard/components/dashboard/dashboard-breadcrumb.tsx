"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Vercel-style: TraceDog › section › detail */
export function DashboardBreadcrumb() {
  const pathname = usePathname() ?? "";

  const segments: { label: string; href?: string }[] = [];

  if (pathname.startsWith("/docs")) {
    return null;
  }

  segments.push({ label: "TraceDog", href: "/overview" });
  if (pathname === "/overview") {
    segments.push({ label: "Overview" });
  } else if (pathname === "/data" || pathname.startsWith("/data/")) {
    segments.push({ label: "Data" });
  } else if (pathname === "/lab" || pathname.startsWith("/lab/")) {
    segments.push({ label: "Experiments" });
  } else if (pathname.startsWith("/traces")) {
    segments.push({ label: "Traces", href: "/traces" });
    const rest = pathname.slice("/traces".length).replace(/^\//, "");
    if (rest) {
      const id = rest.split("/")[0];
      if (id && id.length > 10) {
        segments.push({ label: `${id.slice(0, 8)}…` });
      } else if (id) {
        segments.push({ label: id });
      }
    }
  }

  return (
    <header className="app-main-header">
      <nav className="app-breadcrumb" aria-label="Breadcrumb">
        {segments.map((s, i) => (
          <span key={`${s.label}-${i}`} className="app-breadcrumb-seg">
            {i > 0 ? <span className="app-breadcrumb-sep" aria-hidden>›</span> : null}
            {s.href && i < segments.length - 1 ? (
              <Link href={s.href} className="app-breadcrumb-link">
                {s.label}
              </Link>
            ) : (
              <span className={i === segments.length - 1 ? "app-breadcrumb-current" : undefined}>
                {s.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
