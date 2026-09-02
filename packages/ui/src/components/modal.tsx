"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconVariant?: "primary" | "warning" | "destructive" | "emerald" | "purple" | "indigo";
  shortcutBadge?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** When true, the × close button is hidden — use for forced/blocking modals */
  hideClose?: boolean;
}

const SIZE_MAP = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

const ICON_BG_MAP = {
  primary: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

export function ModalHeader({
  title,
  description,
  icon,
  iconVariant = "primary",
  shortcutBadge,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconVariant?: keyof typeof ICON_BG_MAP;
  shortcutBadge?: string;
  className?: string;
}) {
  return (
    <DialogHeader
      className={cn(
        "px-6 py-4 border-b border-border/80 bg-surface-subtle/50 flex flex-row items-center justify-between space-y-0 text-left shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3 pr-8 min-w-0">
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center border shrink-0 shadow-xs",
              ICON_BG_MAP[iconVariant]
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <DialogTitle className="text-sm font-bold text-foreground truncate tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {description}
            </DialogDescription>
          )}
        </div>
      </div>

      {shortcutBadge && (
        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-background border border-border text-[10px] font-mono text-muted-foreground shrink-0 mr-8">
          {shortcutBadge}
        </kbd>
      )}
    </DialogHeader>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-6 flex flex-col gap-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:rgba(140,140,140,0.25)_transparent]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalFooterContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogFooter
      className={cn(
        "px-6 py-3.5 border-t border-border/60 bg-surface-subtle/40 flex items-center justify-end gap-2.5 shrink-0",
        className
      )}
    >
      {children}
    </DialogFooter>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  iconVariant = "primary",
  shortcutBadge,
  size = "md",
  children,
  footer,
  className,
  bodyClassName,
  hideClose = false,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={hideClose}
        className={cn(
          "p-0 overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl gap-0 flex flex-col max-h-[90vh] sm:max-h-[85vh]",
          SIZE_MAP[size],
          className
        )}
      >
        {(title || icon) && (
          <ModalHeader
            title={title}
            description={description}
            icon={icon}
            iconVariant={iconVariant}
            shortcutBadge={shortcutBadge}
          />
        )}
        <ModalBody className={bodyClassName}>{children}</ModalBody>
        {footer && <ModalFooterContainer>{footer}</ModalFooterContainer>}
      </DialogContent>
    </Dialog>
  );
}
