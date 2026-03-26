import type { Metadata } from "next";
import "../landing-premium.css";
import { LandingNav } from "@/components/landing/premium/landing-nav";
import { marketingMono, marketingSans } from "@/lib/marketing-fonts";

export const metadata: Metadata = {
  title: "TraceDog — Observability for AI agents",
  description:
    "Inspect AI runs, measure grounding, compare models. Open-source trace scoring and reliability UI.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`ld-root ${marketingSans.variable} ${marketingMono.variable}`}
    >
      <LandingNav />
      {children}
    </div>
  );
}
