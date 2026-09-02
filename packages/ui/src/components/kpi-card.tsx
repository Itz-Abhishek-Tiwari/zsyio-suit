"use client";

import React from "react";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { motion, transitions, AnimatedNumber } from "./motion";
import { cn } from "../lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "primary" | "emerald" | "sky" | "amber" | "rose" | "purple" | "indigo" | "default";
  subtext?: string;
  className?: string;
  href?: string;
  highlightAlert?: boolean;
  onClick?: () => void;
  /** Optional trend indicator, e.g. { value: "+12%", isPositive: true, label: "vs last month" } */
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  /** Optional custom status badge */
  badge?: React.ReactNode;
}

const VARIANT_MAP = {
  primary: {
    iconBg: "bg-primary-light text-primary border-primary/20",
    accentBar: "bg-primary",
    hoverBorder: "hover:border-primary/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    accentBar: "bg-emerald-500",
    hoverBorder: "hover:border-emerald-500/40",
  },
  sky: {
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    accentBar: "bg-sky-500",
    hoverBorder: "hover:border-sky-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    accentBar: "bg-amber-500",
    hoverBorder: "hover:border-amber-500/40",
  },
  rose: {
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    accentBar: "bg-rose-500",
    hoverBorder: "hover:border-rose-500/40",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    accentBar: "bg-purple-500",
    hoverBorder: "hover:border-purple-500/40",
  },
  indigo: {
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    accentBar: "bg-indigo-500",
    hoverBorder: "hover:border-indigo-500/40",
  },
  default: {
    iconBg: "bg-surface-subtle text-muted-foreground border-border/60",
    accentBar: "bg-border-strong",
    hoverBorder: "hover:border-border-strong",
  },
};

export function KpiCard({
  label,
  value,
  icon,
  variant = "primary",
  subtext,
  className,
  href,
  highlightAlert = false,
  onClick,
  trend,
  badge,
}: KpiCardProps) {
  const styles = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const isInteractive = Boolean(href || onClick);

  const content = (
    <>
      <div className="flex flex-col gap-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
          {isInteractive && (
            <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold font-display tracking-tight text-foreground tabular-nums truncate">
            <AnimatedNumber value={value} />
          </span>

          {trend && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={transitions.bouncy}
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                trend.isPositive !== false
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="w-3 h-3 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 shrink-0" />
              )}
              <span>{trend.value}</span>
            </motion.span>
          )}
        </div>

        {subtext && (
          <span className="text-[11px] text-muted-foreground/80 truncate flex items-center gap-1.5 mt-0.5">
            {highlightAlert && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            )}
            <span className="truncate">{subtext}</span>
          </span>
        )}
      </div>

      <div
        className={cn(
          "w-10 h-10 sm:w-11 sm:h-11 rounded-md border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110",
          highlightAlert
            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
            : styles.iconBg
        )}
      >
        {icon}
      </div>
    </>
  );

  const containerClasses = cn(
    "group relative rounded-lg border bg-card p-4 sm:p-4.5 flex items-center justify-between shadow-xs transition-all duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    highlightAlert
      ? "border-red-500/30 hover:border-red-500/50 bg-red-500/5"
      : cn("border-border/80 hover:border-primary/40", styles.hoverBorder),
    isInteractive && "cursor-pointer hover:shadow-md",
    className
  );

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={transitions.smooth}
        className={containerClasses}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={isInteractive ? { y: -2 } : undefined}
      whileTap={isInteractive ? { scale: 0.99 } : undefined}
      transition={transitions.smooth}
      className={containerClasses}
    >
      {content}
    </motion.div>
  );
}
