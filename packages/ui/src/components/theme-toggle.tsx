"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card/60 shrink-0",
          size === "sm" ? "w-8 h-8" : "w-9 h-9",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      aria-label="Toggle Theme"
      className={cn(
        "rounded-xl text-muted-foreground hover:bg-card hover:text-foreground transition-colors border border-border bg-card/70 outline-none cursor-pointer shadow-2xs flex items-center justify-center shrink-0",
        size === "sm" ? "w-8 h-8" : "w-9 h-9",
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 hover:text-indigo-700 transition-colors" />
      )}
    </button>
  );
}
