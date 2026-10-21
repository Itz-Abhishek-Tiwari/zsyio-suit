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
    iconBg: "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
    accentBar: "bg-primary",
    hoverBorder: "hover:border-border-strong",
  },
  emerald: {
    iconBg: "bg-notion-green text-notion-green-fg border border-notion-green/30",
    accentBar: "bg-notion-green-fg",
    hoverBorder: "hover:border-border-strong",
  },
  sky: {
    iconBg: "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
    accentBar: "bg-notion-blue-fg",
    hoverBorder: "hover:border-border-strong",
  },
  amber: {
    iconBg: "bg-notion-yellow text-notion-yellow-fg border border-notion-yellow/30",
    accentBar: "bg-notion-yellow-fg",
    hoverBorder: "hover:border-border-strong",
  },
  rose: {
    iconBg: "bg-notion-red text-notion-red-fg border border-notion-red/30",
    accentBar: "bg-notion-red-fg",
    hoverBorder: "hover:border-border-strong",
  },
  purple: {
    iconBg: "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
    accentBar: "bg-notion-purple-fg",
    hoverBorder: "hover:border-border-strong",
  },
  indigo: {
    iconBg: "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
    accentBar: "bg-notion-purple-fg",
    hoverBorder: "hover:border-border-strong",
  },
  default: {
    iconBg: "bg-notion-gray text-notion-gray-fg border border-notion-gray/30",
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
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
          {isInteractive && (
            <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-semibold font-display tracking-tight text-foreground tabular-nums truncate">
            <AnimatedNumber value={value} />
          </span>

          {trend && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={transitions.bouncy}
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
                trend.isPositive !== false
                  ? "text-success"
                  : "text-destructive"
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
          <span className="text-xs text-muted-foreground/80 truncate flex items-center gap-1.5 mt-0.5">
            {highlightAlert && (
              <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
            )}
            <span className="truncate">{subtext}</span>
          </span>
        )}
      </div>

      <div
        className={cn(
          "w-7 h-7 rounded-[6px] border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 ",
          highlightAlert
            ? "bg-destructive/10 text-destructive border-destructive/30"
            : styles.iconBg
        )}
      >
        {icon}
      </div>
    </>
  );

  const containerClasses = cn(
    "group relative rounded-[6px] border bg-card p-3.5 sm:p-4 flex items-center justify-between shadow-2xs transition-all duration-150 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    highlightAlert
      ? "border-notion-red/40 bg-notion-red/10"
      : cn("border-border/80 hover:border-border-strong", styles.hoverBorder),
    isInteractive && "cursor-pointer hover:shadow-xs",
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
