"use client";
import { cn } from "../lib/utils";
export interface LogoProps { className?: string; variant?: "full" | "mark"; collapsed?: boolean; }
/** A geometric Z mark paired with the suite wordmark. */
export function Logo({ className, variant = "full", collapsed = false }: LogoProps) {
  return <span className={cn("suite-logo inline-flex items-center gap-2.5 select-none", className)}>
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="shrink-0 text-primary">
      <path d="M6 7H31V13L16 27H31V34H6V28L21 14H6V7Z" fill="currentColor"/><path d="M33 3H39V9H33V3Z" fill="currentColor" opacity=".5"/>
    </svg>
    {variant === "full" && <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-150", collapsed ? "max-w-0 opacity-0" : "max-w-[170px] opacity-100")}>
      <span className="text-[20px] font-semibold tracking-[-0.055em] text-foreground" style={{fontFamily:"Arial, Helvetica, sans-serif"}}>zsyio<span className="text-primary">.</span></span>
    </span>}
  </span>;
}
