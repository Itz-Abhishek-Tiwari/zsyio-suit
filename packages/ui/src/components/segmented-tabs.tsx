"use client";

import React, { useId } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { cn } from "../lib/utils";


export interface SegmentedTabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string | null;
  badgeVariant?: "default" | "primary" | "amber" | "emerald" | "rose" | "indigo";
  disabled?: boolean;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: Array<SegmentedTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  tabClassName?: string;
  animated?: boolean;
  id?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  size = "md",
  fullWidth = false,
  className,
  tabClassName,
  animated = true,
  id: customId,
}: SegmentedTabsProps<T>) {
  const autoId = useId();
  const instanceId = customId || autoId;

  const sizeClasses = {
    sm: "p-0.5 rounded-[4px] text-xs",
    md: "p-0.5 rounded-[4px] text-xs",
    lg: "p-1 rounded-[6px] text-sm",
  };

  const itemSizeClasses = {
    sm: "py-1 px-2.5 text-xs rounded-[3px] min-h-[26px]",
    md: "py-1 px-2.5 text-xs rounded-[3px] min-h-[28px]",
    lg: "py-1.5 px-3 text-sm rounded-[4px] min-h-[32px]",
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    if (enabledTabs.length === 0) return;
    const enabledIndex = enabledTabs.findIndex((t) => t.id === tabs[currentIndex].id);
    if (enabledIndex === -1) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (enabledIndex + 1) % enabledTabs.length;
      onChange(enabledTabs[nextIndex].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (enabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
      onChange(enabledTabs[prevIndex].id);
    }
  };

  return (
    <LayoutGroup id={`segmented-group-${instanceId}`}>
      <div
        role="tablist"
        className={cn(
          "relative flex items-center bg-muted/60 dark:bg-white/[0.04] border border-border/50 text-muted-foreground select-none backdrop-blur-xs",
          fullWidth ? "w-full grid" : "inline-flex w-fit",
          sizeClasses[size],
          className
        )}
        style={
          fullWidth
            ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {tabs.map((tab, idx) => {
          const isActive = value === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "group relative flex items-center justify-center gap-1.5 font-semibold transition-colors duration-100 outline-none cursor-pointer z-10 select-none",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
                tab.disabled && "opacity-40 pointer-events-none cursor-not-allowed",
                isActive
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                itemSizeClasses[size],
                tabClassName
              )}
            >
              {isActive && (
                animated ? (
                  <motion.div
                    layoutId={`segmented-active-pill-${instanceId}`}
                    className="absolute inset-0 rounded-[inherit] bg-card dark:bg-card/90 shadow-xs border border-border/70 -z-10 transform-gpu"
                    style={{ willChange: "transform" }}
                    transition={{
                      type: "tween",
                      ease: [0.16, 1, 0.3, 1],
                      duration: 0.22,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 rounded-[inherit] bg-card dark:bg-card/90 shadow-xs border border-border/70 -z-10" />
                )
              )}


            {tab.icon && (
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {tab.icon}
              </span>
            )}

            <span className="truncate">{tab.label}</span>

            {tab.count !== undefined && tab.count !== null && (
              <span
                className={cn(
                  "font-mono font-medium text-[10px] px-1.5 py-0.5 rounded-[3px] shrink-0 transition-colors",
                  isActive
                    ? tab.badgeVariant === "primary"
                      ? "bg-notion-blue text-notion-blue-fg"
                      : tab.badgeVariant === "emerald"
                      ? "bg-notion-green text-notion-green-fg"
                      : tab.badgeVariant === "amber"
                      ? "bg-notion-yellow text-notion-yellow-fg"
                      : tab.badgeVariant === "rose"
                      ? "bg-notion-red text-notion-red-fg"
                      : "bg-notion-gray text-notion-gray-fg"
                    : tab.badgeVariant === "primary"
                    ? "bg-notion-blue/60 text-notion-blue-fg"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      </div>
    </LayoutGroup>
  );
}
