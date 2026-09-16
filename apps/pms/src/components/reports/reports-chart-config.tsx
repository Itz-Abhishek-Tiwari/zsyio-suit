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
    icon: <Boxes className="w-3.5 h-3.5 text-cyan-500" />,
    barBg: "bg-cyan-500",
  },
  BUG: {
    label: "Bug",
    icon: <Bug className="w-3.5 h-3.5 text-red-500" />,
    barBg: "bg-red-500",
  },
  SUPPORT_REQUEST: {
    label: "Support",
    icon: <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />,
    barBg: "bg-blue-500",
  },
  CUSTOMIZATION: {
    label: "Custom",
    icon: <Sliders className="w-3.5 h-3.5 text-amber-500" />,
    barBg: "bg-amber-500",
  },
  DEPLOYMENT: {
    label: "Deploy",
    icon: <Rocket className="w-3.5 h-3.5 text-emerald-500" />,
    barBg: "bg-emerald-500",
  },
  MAINTENANCE: {
    label: "Infra",
    icon: <Wrench className="w-3.5 h-3.5 text-gray-500" />,
    barBg: "bg-gray-500",
  },
  NEW_DESIGN: {
    label: "New Design",
    icon: <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />,
    barBg: "bg-indigo-500",
  },
  DESIGN_CHANGE: {
    label: "Design Changes",
    icon: <Layers className="w-3.5 h-3.5 text-pink-500" />,
    barBg: "bg-pink-500",
  },
  DESIGN_CHANGES: {
    label: "Design Changes",
    icon: <Layers className="w-3.5 h-3.5 text-pink-500" />,
    barBg: "bg-pink-500",
  },
};
