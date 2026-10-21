"use client";

import React, { useEffect } from "react";
import { Menu, X, Search, ChevronDown, LogOut } from "lucide-react";
import { AppSwitcher } from "./AppSwitcher";
import { ThemeToggle } from "../components/theme-toggle";
import { AccentPicker } from "../components/accent-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { motion, transitions } from "../components/motion";
import { cn } from "../lib/utils";

export interface SuiteHeaderUser {
  name: string;
  role: string;
  email?: string;
  image?: string | null;
}

export interface SuiteHeaderProps {
  currentApp: "admin" | "pms" | "hrms" | "notes" | "sales" | "recruit";
  currentTitle?: string;
  user: SuiteHeaderUser;
  allowedApps?: ("admin" | "pms" | "hrms" | "notes" | "sales" | "recruit")[];
  mobileOpen?: boolean;
  onMenuClick?: () => void;
  searchPlaceholder?: string;
  onSearchClick?: () => void;
  searchSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  profileMenuItemsSlot?: React.ReactNode;
  onSignOut?: () => void;
  className?: string;
}

export function SuiteHeader({
  currentApp,
  currentTitle,
  user,
  allowedApps,
  mobileOpen = false,
  onMenuClick,
  searchPlaceholder = "Quick search...",
  onSearchClick,
  searchSlot,
  actionsSlot,
  profileMenuItemsSlot,
  onSignOut,
  className,
}: SuiteHeaderProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (onSearchClick) {
          e.preventDefault();
          onSearchClick();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchClick]);

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <header
      className={cn(
        "relative min-h-16 border-b border-border bg-background px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 z-20 transition-colors",
        className,
      )}
    >
      {/* Left: Mobile Toggle + Suite AppSwitcher + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-initial">
        {onMenuClick && (
          <motion.button
            type="button"
            onClick={onMenuClick}
            whileTap={{ scale: 0.92 }}
            className="lg:hidden p-2 rounded-md border border-border/80 bg-surface-subtle/80 hover:bg-surface-elevated hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </motion.button>
        )}

        <AppSwitcher currentApp={currentApp} allowedApps={allowedApps} />

        <div className="h-5 w-px bg-border hidden sm:block" />

        <nav
          aria-label="Current location"
          className="flex items-center gap-2 text-sm text-muted-foreground min-w-0"
        >
          {currentTitle && (
            <>
              <span className="font-semibold tracking-tight text-foreground truncate max-w-32 sm:max-w-48 lg:max-w-64">
                {currentTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Middle: Global Quick-Search Trigger */}
      <div className="flex-1 min-w-0 max-w-md hidden md:flex items-center justify-center lg:px-4">
        {searchSlot ? (
          searchSlot
        ) : onSearchClick ? (
          <motion.button
            type="button"
            onClick={onSearchClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={transitions.micro}
            className="flex h-10 items-center gap-2.5 px-3 rounded-lg border border-border bg-surface-subtle/60 hover:bg-surface-elevated hover:border-primary/40 text-sm text-muted-foreground w-full transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
            <span className="flex-1 text-left truncate">
              {searchPlaceholder}
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono font-semibold text-muted-foreground bg-background/90 border border-border/80 rounded shrink-0 shadow-2xs">
              Ctrl / ⌘ K
            </kbd>
          </motion.button>
        ) : null}
      </div>

      {/* Right: Actions + ThemeToggle + User Profile Dropdown */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {onSearchClick && !searchSlot && (
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Open quick search"
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-subtle hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        {actionsSlot}

        <AccentPicker />
        <ThemeToggle className="focus-visible:ring-2 focus-visible:ring-primary" />

        <div
          aria-hidden="true"
          className="hidden sm:block h-6 w-px bg-border mx-1"
        />

        {/* User Profile Card Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={transitions.micro}
              aria-label={`Open account menu for ${user.name}`}
              className="flex items-center gap-2.5 p-1 sm:pr-2 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative w-7 h-7 rounded-md bg-primary-light text-primary border border-primary/25 flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs overflow-hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <span className="font-mono">{initials}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success shadow-xs border border-card" />
              </div>
              <div className="hidden lg:flex flex-col gap-0.5 text-left leading-tight">
                <span className="font-semibold text-xs text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground font-normal max-w-[120px] truncate">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 text-xs shadow-md rounded-xl p-1.5 border-border/80 bg-surface-elevated "
          >
            <DropdownMenuLabel className="p-2">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden shadow-xs">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <span className="font-mono">{initials}</span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success shadow-xs border border-surface-elevated" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {user.name}
                  </span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  )}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary-light text-primary border border-primary/20 w-fit mt-0.5">
                    {user.role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            {profileMenuItemsSlot && (
              <>
                <DropdownMenuSeparator />
                {profileMenuItemsSlot}
              </>
            )}

            {onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="p-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-md font-semibold gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
