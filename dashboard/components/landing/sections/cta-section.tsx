"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { SITE } from "@/lib/site";

export function CtaSection() {
  return (
    <section className="ld-cta-final" id="contact">
      <Reveal>
        <h2>Follow the project or get in touch</h2>
        <p className="ld-sub">
          Building TraceDog in the open — feedback, collaboration, and early users welcome.
        </p>
        <div className="ld-cta-btns">
          <a href={SITE.github} className="ld-btn ld-btn--ghost" target="_blank" rel="noopener noreferrer">
            <GitBranch size={16} style={{ marginRight: 6 }} />
            View GitHub
          </a>
          <Link href="/docs" className="ld-btn ld-btn--outline">
            Read the docs
          </Link>
          <Link href="/contact" className="ld-btn ld-btn--ghost">
            Contact
          </Link>
          <Link href="/traces" className="ld-btn ld-btn--primary">
            See the dashboard demo
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
