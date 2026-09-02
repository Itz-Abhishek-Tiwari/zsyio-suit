"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { motion, Stagger, StaggerItem, transitions } from "./motion";

export type HeroAccentTone = "amber" | "cyan" | "emerald" | "violet" | "blue" | "rose" | "slate";

export interface HeroTelemetryMetric {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
}

export interface DashboardHeroProps {
  badge?: {
    label: string;
    icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
    variant?: HeroAccentTone;
  };
  systemStatus?: {
    label: string;
    indicator?: "online" | "warning" | "standby" | "idle";
  };
  dateString?: string;
  greeting?: string;
  userName?: string;
  userRole?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  metrics?: HeroTelemetryMetric[];
  actions?: React.ReactNode;
  accentTone?: HeroAccentTone;
  layout?: "dual-tier" | "compact";
  className?: string;
  children?: React.ReactNode;
}

const ACCENT_STYLES: Record<
  HeroAccentTone,
  {
    borderTop: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    pulseDot: string;
    pulseGlow: string;
    radialGradient: string;
    metricHighlight: string;
    metricBg: string;
    metricBorderHover: string;
  }
> = {
  blue: {
    borderTop: "before:bg-primary",
    badgeBg: "bg-primary-light dark:bg-primary/15",
    badgeText: "text-primary",
    badgeBorder: "border-primary/30",
    pulseDot: "bg-primary",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-primary",
    metricBg: "group-hover:bg-primary/[0.03]",
    metricBorderHover: "group-hover:border-primary/30",
  },
  cyan: {
    borderTop: "before:bg-blue-600",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/15",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-500/30",
    pulseDot: "bg-blue-500 dark:bg-blue-400",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    metricBg: "group-hover:bg-blue-500/[0.03]",
    metricBorderHover: "group-hover:border-blue-500/30",
  },
  amber: {
    borderTop: "before:bg-amber-500",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/15",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-500/30",
    pulseDot: "bg-amber-500 dark:bg-amber-400",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    metricBg: "group-hover:bg-amber-500/[0.03]",
    metricBorderHover: "group-hover:border-amber-500/30",
  },
  emerald: {
    borderTop: "before:bg-emerald-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    pulseDot: "bg-emerald-500 dark:bg-emerald-400",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    metricBg: "group-hover:bg-emerald-500/[0.03]",
    metricBorderHover: "group-hover:border-emerald-500/30",
  },
  violet: {
    borderTop: "before:bg-primary",
    badgeBg: "bg-primary/10 dark:bg-primary/15",
    badgeText: "text-primary",
    badgeBorder: "border-primary/30",
    pulseDot: "bg-primary",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-primary",
    metricBg: "group-hover:bg-primary/[0.03]",
    metricBorderHover: "group-hover:border-primary/30",
  },
  rose: {
    borderTop: "before:bg-rose-500",
    badgeBg: "bg-rose-500/10 dark:bg-rose-500/15",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-500/30",
    pulseDot: "bg-rose-500 dark:bg-rose-400",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    metricBg: "group-hover:bg-rose-500/[0.03]",
    metricBorderHover: "group-hover:border-rose-500/30",
  },
  slate: {
    borderTop: "before:bg-slate-400",
    badgeBg: "bg-slate-500/10 dark:bg-slate-500/15",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-500/30",
    pulseDot: "bg-slate-500 dark:bg-slate-400",
    pulseGlow: "",
    radialGradient: "",
    metricHighlight: "group-hover:text-slate-700 dark:group-hover:text-slate-300",
    metricBg: "group-hover:bg-slate-500/[0.03]",
    metricBorderHover: "group-hover:border-slate-500/30",
  },
};

function formatDisplayName(name?: string, role?: string): string {
  if (!name || name === "there" || name.toLowerCase() === "team member") {
    if (role) {
      const cleanRole = role.replace(/_/g, " ").trim();
      if (/super\s*admin/i.test(cleanRole)) return "Super Admin";
      if (/security\s*admin/i.test(cleanRole)) return "Security Admin";
      if (/admin/i.test(cleanRole)) return "Admin";
      return cleanRole;
    }
    return "Super Admin";
  }

  const trimmed = name.trim();
  if (/super\s*admin/i.test(trimmed)) return "Super Admin";
  if (/admin\s*user/i.test(trimmed)) return "Admin";

  if (trimmed.includes("@")) {
    const handle = trimmed.split("@")[0].replace(/[._-]/g, " ");
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }

  const parts = trimmed.split(" ");
  if (parts.length > 1 && parts[0].toLowerCase() === "super") {
    return trimmed;
  }
  return parts[0];
}

function renderIconNode(
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>,
  defaultClass = "w-3.5 h-3.5"
): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className={defaultClass} />;
  }
  return null;
}

export function DashboardHero({
  badge,
  systemStatus,
  dateString,
  greeting,
  userName,
  userRole,
  title,
  description,
  metrics,
  actions,
  accentTone = "blue",
  className,
  children,
}: DashboardHeroProps) {
  const styles = ACCENT_STYLES[accentTone] ?? ACCENT_STYLES.blue;

  const resolvedGreeting =
    greeting ||
    (() => {
      const hour = new Date().getHours();
      return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    })();

  const resolvedDate =
    dateString ||
    new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formattedName = formatDisplayName(userName, userRole);
  const hasMetrics = metrics && metrics.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.smooth}
      className={cn(
        "rounded-2xl border border-border/80 bg-surface-subtle/50 p-1 shadow-sm transition-all",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(1rem-1px)] border border-border/60 bg-card/95 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
          "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:z-20",
          styles.borderTop
        )}
      >
        {/* Background ambient lighting */}
        <div className={cn("absolute inset-0 pointer-events-none z-0", styles.radialGradient)} />

        {/* Subtle micro-dot technical watermark pattern */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col gap-5">
        {/* Top Status & Context Rail */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5 flex-wrap">
            {badge && (
              <span
                className={cn(
                  "text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border shadow-2xs",
                  styles.badgeBg,
                  styles.badgeText,
                  styles.badgeBorder
                )}
              >
                {renderIconNode(badge.icon, "w-3.5 h-3.5")}
                {badge.label}
              </span>
            )}

            {systemStatus && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-subtle text-[11px] font-mono font-medium text-foreground-secondary border border-border/70 shadow-2xs">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    styles.pulseDot
                  )}
                />
                {systemStatus.label}
              </span>
            )}

            {userRole && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-muted/80 text-muted-foreground border border-border/60">
                {userRole}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-subtle/80 border border-border/50 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {resolvedDate}
            </span>
          </div>
        </div>

        {/* Tier 1: Identity & Quick Action Deck */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Mission Subtitle */}
          <div className="flex flex-col gap-1.5 max-w-3xl">
            {title ? (
              title
            ) : (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-display">
                {resolvedGreeting}
                {formattedName ? (
                  <>
                    , <span className="text-foreground">{formattedName}</span>
                  </>
                ) : null}
              </h1>
            )}

            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Quick Actions Deck */}
          {actions && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0 lg:justify-end">
              {actions}
            </div>
          )}
        </div>

        {/* Tier 2: Dedicated Full-Width Telemetry HUD Strip with Stagger */}
        {hasMetrics && (
          <div className="pt-4 border-t border-border/50">
            <Stagger
              className={cn(
                "grid gap-3 sm:gap-4",
                metrics.length === 2 && "grid-cols-1 sm:grid-cols-2",
                metrics.length === 3 && "grid-cols-1 sm:grid-cols-3",
                metrics.length >= 4 && "grid-cols-2 lg:grid-cols-4"
              )}
              staggerInterval={0.05}
            >
              {metrics.map((metric, idx) => (
                <StaggerItem key={idx}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={transitions.smooth}
                    className={cn(
                      "flex flex-col gap-1.5 p-4 rounded-xl border border-border/70 bg-surface-subtle/50 transition-all group relative overflow-hidden will-change-transform shadow-2xs hover:shadow-xs",
                      styles.metricBg,
                      styles.metricBorderHover
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        {renderIconNode(metric.icon, "w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors")}
                        <span className="truncate">{metric.label}</span>
                      </span>

                      {metric.change && (
                        <span
                          className={cn(
                            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md",
                            metric.trend === "up"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : metric.trend === "down"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {metric.change}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-foreground tracking-tight transition-colors",
                          styles.metricHighlight
                        )}
                      >
                        {metric.value}
                      </span>
                    </div>

                    {metric.subtext && (
                      <span className="text-[11px] text-muted-foreground/80 font-medium leading-normal">
                        {metric.subtext}
                      </span>
                    )}
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}

        {children}
      </div>
      </div>
    </motion.div>
  );
}
