"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  ArrowUpRight,
  Workflow,
  FileText,
  Fingerprint,
  Terminal,
  Target,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence, transitions, Stagger, StaggerItem } from "../components/motion";
import { cn } from "../lib/utils";

export interface AppSuiteItem {
  id: "pms" | "notes" | "hrms" | "admin" | "sales";
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  badge?: string;
  defaultUrl: string;
}

function sanitizeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.trim().replace(/\/+$/, "");
}

export const APPS: AppSuiteItem[] = [
  {
    id: "pms",
    name: "Zsyio Flow",
    tagline: "Product workflows, tasks & clients",
    icon: Workflow,
    color: "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor: "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: sanitizeUrl(process.env.NEXT_PUBLIC_PMS_URL, "http://localhost:3000"),
  },
  {
    id: "notes",
    name: "Zsyio Canvas",
    tagline: "Docs & engineering knowledge base",
    icon: FileText,
    color: "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor: "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: sanitizeUrl(process.env.NEXT_PUBLIC_NOTES_URL, "http://localhost:3001"),
  },
  {
    id: "hrms",
    name: "Zsyio People",
    tagline: "Timesheet, attendance & breaks",
    icon: Fingerprint,
    color: "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor: "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: sanitizeUrl(process.env.NEXT_PUBLIC_HRMS_URL, "http://localhost:3002"),
  },
  {
    id: "admin",
    name: "Zsyio Console",
    tagline: "User directory, roles & access control",
    icon: Terminal,
    color: "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor: "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: sanitizeUrl(process.env.NEXT_PUBLIC_ADMIN_URL, "http://localhost:3003"),
  },
  {
    id: "sales",
    name: "Zsyio Pulse",
    tagline: "Pipeline, CRM & Kanban leads",
    icon: Target,
    color: "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor: "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: sanitizeUrl(process.env.NEXT_PUBLIC_SALES_URL, "http://localhost:3005"),
  },
];

export interface AppSwitcherProps {
  currentApp: "pms" | "notes" | "hrms" | "admin" | "sales";
  allowedApps?: ("pms" | "notes" | "hrms" | "admin" | "sales")[];
}

export function AppSwitcher({ currentApp, allowedApps }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeApp = APPS.find((a) => a.id === currentApp) || APPS[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={transitions.micro}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-surface-subtle/80 hover:bg-surface-elevated hover:text-foreground transition-all border border-border/80 hover:border-primary/40 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        title="Zsyio App Switcher"
        aria-expanded={isOpen}
      >
        <LayoutGrid className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeApp.iconColor}`} />
        <span className="hidden sm:inline font-bold text-foreground text-xs tracking-tight">{activeApp.name.replace("Zsyio ", "")}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={transitions.snappy}
            className="absolute left-0 mt-2.5 w-84 rounded-2xl bg-surface-subtle/90 border border-border/80 shadow-2xl z-50 p-1.5 text-foreground backdrop-blur-2xl origin-top-left"
          >
            <div className="rounded-xl bg-card border border-border/60 p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="px-2.5 py-2 border-b border-border/60 mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">ZSYIO SUITE</p>
                  <p className="text-xs font-medium text-foreground">Switch workspace application</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
              </div>

              <Stagger className="space-y-1.5" staggerInterval={0.03}>
                {APPS.map((app) => {
                  const isCurrent = app.id === currentApp;
                  const isAllowed = !allowedApps || allowedApps.includes(app.id);
                  const Icon = app.icon;
                  return (
                    <StaggerItem key={app.id}>
                      <motion.a
                        href={app.badge === "Soon" || !isAllowed ? "#" : app.defaultUrl}
                        onClick={(e) => {
                          if (app.badge === "Soon" || isCurrent || !isAllowed) {
                            e.preventDefault();
                            if (isCurrent) setIsOpen(false);
                          }
                        }}
                        whileHover={isAllowed ? { x: 2 } : undefined}
                        whileTap={isAllowed ? { scale: 0.98 } : undefined}
                        transition={transitions.micro}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isCurrent
                            ? "bg-surface-subtle border border-primary/25 shadow-2xs"
                            : !isAllowed
                            ? "opacity-45 cursor-not-allowed hover:bg-surface-subtle/30 border border-transparent"
                            : app.badge === "Soon"
                            ? "opacity-60 cursor-not-allowed hover:bg-surface-subtle/50 border border-transparent"
                            : "hover:bg-surface-subtle hover:border-border/60 border border-transparent cursor-pointer"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                          app.color,
                          !isAllowed && "grayscale opacity-75"
                        )}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground tracking-tight">{app.name}</span>
                            {app.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-muted text-muted-foreground border border-border/80">
                                {app.badge}
                              </span>
                            )}
                            {!isAllowed && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-muted/80 text-muted-foreground border border-border/80 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Restricted
                              </span>
                            )}
                            {isCurrent && (
                              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md border bg-primary/10 border-primary/20 text-primary font-mono uppercase tracking-wider">
                                Active
                              </span>
                            )}
                            {!isCurrent && isAllowed && !app.badge && (
                              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            {!isCurrent && !isAllowed && (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground/60 ml-auto" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{app.tagline}</p>
                        </div>
                      </motion.a>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
