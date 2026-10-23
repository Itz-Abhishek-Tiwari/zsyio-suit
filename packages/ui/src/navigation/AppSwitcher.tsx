"use client";

import React from "react";
import {
  ChevronDown,
  Check,
  ArrowUpRight,
  Workflow,
  FileText,
  Fingerprint,
  Terminal,
  Target,
  BriefcaseBusiness,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../components/dropdown-menu";
import { cn } from "../lib/utils";
import { SUITE_APP_URLS, getAppEntryUrl } from "../lib/app-urls";

export interface AppSuiteItem {
  id: "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit";
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  badge?: string;
  defaultUrl: string;
}


export const APPS: AppSuiteItem[] = [
  {
    id: "recruit",
    name: "Zsyio Recruit",
    tagline: "Jobs, applicants & interviews",
    icon: BriefcaseBusiness,
    color: "bg-muted text-muted-foreground",
    iconColor: "text-muted-foreground",
    defaultUrl: SUITE_APP_URLS.recruit,
  },
  {
    id: "pms",
    name: "Zsyio Flow",
    tagline: "Product workflows, tasks & clients",
    icon: Workflow,
    color:
      "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor:
      "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: SUITE_APP_URLS.pms,
  },
  {
    id: "notes",
    name: "Zsyio Canvas",
    tagline: "Docs & engineering knowledge base",
    icon: FileText,
    color:
      "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor:
      "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: SUITE_APP_URLS.notes,
  },
  {
    id: "hrms",
    name: "Zsyio People",
    tagline: "Timesheet, attendance & breaks",
    icon: Fingerprint,
    color:
      "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor:
      "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: SUITE_APP_URLS.hrms,
  },
  {
    id: "admin",
    name: "Zsyio Console",
    tagline: "User directory, roles & access control",
    icon: Terminal,
    color:
      "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor:
      "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: SUITE_APP_URLS.admin,
  },
  {
    id: "sales",
    name: "Zsyio Pulse",
    tagline: "Pipeline, CRM & Kanban leads",
    icon: Target,
    color:
      "bg-surface-subtle text-foreground-secondary border-border/80 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary transition-colors",
    iconColor:
      "text-foreground-secondary group-hover:text-primary transition-colors",
    defaultUrl: SUITE_APP_URLS.sales,
  },
];

export interface AppSwitcherProps {
  currentApp: "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit";
  allowedApps?: ("pms" | "notes" | "hrms" | "admin" | "sales" | "recruit")[];
}

export function AppSwitcher({ currentApp, allowedApps }: AppSwitcherProps) {
  const activeApp = APPS.find((app) => app.id === currentApp) || APPS[0];
  const ActiveIcon = activeApp.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Switch application, currently ${activeApp.name}`}
          className="group flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-light text-primary">
            <ActiveIcon className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">
            {activeApp.name.replace("Zsyio ", "")}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-80 max-w-[calc(100vw-24px)] rounded-xl bg-card p-2 shadow-lg"
      >
        <DropdownMenuLabel className="px-3 py-2.5">
          <span className="block text-sm font-semibold text-foreground">
            Your apps
          </span>
          <span className="block mt-1 text-xs font-normal text-muted-foreground">
            Your connected workspace.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {APPS.map((app) => {
          const isCurrent = app.id === currentApp;
          const isAllowed = !allowedApps || allowedApps.includes(app.id);
          const disabled = !isAllowed || app.badge === "Soon";
          const Icon = app.icon;
          const content = (
            <>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isCurrent
                    ? "bg-primary-light text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">
                  {app.name.replace("Zsyio ", "")}
                </span>
                <span className="block text-xs text-muted-foreground font-normal mt-0.5 leading-relaxed">
                  {app.tagline}
                </span>
              </span>
              {disabled ? (
                <Lock
                  aria-label="Restricted"
                  className="h-4 w-4 text-muted-foreground"
                />
              ) : isCurrent ? (
                <Check
                  aria-label="Current app"
                  className="h-4 w-4 text-primary"
                />
              ) : (
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground"
                />
              )}
            </>
          );
          const className = cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer",
            isCurrent && "bg-primary-light/50",
          );
          return disabled ? (
            <DropdownMenuItem key={app.id} disabled className={className}>
              {content}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={app.id} asChild className={className}>
              <a
                href={isCurrent ? app.defaultUrl : getAppEntryUrl(app.id)}
                aria-current={isCurrent ? "page" : undefined}
                onClick={(event) => {
                  if (isCurrent) event.preventDefault();
                }}
              >
                {content}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
