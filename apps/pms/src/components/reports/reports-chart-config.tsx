import {
  Boxes,
  Bug,
  LifeBuoy,
  Sliders,
  Rocket,
  Wrench,
  Paintbrush,
  Layers,
} from "lucide-react";
import { PRIORITY_COLORS } from "@/lib/chart-tokens";

export const PRIORITY_COLOR_MAP = PRIORITY_COLORS;

export interface TaskTypeConfig {
  label: string;
  icon: React.ReactNode;
  barBg: string;
}

export const TASK_TYPE_CONFIG: Record<string, TaskTypeConfig> = {
  FEATURE: {
    label: "Feature",
    icon: <Boxes className="w-3.5 h-3.5 text-notion-blue-fg" />,
    barBg: "bg-notion-blue-fg",
  },
  BUG: {
    label: "Bug",
    icon: <Bug className="w-3.5 h-3.5 text-destructive" />,
    barBg: "bg-destructive",
  },
  SUPPORT_REQUEST: {
    label: "Support",
    icon: <LifeBuoy className="w-3.5 h-3.5 text-notion-blue-fg" />,
    barBg: "bg-notion-blue-fg",
  },
  CUSTOMIZATION: {
    label: "Custom",
    icon: <Sliders className="w-3.5 h-3.5 text-warning" />,
    barBg: "bg-warning",
  },
  DEPLOYMENT: {
    label: "Deploy",
    icon: <Rocket className="w-3.5 h-3.5 text-success" />,
    barBg: "bg-success",
  },
  MAINTENANCE: {
    label: "Infra",
    icon: <Wrench className="w-3.5 h-3.5 text-muted-foreground" />,
    barBg: "bg-muted-foreground",
  },
  NEW_DESIGN: {
    label: "New Design",
    icon: <Paintbrush className="w-3.5 h-3.5 text-notion-purple-fg" />,
    barBg: "bg-notion-purple-fg",
  },
  DESIGN_CHANGE: {
    label: "Design Changes",
    icon: <Layers className="w-3.5 h-3.5 text-notion-pink-fg" />,
    barBg: "bg-notion-pink-fg",
  },
  DESIGN_CHANGES: {
    label: "Design Changes",
    icon: <Layers className="w-3.5 h-3.5 text-notion-pink-fg" />,
    barBg: "bg-notion-pink-fg",
  },
};
