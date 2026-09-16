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
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/30 dark:border-emerald-500/30",
    textColor: "text-emerald-700 dark:text-emerald-300",
    accentBorder: "border-l-emerald-500",
    dotColor: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    pillBg: "hover:bg-emerald-500/20 active:bg-emerald-500/25",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    border: "border-rose-500/30 dark:border-rose-500/30",
    textColor: "text-rose-700 dark:text-rose-300",
    accentBorder: "border-l-rose-500",
    dotColor: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    pillBg: "hover:bg-rose-500/20 active:bg-rose-500/25",
  },
  BLOCKED: {
    label: "Blocked",
    icon: AlertTriangle,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/30 dark:border-amber-500/30",
    textColor: "text-amber-700 dark:text-amber-300",
    accentBorder: "border-l-amber-500",
    dotColor: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    pillBg: "hover:bg-amber-500/20 active:bg-amber-500/25",
  },
  SKIPPED: {
    label: "Skipped",
    icon: MinusCircle,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10 dark:bg-slate-500/15",
    border: "border-slate-500/30 dark:border-slate-500/30",
    textColor: "text-slate-700 dark:text-slate-300",
    accentBorder: "border-l-slate-400",
    dotColor: "bg-slate-400",
    pillBg: "hover:bg-slate-500/20 active:bg-slate-500/25",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:bg-sky-500/15",
    border: "border-sky-500/30 dark:border-sky-500/30",
    textColor: "text-sky-700 dark:text-sky-300",
    accentBorder: "border-l-sky-500/60",
    dotColor: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]",
    pillBg: "hover:bg-sky-500/20 active:bg-sky-500/25",
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
