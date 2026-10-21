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
  let badgeClass = "bg-muted text-foreground border-border/90";

  if (envUpper.includes("PROD")) {
    badgeClass = "bg-success-light text-success border-success/90";
  } else if (
    envUpper.includes("STAGE") ||
    envUpper.includes("STAGING")
  ) {
    badgeClass = "bg-warning-light text-warning border-warning/90";
  } else if (
    envUpper.includes("TEST") ||
    envUpper.includes("QA")
  ) {
    badgeClass = "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/90";
  } else if (envUpper.includes("DEV") || envUpper.includes("LOCAL")) {
    badgeClass = "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/90";
  }

  // Format label nicely: e.g. "Production", "Development", "Staging"
  const formattedLabel = environment.length <= 4 
    ? environment.toUpperCase() 
    : environment.charAt(0).toUpperCase() + environment.slice(1).toLowerCase();

  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold tracking-tight border ${badgeClass} ${className ?? ""}`}
    >
      {formattedLabel}
    </Badge>
  );
}
