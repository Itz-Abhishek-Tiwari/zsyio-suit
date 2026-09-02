"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, ChevronRight, Plus } from "lucide-react";
import { Logo } from "../components/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { motion, transitions } from "../components/motion";
import { cn } from "../lib/utils";

export interface SuiteNavItem {
  id?: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  exact?: boolean;
  isActive?: boolean;
}

export interface SuiteNavGroup {
  title?: string;
  items: SuiteNavItem[];
}

export interface SuiteSidebarActionButton {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
}

export interface SuiteSidebarUser {
  name: string;
  role: string;
  email?: string;
  image?: string | null;
}

export interface SuiteSidebarProps {
  currentApp?: "admin" | "pms" | "hrms" | "notes" | "sales";
  navGroups: SuiteNavGroup[];
  actionButton?: SuiteSidebarActionButton;
  actionSlot?: React.ReactNode;
  user: SuiteSidebarUser;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

export function SuiteSidebar({
  currentApp: _currentApp = "admin",
  navGroups,
  actionButton,
  actionSlot,
  user,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  className,
}: SuiteSidebarProps) {
  const pathname = usePathname();

  const ActionIcon = actionButton?.icon || Plus;

  const renderNavItem = (item: SuiteNavItem) => {
    const isActive =
      item.isActive !== undefined
        ? item.isActive
        : item.exact
        ? pathname === item.href
        : item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    const Icon = item.icon;

    const linkContent = (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        onClick={onCloseMobile}
        className={cn(
          "group relative flex items-center h-9 rounded-md text-xs font-medium tracking-tight outline-none select-none cursor-pointer overflow-hidden transition-colors",
          isCollapsed ? "w-9 h-9 mx-auto justify-center px-0 gap-0" : "w-full px-3 gap-2.5",
          isActive
            ? "bg-primary-light/75 dark:bg-primary/15 text-primary font-semibold border border-primary/25 shadow-xs"
            : "text-muted-foreground hover:bg-surface-subtle/90 hover:text-foreground border border-transparent hover:border-border/60"
        )}
      >
        {isActive && (
          <motion.span
            layoutId="suiteActiveNavIndicator"
            transition={transitions.snappy}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 bg-primary",
              isCollapsed ? "-left-2 w-1 h-5 rounded-r-full" : "left-0 w-1 h-4.5 rounded-r-full"
            )}
          />
        )}

        <span
          className={cn(
            "w-5 h-5 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </span>

        {!isCollapsed && (
          <span className="flex-1 truncate transition-all duration-200 whitespace-nowrap overflow-hidden max-w-[160px] opacity-100">
            {item.label}
          </span>
        )}

        {item.badge !== undefined && !isCollapsed && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-surface-subtle text-foreground border border-border/80"
          >
            {item.badge}
          </motion.span>
        )}

        {isActive && !isCollapsed && item.badge === undefined && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} delayDuration={50}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="flex items-center gap-2 font-medium">
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="px-1 py-0.2 rounded text-[10px] bg-muted font-mono">{item.badge}</span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <div
      className={cn(
        "relative h-full flex flex-col justify-between select-none suite-sidebar-gradient border-r border-border/80 transition-[width] duration-300 cubic-bezier(0.2,0,0,1)",
        isCollapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      {/* Top Section */}
      <div className="relative flex flex-col flex-1 min-h-0 z-10">
        {/* Header Branding Slot */}
        <div
          className={cn(
            "relative h-14 shrink-0 flex items-center border-b border-border/80 transition-all duration-300 bg-surface-subtle",
            isCollapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {isCollapsed ? (
            <motion.button
              type="button"
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center justify-center cursor-pointer outline-none"
              title="Expand sidebar"
            >
              <Logo variant="mark" collapsed={true} className="transition-transform group-hover:scale-105" />
              <span className="absolute -bottom-1 -right-1.5 w-3.5 h-3.5 rounded-sm bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-border-strong transition-all shadow-xs">
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </motion.button>
          ) : (
            <>
              <Logo variant="full" collapsed={false} />
              <motion.button
                type="button"
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>

        {/* Quick Action Button Slot */}
        {actionSlot ? (
          <div className={cn("shrink-0 py-3 transition-all duration-300", isCollapsed ? "px-2" : "px-3")}>
            {actionSlot}
          </div>
        ) : actionButton ? (
          <div className={cn("shrink-0 py-3 transition-all duration-300", isCollapsed ? "px-2" : "px-3")}>
            {isCollapsed ? (
              <Tooltip delayDuration={50}>
                <TooltipTrigger asChild>
                  {actionButton.href ? (
                    <Link
                      href={actionButton.href}
                      onClick={onCloseMobile}
                      className="w-9 h-9 mx-auto rounded-md bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <ActionIcon className="w-4 h-4" />
                    </Link>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={actionButton.onClick}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-9 h-9 mx-auto rounded-md bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      <ActionIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs">
                  {actionButton.label}
                </TooltipContent>
              </Tooltip>
            ) : actionButton.href ? (
              <Link
                href={actionButton.href}
                onClick={onCloseMobile}
                className="w-full h-9 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-2 text-xs font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{actionButton.label}</span>
              </Link>
            ) : (
              <motion.button
                type="button"
                onClick={actionButton.onClick}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-9 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-2 text-xs font-semibold shadow-xs hover:shadow-sm cursor-pointer"
              >
                <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{actionButton.label}</span>
              </motion.button>
            )}
          </div>
        ) : null}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={group.title || gIdx} className="flex flex-col gap-0.5">
              {group.title && !isCollapsed && (
                <div className="px-2 pb-1 text-[10px] font-mono font-bold tracking-wider text-muted-foreground/80 uppercase">
                  {group.title}
                </div>
              )}
              {group.items.map(renderNavItem)}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
