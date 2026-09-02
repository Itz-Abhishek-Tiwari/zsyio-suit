"use client";

import React, { useEffect } from "react";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Command,
  LogOut,
} from "lucide-react";
import { AppSwitcher } from "./AppSwitcher";
import { ThemeToggle } from "../components/theme-toggle";
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
  currentApp: "admin" | "pms" | "hrms" | "notes" | "sales";
  currentTitle?: string;
  user: SuiteHeaderUser;
  allowedApps?: ("admin" | "pms" | "hrms" | "notes" | "sales")[];
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

const APP_DISPLAY_NAMES: Record<SuiteHeaderProps["currentApp"], string> = {
  pms: "Flow",
  notes: "Canvas",
  hrms: "People",
  admin: "Console",
  sales: "Pulse",
};

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
        "relative h-14 border-b border-border/80 suite-header-gradient px-4 flex items-center justify-between gap-4 select-none shrink-0 z-20 transition-colors",
        className
      )}
    >

      {/* Left: Mobile Toggle + Suite AppSwitcher + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <motion.button
            type="button"
            onClick={onMenuClick}
            whileTap={{ scale: 0.92 }}
            className="lg:hidden p-2 rounded-lg border border-border/80 bg-surface-subtle/80 hover:bg-surface-elevated hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>
        )}

        <AppSwitcher currentApp={currentApp} allowedApps={allowedApps} />

        <div className="h-4 w-px bg-border/80 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span className="font-semibold text-foreground/90 tracking-tight">{APP_DISPLAY_NAMES[currentApp]}</span>
          {currentTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              <span className="font-medium text-foreground truncate max-w-[200px]">{currentTitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Middle: Global Quick-Search Trigger */}
      <div className="flex-1 max-w-sm hidden md:flex items-center justify-center px-4">
        {searchSlot ? (
          searchSlot
        ) : onSearchClick ? (
          <motion.button
            type="button"
            onClick={onSearchClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={transitions.micro}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/80 bg-surface-subtle/70 hover:bg-surface-elevated hover:border-primary/40 text-xs text-muted-foreground w-full max-w-xs transition-all shadow-2xs cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
            <span className="flex-1 text-left truncate">{searchPlaceholder}</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-background/90 border border-border/80 rounded shrink-0 shadow-2xs">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </motion.button>
        ) : null}
      </div>

      {/* Right: Actions + ThemeToggle + User Profile Dropdown */}
      <div className="flex items-center gap-2">
        {actionsSlot}

        <ThemeToggle />

        {/* User Profile Card Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={transitions.micro}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-lg border border-border/80 hover:border-primary/40 bg-surface-subtle/60 hover:bg-surface-elevated transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative w-7 h-7 rounded-lg bg-primary-light text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="font-mono">{initials}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 shadow-xs border-2 border-card" />
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="font-semibold text-xs text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium truncate">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 text-xs shadow-xl rounded-xl p-1.5 border-border/80 bg-surface-elevated backdrop-blur-xl">
            <DropdownMenuLabel className="p-2">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="font-mono">{initials}</span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 shadow-xs border-2 border-surface-elevated" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-xs text-foreground truncate">{user.name}</span>
                  {user.email && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </span>
                  )}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-light text-primary border border-primary/20 w-fit mt-0.5">
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
                  className="p-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg font-semibold gap-2"
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
