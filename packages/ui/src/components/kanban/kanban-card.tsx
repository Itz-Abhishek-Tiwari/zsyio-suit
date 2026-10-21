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
      "border-border/80 bg-card hover:border-border-strong hover:shadow-xs",
    urgent:
      "border-notion-red/40 bg-card hover:border-notion-red/60 hover:shadow-xs",
    warning:
      "border-notion-yellow/40 bg-card hover:border-notion-yellow/60 hover:shadow-xs",
  }[variant];

  return (
    <motion.div
      layout
      layoutId={`kanban-card-${id}`}
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12, ease: "easeOut" } }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 32,
        mass: 0.6,
      }}
      whileHover={!isDragging ? { y: -1, transition: { duration: 0.15 } } : undefined}
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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-[4px] border p-2.5 shadow-2xs transition-all duration-150 select-none",
        onClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClasses,
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging
          ? "opacity-50 scale-[0.98] border-dashed border-primary shadow-sm"
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
                <span className="font-mono text-xs font-semibold text-muted-foreground/80 group-hover:text-primary transition-colors shrink-0">
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
          <div className="text-xs text-muted-foreground/80 truncate font-medium">
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
