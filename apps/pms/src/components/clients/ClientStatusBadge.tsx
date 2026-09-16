import { cn } from "@/lib/utils";
import type { Client } from "@zsyio/types";

const STATUS_CONFIG: Record<
  Client["status"],
  {
    label: string;
    dotClass: string;
    badgeClass: string;
  }
> = {
  INTAKE: {
    label: "Intake",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  ACTIVE: {
    label: "Active",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  ONBOARDING: {
    label: "Onboarding",
    dotClass: "bg-sky-500",
    badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  },
  PAUSED: {
    label: "Paused",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  CHURNED: {
    label: "Churned",
    dotClass: "bg-slate-400 dark:bg-slate-500",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
};

export function ClientStatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: Client["status"] | string;
  className?: string;
  showDot?: boolean;
}) {
  const config = STATUS_CONFIG[status as Client["status"]] ?? {
    label: status,
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border shrink-0 select-none transition-colors",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dotClass,
            status === "ACTIVE" && "animate-pulse"
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}

