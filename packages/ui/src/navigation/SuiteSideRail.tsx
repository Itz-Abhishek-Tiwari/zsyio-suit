"use client";

import React, { useState, useEffect } from "react";
import {
  Workflow,
  FileText,
  Fingerprint,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Terminal,
  Target,
  BriefcaseBusiness,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../components/tooltip";
import { motion, AnimatePresence, transitions } from "../components/motion";
import { cn } from "../lib/utils";

export interface SuiteAppConfig {
  id: "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit";
  name: string;
  shortName: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeColor: string;
  indicatorColor: string;
  badgeBg: string;
  badgeText: string;
  defaultUrl: string;
}

function sanitizeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.trim().replace(/\/+$/, "");
}

export const SUITE_APPS: SuiteAppConfig[] = [
  {
    id: "recruit",
    name: "Zsyio Recruit",
    shortName: "Recruit",
    tagline: "Jobs, applicants & interviews",
    icon: BriefcaseBusiness,
    accentColor: "hover:bg-muted",
    activeColor: "bg-primary-light text-primary",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary-light",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_RECRUIT_URL,
      "http://localhost:3006",
    ),
  },
  {
    id: "pms",
    name: "Zsyio Flow",
    shortName: "Flow",
    tagline: "Product workflows, tasks & clients",
    icon: Workflow,
    accentColor: "hover:bg-surface-subtle hover:text-foreground",
    activeColor:
      "bg-primary/12 text-primary shadow-2xs border border-primary/25",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_PMS_URL,
      "http://localhost:3000",
    ),
  },
  {
    id: "notes",
    name: "Zsyio Canvas",
    shortName: "Canvas",
    tagline: "Notion-like docs & knowledge hub",
    icon: FileText,
    accentColor: "hover:bg-surface-subtle hover:text-foreground",
    activeColor:
      "bg-primary/12 text-primary shadow-2xs border border-primary/25",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_NOTES_URL,
      "http://localhost:3001",
    ),
  },
  {
    id: "hrms",
    name: "Zsyio People",
    shortName: "People",
    tagline: "Timesheet, attendance & breaks",
    icon: Fingerprint,
    accentColor: "hover:bg-surface-subtle hover:text-foreground",
    activeColor:
      "bg-primary/12 text-primary shadow-2xs border border-primary/25",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_HRMS_URL,
      "http://localhost:3002",
    ),
  },
  {
    id: "admin",
    name: "Zsyio Console",
    shortName: "Console",
    tagline: "User directory, roles & access control",
    icon: Terminal,
    accentColor: "hover:bg-surface-subtle hover:text-foreground",
    activeColor:
      "bg-primary/12 text-primary shadow-2xs border border-primary/25",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_ADMIN_URL,
      "http://localhost:3003",
    ),
  },
  {
    id: "sales",
    name: "Zsyio Pulse",
    shortName: "Pulse",
    tagline: "Pipeline, CRM & Kanban leads",
    icon: Target,
    accentColor: "hover:bg-surface-subtle hover:text-foreground",
    activeColor:
      "bg-primary/12 text-primary shadow-2xs border border-primary/25",
    indicatorColor: "bg-primary",
    badgeBg: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
    defaultUrl: sanitizeUrl(
      process.env.NEXT_PUBLIC_SALES_URL,
      "http://localhost:3005",
    ),
  },
];

interface SuiteSideRailProps {
  currentApp: "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit";
  className?: string;
  allowedApps?: ("pms" | "notes" | "hrms" | "admin" | "sales" | "recruit")[];
}

const STORAGE_KEY = "zsyio_suite_rail_collapsed";
const CHANNEL_NAME = "zsyio-suite-rail";

function getCookieCollapsed(): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|; )zsyio_suite_rail_collapsed=([^;]*)/,
  );
  if (!match) return null;
  return match[1] === "true";
}

function setCookieCollapsed(val: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `zsyio_suite_rail_collapsed=${val}; path=/; max-age=31536000; SameSite=Lax`;
}

export function SuiteSideRail({
  currentApp,
  allowedApps,
  className,
}: SuiteSideRailProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cookieVal = getCookieCollapsed();
    if (cookieVal !== null) {
      setIsCollapsed(cookieVal);
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setIsCollapsed(saved === "true");
        }
      } catch {
        // Ignore
      }
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data && typeof event.data.collapsed === "boolean") {
          setIsCollapsed(event.data.collapsed);
        }
      };
    } catch {
      // Optional fallback
    }

    return () => {
      channel?.close();
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setCookieCollapsed(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }

      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ collapsed: next });
        channel.close();
      } catch {
        // Ignore
      }

      return next;
    });
  };

  const filteredApps = allowedApps
    ? SUITE_APPS.filter((app) => allowedApps.includes(app.id))
    : SUITE_APPS;

  return (
    <TooltipProvider delayDuration={80}>
      <AnimatePresence mode="wait" initial={false}>
        {mounted && isCollapsed ? (
          <motion.div
            key="collapsed-rail"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={transitions.smooth}
            className="hidden sm:flex flex-col items-center justify-end h-full w-4 shrink-0 border-l border-border/60 bg-background/50 hover:bg-background/80 transition-colors select-none z-30 pb-4"
          >
            <Tooltip delayDuration={60}>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  onClick={toggleCollapse}
                  aria-label="Expand Zsyio apps"
                  whileHover={{ scale: 1.12, x: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={transitions.bouncy}
                  className="w-6 h-10 -ml-2 rounded-l-md bg-surface-elevated hover:bg-surface-subtle border-y border-l border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-md hover:shadow-md transition-colors cursor-pointer group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                sideOffset={10}
                className="font-semibold text-xs py-1.5 px-3 rounded-md shadow-md"
              >
                Show Suite Rail
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ) : (
          <motion.aside
            key="expanded-rail"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 48 }}
            exit={{ opacity: 0, width: 0 }}
            transition={transitions.gentle}
            aria-label="Zsyio Companion Rail"
            className={cn(
              "hidden sm:flex flex-col items-center justify-between w-12 shrink-0 h-full border-l border-border/80 suite-rail-gradient select-none z-30 py-3.5 will-change-transform relative overflow-hidden",
              className,
            )}
          >
            {/* Top ambient radial glow */}
            <div className="absolute top-0 inset-x-0 h-32 pointer-events-none" />

            {/* Left border gradient accent */}
            <div className="absolute top-0 left-0 bottom-0 w-px pointer-events-none" />

            {/* Top App Icons Container */}
            <div className="relative flex flex-col items-center gap-3 w-full z-10">
              {filteredApps.map((app) => {
                const isCurrent = app.id === currentApp;
                const Icon = app.icon;

                return (
                  <Tooltip key={app.id} delayDuration={60}>
                    <TooltipTrigger asChild>
                      <motion.a
                        href={isCurrent ? undefined : app.defaultUrl}
                        onClick={(e) => {
                          if (isCurrent) {
                            e.preventDefault();
                          }
                        }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        transition={transitions.snappy}
                        className={cn(
                          "group relative flex flex-col items-center justify-center w-8.5 h-8.5 rounded-lg outline-none select-none cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isCurrent
                            ? app.activeColor
                            : cn(
                                "text-muted-foreground/70 hover:text-foreground hover:bg-surface-subtle/80 hover:shadow-2xs",
                                app.accentColor,
                              ),
                        )}
                      >
                        <Icon className="w-4 h-4 transition-transform " />

                        {/* Active Indicator Sliding Pill */}
                        {isCurrent && (
                          <motion.span
                            layoutId="suiteRailActiveIndicator"
                            transition={transitions.snappy}
                            className={cn(
                              "absolute -left-1.5 top-1.5 bottom-1.5 w-1 rounded-r-md",
                              app.indicatorColor,
                            )}
                          />
                        )}
                      </motion.a>
                    </TooltipTrigger>

                    <TooltipContent
                      side="left"
                      sideOffset={14}
                      className="py-2 px-3 text-left min-w-[190px] rounded-md border border-border/80 shadow-md bg-surface-elevated/95 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-foreground">
                            {app.name}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 text-xs font-semibold rounded border",
                              app.badgeBg,
                              app.badgeText,
                            )}
                          >
                            {app.shortName}
                          </span>
                        </div>
                        {isCurrent ? (
                          <span className="text-xs font-semibold text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-0.5 group-hover:text-foreground">
                            <span>Open</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {app.tagline}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Bottom Section: Collapse Toggle */}
            <div className="flex flex-col items-center w-full">
              <Tooltip delayDuration={80}>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    onClick={toggleCollapse}
                    aria-label="Collapse side panel"
                    whileHover={{ scale: 1.15, x: 1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={transitions.bouncy}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  sideOffset={12}
                  className="font-semibold text-xs py-1 px-2.5"
                >
                  Collapse panel
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
