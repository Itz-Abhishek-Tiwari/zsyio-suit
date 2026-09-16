import React from "react";
import { Badge } from "@zsyio/ui";

export function ProductEnvironmentBadge({
  environment,
  className,
}: {
  environment?: string | null;
  className?: string;
}) {
  if (!environment) return null;

  const envUpper = environment.toUpperCase();
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80";

  if (envUpper.includes("PROD")) {
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30";
  } else if (
    envUpper.includes("STAGE") ||
    envUpper.includes("STAGING")
  ) {
    badgeClass = "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30";
  } else if (
    envUpper.includes("TEST") ||
    envUpper.includes("QA")
  ) {
    badgeClass = "bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30";
  } else if (envUpper.includes("DEV") || envUpper.includes("LOCAL")) {
    badgeClass = "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30";
  }

  // Format label nicely: e.g. "Production", "Development", "Staging"
  const formattedLabel = environment.length <= 4 
    ? environment.toUpperCase() 
    : environment.charAt(0).toUpperCase() + environment.slice(1).toLowerCase();

  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold tracking-tight border ${badgeClass} ${className ?? ""}`}
    >
      {formattedLabel}
    </Badge>
  );
}
