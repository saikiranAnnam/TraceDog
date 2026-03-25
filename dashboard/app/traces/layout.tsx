import { DashboardChrome } from "@/components/dashboard-chrome";

export default function TracesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
