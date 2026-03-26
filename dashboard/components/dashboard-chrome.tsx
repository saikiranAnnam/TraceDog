import { LandingNav } from "@/components/landing/premium/landing-nav";
import { marketingMono, marketingSans } from "@/lib/marketing-fonts";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ld-root ld-root--app ${marketingSans.variable} ${marketingMono.variable}`}>
      <LandingNav />
      <main className="ld-dashboard-main">
        <div className="ld-container ld-container--dashboard">{children}</div>
      </main>
    </div>
  );
}
