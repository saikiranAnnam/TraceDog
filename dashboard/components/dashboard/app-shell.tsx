"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNavFor } from "@/lib/docs-nav";
import { useDocsNav } from "@/components/docs/docs-nav-context";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import {
  Activity,
  BookOpen,
  ChevronRight,
  Database,
  FlaskConical,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { LandingNav } from "@/components/landing/premium/landing-nav";
import { SITE } from "@/lib/site";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
};

const primaryNav: NavItem[] = [
  {
    href: "/overview",
    label: "Overview",
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    match: (p) => p === "/overview",
  },
  {
    href: "/traces",
    label: "Traces",
    icon: <Activity size={16} strokeWidth={1.5} />,
    match: (p) => p === "/traces" || p.startsWith("/traces/"),
  },
  {
    href: "/data",
    label: "Data",
    icon: <Database size={16} strokeWidth={1.5} />,
    match: (p) => p === "/data" || p.startsWith("/data/"),
  },
  {
    href: "/lab",
    label: "Experiments",
    icon: <FlaskConical size={16} strokeWidth={1.5} />,
    match: (p) => p === "/lab" || p.startsWith("/lab/"),
  },
  {
    href: "/docs",
    label: "Docs",
    icon: <BookOpen size={16} strokeWidth={1.5} />,
    match: (p) => p.startsWith("/docs"),
  },
];

const secondaryNav: {
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  { href: "/about", label: "About", icon: <Info size={16} strokeWidth={1.5} /> },
  { href: "/contact", label: "Contact", icon: <MessageCircle size={16} strokeWidth={1.5} /> },
];

function NavRow({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={`app-nav-link${active ? " app-nav-link--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="app-nav-icon" aria-hidden>
        {item.icon}
      </span>
      <span className="app-nav-text">{item.label}</span>
    </Link>
  );
}

function AppShellDocsNavEmbed() {
  const { productTab, activeId, navFilter, setNavFilter } = useDocsNav();
  return (
    <div className="app-shell-docs-embed">
      <DocsSidebar
        variant="embed"
        sections={docsNavFor(productTab)}
        activeId={activeId}
        search={navFilter}
        onSearch={setNavFilter}
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isDocsRoute = pathname.startsWith("/docs");
  const dashboardMarketingNav =
    pathname === "/overview" ||
    pathname.startsWith("/traces") ||
    pathname.startsWith("/data") ||
    pathname === "/lab" ||
    pathname.startsWith("/lab/");
  const showMarketingTopNav = isDocsRoute || dashboardMarketingNav;

  return (
    <div className="app-shell-root">
      {showMarketingTopNav ? (
        <div className="app-shell-marketing-nav">
          <LandingNav />
        </div>
      ) : null}

      <div className="app-shell">
        <aside className="app-shell-sidebar" aria-label="Application">
          {showMarketingTopNav && isDocsRoute ? null : (
            <>
              <div
                className={
                  showMarketingTopNav && !isDocsRoute
                    ? "app-shell-top app-shell-top--search-only"
                    : isDocsRoute
                      ? "app-shell-top app-shell-top--docs"
                      : "app-shell-top"
                }
              >
                {!showMarketingTopNav ? (
                  <Link href="/" className="app-shell-logo">
                    <BrandLogo size={22} />
                    <span className="app-shell-title">{SITE.name}</span>
                  </Link>
                ) : null}

                {!isDocsRoute ? (
                  <div className="app-shell-search" role="search">
                    <Search size={14} strokeWidth={2} className="app-shell-search-icon" aria-hidden />
                    <input
                      type="search"
                      placeholder="Find…"
                      className="app-shell-search-input"
                      disabled
                      title="Search coming soon"
                      aria-label="Search (disabled)"
                    />
                    <kbd className="app-shell-kbd">F</kbd>
                  </div>
                ) : null}
              </div>

              <hr className="app-shell-rule" />
            </>
          )}

          {isDocsRoute ? (
            <>
              <div className="app-shell-scroll app-shell-scroll--docs">
                <AppShellDocsNavEmbed />
              </div>
              <div className="app-shell-footer">
                <hr className="app-shell-rule" />
                <nav className="app-shell-nav app-shell-nav--footer" aria-label="Site">
                  <Link href="/" className="app-nav-link app-nav-link--row">
                    <span className="app-nav-icon" aria-hidden>
                      <Home size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">Home</span>
                  </Link>
                  <a
                    href={SITE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-nav-link app-nav-link--row"
                  >
                    <span className="app-nav-icon" aria-hidden>
                      <Sparkles size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">GitHub</span>
                    <ChevronRight className="app-nav-chevron app-nav-chevron--external" size={14} strokeWidth={1.75} aria-hidden />
                  </a>
                  <a href="mailto:hello@tracedog.dev" className="app-nav-link app-nav-link--row">
                    <span className="app-nav-icon" aria-hidden>
                      <Mail size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">Email</span>
                  </a>
                </nav>
              </div>
            </>
          ) : (
            <>
              <div className="app-shell-scroll">
                <p className="app-shell-nav-label" id="nav-observability">
                  Observability
                </p>
                <nav className="app-shell-nav" aria-labelledby="nav-observability">
                  {primaryNav.map((item) => (
                    <NavRow key={item.href} item={item} pathname={pathname} />
                  ))}
                </nav>

                <hr className="app-shell-rule" />

                <p className="app-shell-nav-label" id="nav-product">
                  Product
                </p>
                <nav className="app-shell-nav" aria-labelledby="nav-product">
                  {secondaryNav.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`app-nav-link app-nav-link--row${active ? " app-nav-link--active" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="app-nav-icon" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="app-nav-text">{item.label}</span>
                        <ChevronRight className="app-nav-chevron" size={14} strokeWidth={1.75} aria-hidden />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="app-shell-footer">
                <hr className="app-shell-rule" />
                <nav className="app-shell-nav app-shell-nav--footer" aria-label="Site">
                  <Link href="/" className="app-nav-link app-nav-link--row">
                    <span className="app-nav-icon" aria-hidden>
                      <Home size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">Home</span>
                  </Link>
                  <a
                    href={SITE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-nav-link app-nav-link--row"
                  >
                    <span className="app-nav-icon" aria-hidden>
                      <Sparkles size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">GitHub</span>
                    <ChevronRight className="app-nav-chevron app-nav-chevron--external" size={14} strokeWidth={1.75} aria-hidden />
                  </a>
                  <a href="mailto:hello@tracedog.dev" className="app-nav-link app-nav-link--row">
                    <span className="app-nav-icon" aria-hidden>
                      <Mail size={16} strokeWidth={1.5} />
                    </span>
                    <span className="app-nav-text">Email</span>
                  </a>
                </nav>
              </div>
            </>
          )}
        </aside>

        <div className="app-shell-main">
          <DashboardBreadcrumb />
          <div className="app-shell-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
