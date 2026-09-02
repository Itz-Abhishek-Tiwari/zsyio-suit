"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface KanbanCardProps {
  id: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  identifier?: React.ReactNode;
  priorityBadge?: React.ReactNode;
  actionMenu?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
  variant?: "default" | "urgent" | "warning";
  children?: React.ReactNode;
}

export function KanbanCard({
  id,
  draggable = true,
  onDragStart,
  onDragEnd,
  onClick,
  identifier,
  priorityBadge,
  actionMenu,
  title,
  subtitle,
  badges,
  avatar,
  className,
  variant = "default",
  children,
}: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const variantClasses = {
    default:
      "border-border/80 bg-card hover:border-primary/40 hover:shadow-md",
    urgent:
      "border-rose-500/40 bg-gradient-to-b from-rose-500/[0.04] to-card hover:border-rose-500/60 hover:shadow-md",
    warning:
      "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-card hover:border-amber-500/60 hover:shadow-md",
  }[variant];

  return (
    <motion.div
      layout
      layoutId={`kanban-card-${id}`}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16, ease: "easeOut" } }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        mass: 0.7,
      }}
      whileHover={!isDragging ? { y: -2, transition: { type: "spring", stiffness: 450, damping: 25 } } : undefined}
      whileTap={{ scale: 0.99 }}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        setIsDragging(true);
        onDragStart?.(e as unknown as React.DragEvent<HTMLElement>);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd?.();
      }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 shadow-2xs transition-all duration-200 select-none",
        variantClasses,
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging
          ? "opacity-50 scale-[0.98] border-dashed border-primary shadow-lg ring-2 ring-primary/20"
          : "opacity-100",
        className
      )}
    >
      {/* Top Row: Identifier chip + Priority badge + Action Menu */}
      {(identifier || priorityBadge || actionMenu) && (
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {identifier && (
              typeof identifier === "string" ? (
                <span className="font-mono text-[11px] font-bold text-muted-foreground/80 group-hover:text-primary transition-colors shrink-0">
                  {identifier}
                </span>
              ) : (
                identifier
              )
            )}
            {priorityBadge}
          </div>

          {actionMenu && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {actionMenu}
            </div>
          )}
        </div>
      )}

      {/* Main Content: Title & Subtitle */}
      <div className="flex flex-col gap-0.5">
        <div className="text-xs sm:text-[13px] font-semibold text-foreground leading-snug tracking-tight hover:text-primary transition-colors line-clamp-2">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-muted-foreground/80 truncate font-medium">
            {subtitle}
          </div>
        )}
      </div>

      {children}

      {/* Bottom Metadata Row */}
      {(badges || avatar) && (
        <div className="flex items-center justify-between gap-2 pt-2.5 mt-0.5 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-wrap">
            {badges}
          </div>

          {avatar && <div className="shrink-0 flex items-center">{avatar}</div>}
        </div>
      )}
    </motion.div>
  );
}
