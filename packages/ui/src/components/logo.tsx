"use client";

import { cn } from "../lib/utils";

export interface LogoProps {
  className?: string;
  variant?: "full" | "mark";
  collapsed?: boolean;
}

export function Logo({ className, variant = "full", collapsed = false }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm shadow-primary/20 shrink-0 overflow-hidden text-primary-foreground">
        <svg
          width="20"
          height="20"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 transition-transform duration-300 group-hover:scale-105"
        >
          <path
            d="M6 5.5C6 4.67157 6.67157 4 7.5 4H24.5C25.3284 4 26 4.67157 26 5.5V9C26 9.57863 25.6669 10.1042 25.1481 10.3543L13.7226 15.8613L25.2631 21.6316C25.7171 21.8586 26 22.3229 26 22.8293V26.5C26 27.3284 25.3284 28 24.5 28H7.5C6.67157 28 6 27.3284 6 26.5V23C6 22.4214 6.3331 21.8958 6.8519 21.6457L18.2774 16.1387L6.7369 10.3684C6.2829 10.1414 6 9.6771 6 9.1707V5.5Z"
            fill="currentColor"
          />
        </svg>
      </span>

      {variant === "full" && (
        <div
          className={cn(
            "flex items-center gap-1.5 transition-all duration-300 cubic-bezier(0.2,0,0,1) whitespace-nowrap overflow-hidden",
            collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[160px] opacity-100"
          )}
        >
          <span className="font-extrabold text-base tracking-wider text-foreground font-display">
            ZSYIO
          </span>
        </div>
      )}
    </span>
  );
}
