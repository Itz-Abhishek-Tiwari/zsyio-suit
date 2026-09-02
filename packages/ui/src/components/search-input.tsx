"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
  containerClassName?: string;
  shortcutBadge?: string;
  icon?: React.ReactNode;
}

const SIZE_CONFIG = {
  sm: {
    input: "h-8 text-xs pl-8 pr-7 rounded-lg",
    icon: "w-3.5 h-3.5 left-2.5",
    clear: "right-2 p-0.5",
    clearIcon: "w-3 h-3",
  },
  md: {
    input: "h-9 text-xs sm:text-sm pl-9 pr-8 rounded-xl",
    icon: "w-4 h-4 left-3",
    clear: "right-2.5 p-0.5",
    clearIcon: "w-3.5 h-3.5",
  },
  lg: {
    input: "h-11 text-sm pl-10 pr-9 rounded-xl",
    icon: "w-4.5 h-4.5 left-3.5",
    clear: "right-3 p-1",
    clearIcon: "w-4 h-4",
  },
};

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      size = "md",
      containerClassName,
      className,
      placeholder = "Search...",
      shortcutBadge,
      icon,
      disabled,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      if (onClear) onClear();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.stopPropagation();
        onChange("");
        if (onClear) onClear();
      }
      if (onKeyDown) onKeyDown(e);
    };

    return (
      <div className={cn("relative flex items-center w-full", containerClassName)}>
        <div
          className={cn(
            "absolute text-muted-foreground pointer-events-none flex items-center justify-center -translate-y-1/2 top-1/2",
            config.icon
          )}
        >
          {icon ?? <Search className="w-full h-full" />}
        </div>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150 shadow-2xs",
            config.input,
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          {...props}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className={cn(
                "rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center",
                config.clear
              )}
              aria-label="Clear search"
            >
              <X className={config.clearIcon} />
            </button>
          ) : shortcutBadge ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
              {shortcutBadge}
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
