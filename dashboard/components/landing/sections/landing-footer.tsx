import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SITE } from "@/lib/site";

export function LandingFooter() {
  return (
    <footer className="ld-footer">
      <div className="ld-footer-inner">
        <div className="ld-footer-brand">
          <Link href="/" className="ld-nav-brand">
            <BrandLogo size={28} />
            {SITE.name}
          </Link>
          <p>{SITE.tagline}</p>
        </div>
        <div className="ld-footer-cols">
          <div className="ld-footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <Link href="/traces">Dashboard</Link>
              </li>
              <li>
                <Link href="/experiments">Experiments</Link>
              </li>
              <li>
                <Link href="/docs">Documentation</Link>
              </li>
            </ul>
          </div>
          <div className="ld-footer-col">
            <h4>Project</h4>
            <ul>
              <li>
                <a href={SITE.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="ld-footer-bottom">
        © 2026 TraceDog · Open source · early V1 · {SITE.positioning}
      </div>
    </footer>
  );
}
