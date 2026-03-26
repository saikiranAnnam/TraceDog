"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SITE } from "@/lib/site";

const centerLinks = [
  { href: "/experiments", label: "Experiments" },
  { href: "#opensource", label: "Open source" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: SITE.github, label: "GitHub", external: true },
] as const;

export function LandingNav() {
  return (
    <header className="ld-nav">
      <div className="ld-nav-inner">
        <Link href="/" className="ld-nav-brand">
          <BrandLogo size={28} />
          <span>{SITE.name}</span>
        </Link>
        <nav className="ld-nav-center" aria-label="Primary">
          {centerLinks.map((l) =>
            "external" in l && l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ld-nav-link"
              >
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="ld-nav-link">
                {l.label}
              </Link>
            )
          )}
        </nav>
        <div className="ld-nav-right">
          <Link href="/traces" className="ld-btn ld-btn--ghost ld-btn--sm">
            Dashboard
          </Link>
          <Link href="/docs" className="ld-btn ld-btn--primary ld-btn--sm">
            Read docs
          </Link>
        </div>
      </div>
    </header>
  );
}
