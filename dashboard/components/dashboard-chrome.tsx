import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="app-nav">
        <div className="app-nav-inner">
          <Link href="/" className="app-nav-brand">
            <BrandLogo size={32} />
            TraceDog
          </Link>
          <div className="app-nav-right">
            <div className="app-nav-links">
            <Link href="/">Home</Link>
            <Link href="/traces">Traces</Link>
            <Link href="/overview">Overview</Link>
            <Link href="/docs">Docs</Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </>
  );
}
