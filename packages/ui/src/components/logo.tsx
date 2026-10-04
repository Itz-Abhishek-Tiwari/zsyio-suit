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
          {/* Top Horizontal Bar */}
          <path
            d="M6.8 5C6.08 5 5.5 5.58 5.5 6.3V9.2C5.5 9.92 6.08 10.5 6.8 10.5H19.5L24.5 5H6.8Z"
            fill="currentColor"
          />
          {/* Diagonal Spine - Upper Light Facet */}
          <path
            d="M20 5H23.5L8.5 27H6.8C6.08 27 5.5 26.42 5.5 25.7V24L20 5Z"
            fill="currentColor"
            fillOpacity={0.96}
          />
          {/* Diagonal Spine - Lower Shadow Bevel Facet */}
          <path
            d="M23.5 5H25.2C25.92 5 26.5 5.58 26.5 6.3V8L12 27H8.5L23.5 5Z"
            fill="currentColor"
            fillOpacity={0.72}
          />
          {/* Bottom Horizontal Bar */}
          <path
            d="M25.2 27C25.92 27 26.5 26.42 26.5 25.7V22.8C26.5 22.08 25.92 21.5 25.2 21.5H12.5L7.5 27H25.2Z"
            fill="currentColor"
          />
          {/* Optical Bevel Crease Line */}
          <line
            x1="23.5"
            y1="5"
            x2="8.5"
            y2="27"
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth="0.6"
            strokeLinecap="round"
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
