import "../landing-premium.css";
import "./docs/docs-platform.css";
import { DashboardChrome } from "@/components/dashboard-chrome";
import { DocsNavProvider } from "@/components/docs/docs-nav-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsNavProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </DocsNavProvider>
  );
}
