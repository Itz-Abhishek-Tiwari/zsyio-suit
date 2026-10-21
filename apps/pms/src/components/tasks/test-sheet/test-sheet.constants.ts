import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock } from "lucide-react";
import type { TestCaseStatus } from "@zsyio/types";

export const STATUS_CONFIG: Record<
  TestCaseStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
    textColor: string;
    accentBorder: string;
    dotColor: string;
    pillBg: string;
  }
> = {
  PASSED: {
    label: "Passed",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    textColor: "text-success",
    accentBorder: "border-l-success/30",
    dotColor: "bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    pillBg: "hover:bg-success/20 active:bg-success/25",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    textColor: "text-destructive",
    accentBorder: "border-l-destructive/30",
    dotColor: "bg-destructive shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    pillBg: "hover:bg-destructive/20 active:bg-destructive/25",
  },
  BLOCKED: {
    label: "Blocked",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    textColor: "text-warning",
    accentBorder: "border-l-warning/30",
    dotColor: "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    pillBg: "hover:bg-warning/20 active:bg-warning/25",
  },
  SKIPPED: {
    label: "Skipped",
    icon: MinusCircle,
    color: "text-muted-foreground",
    bg: "bg-muted-foreground/10",
    border: "border-border/30",
    textColor: "text-foreground",
    accentBorder: "border-l-border",
    dotColor: "bg-muted-foreground",
    pillBg: "hover:bg-muted-foreground/20 active:bg-muted-foreground/25",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-notion-blue-fg",
    bg: "bg-notion-blue-fg/10",
    border: "border-notion-blue-fg/30",
    textColor: "text-notion-blue-fg",
    accentBorder: "border-l-notion-blue-fg/60",
    dotColor: "bg-notion-blue-fg shadow-[0_0_8px_rgba(56,189,248,0.5)]",
    pillBg: "hover:bg-notion-blue-fg/20 active:bg-notion-blue-fg/25",
  },
};

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
