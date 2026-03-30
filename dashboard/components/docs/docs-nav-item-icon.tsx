import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  BookOpen,
  Brain,
  Bug,
  Code2,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Network,
  Package,
  Rocket,
  Share2,
  Waypoints,
  Zap,
} from "lucide-react";

const BY_ID: Record<string, LucideIcon> = {
  overview: Rocket,
  quickstart: Zap,
  "how-it-works": Waypoints,
  api: Code2,
  "claim-graph": Share2,
  sdks: Package,
  tracing: Activity,
  evaluation: Brain,
  architecture: Network,
  alerts: Bell,
  experiments: FlaskConical,
  "dashboard-usage": LayoutDashboard,
  debugging: Bug,
  examples: BookOpen,
};

type Props = {
  id: string;
  className?: string;
};

/** One icon per docs anchor id (guides + API tab share ids). */
export function DocsNavItemIcon({ id, className }: Props) {
  const Icon = BY_ID[id] ?? FileText;
  return <Icon className={className} size={17} strokeWidth={1.65} aria-hidden />;
}
