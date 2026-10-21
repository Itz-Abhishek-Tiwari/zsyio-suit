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
    dotClass: "bg-notion-purple-fg",
    badgeClass: "bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/20",
  },
  ACTIVE: {
    label: "Active",
    dotClass: "bg-success",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  ONBOARDING: {
    label: "Onboarding",
    dotClass: "bg-notion-blue-fg",
    badgeClass: "bg-notion-blue-fg/10 text-notion-blue-fg border-notion-blue-fg/20",
  },
  PAUSED: {
    label: "Paused",
    dotClass: "bg-warning",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  CHURNED: {
    label: "Churned",
    dotClass: "bg-muted-foreground",
    badgeClass: "bg-muted-foreground/10 text-foreground border-border/20",
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
    dotClass: "bg-muted-foreground",
    badgeClass: "bg-muted text-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight border shrink-0 select-none transition-colors",
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

