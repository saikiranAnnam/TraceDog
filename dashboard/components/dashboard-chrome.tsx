import { AppShell } from "@/components/dashboard/app-shell";
import { marketingMono, marketingSans } from "@/lib/marketing-fonts";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={`app-root ${marketingSans.variable} ${marketingMono.variable}`}>
      <AppShell>{children}</AppShell>
    </div>
  );
}
