import * as React from "react";
import {
  FlaskConical,
  Rocket,
  Palette,
  Package,
  Lightbulb,
  ClipboardList,
  Flame,
  Search,
  Pin,
  Settings,
  Circle,
  CircleDashed,
  Clock,
  GitPullRequest,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";

export const ICON_OPTIONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "flask", label: "Testing", icon: <FlaskConical className="w-4 h-4 text-emerald-500" /> },
  { id: "rocket", label: "Deploy", icon: <Rocket className="w-4 h-4 text-purple-500" /> },
  { id: "palette", label: "Design", icon: <Palette className="w-4 h-4 text-pink-500" /> },
  { id: "package", label: "Product", icon: <Package className="w-4 h-4 text-blue-500" /> },
  { id: "lightbulb", label: "Idea", icon: <Lightbulb className="w-4 h-4 text-amber-500" /> },
  { id: "clipboard", label: "Tasks", icon: <ClipboardList className="w-4 h-4 text-indigo-500" /> },
  { id: "flame", label: "Urgent", icon: <Flame className="w-4 h-4 text-rose-500" /> },
  { id: "search", label: "Review", icon: <Search className="w-4 h-4 text-cyan-500" /> },
  { id: "pin", label: "Pinned", icon: <Pin className="w-4 h-4 text-red-500" /> },
  { id: "settings", label: "Infra", icon: <Settings className="w-4 h-4 text-gray-500" /> },
];

export function ColumnIcon({ iconKey, className = "w-4 h-4" }: { iconKey?: string; className?: string }) {
  if (!iconKey) return <ClipboardList className={className} />;

  switch (iconKey) {
    case "flask":
      return <FlaskConical className={className} />;
    case "rocket":
      return <Rocket className={className} />;
    case "palette":
      return <Palette className={className} />;
    case "package":
      return <Package className={className} />;
    case "lightbulb":
      return <Lightbulb className={className} />;
    case "clipboard":
      return <ClipboardList className={className} />;
    case "flame":
    case "zap":
      return <Flame className={className} />;
    case "search":
      return <Search className={className} />;
    case "pin":
      return <Pin className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "BACKLOG":
      return <CircleDashed className={className} />;
    case "INTAKE":
    case "TODO":
      return <Circle className={className} />;
    case "IN_PROGRESS":
    case "ONBOARDING":
      return <Clock className={className} />;
    case "IN_REVIEW":
      return <GitPullRequest className={className} />;
    case "QA":
      return <FlaskConical className={className} />;
    case "BLOCKED":
    case "PAUSED":
      return <AlertOctagon className={className} />;
    case "DONE":
    case "ACTIVE":
      return <CheckCircle2 className={className} />;
    case "CHURNED":
      return <Circle className={className} />;
    default:
      return <ClipboardList className={className} />;
  }
}
