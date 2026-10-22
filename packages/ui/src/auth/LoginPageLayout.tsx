import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { cn } from "../lib/utils";

export interface LoginPageFeature {
  icon: React.ReactNode;
  /** Tailwind classes applied to the icon wrapper, e.g. "bg-primary-light text-primary" */
  iconClassName?: string;
  title: string;
  description: string;
}

export interface LoginPageLayoutProps {
  // ── Left panel identity ──────────────────────────────────────────────────
  appName: string;
  appTagline: string;
  /** Icon element rendered inside the branded logo square (left panel header & mobile). */
  appIcon: React.ReactNode;
  /**
   * When provided, replaces ThemeToggle in the left panel header with a
   * green-pulse status chip (e.g. "99.99% Systems Online").
   */
  statusLabel?: string;

  // ── Left panel hero ───────────────────────────────────────────────────────
  /** Icon inside the Sparkles badge pill — defaults to <Sparkles />. */
  badgeIcon?: React.ReactNode;
  badgeText: string;
  /** Main headline — pass a string or JSX for formatted text. */
  headline: React.ReactNode;
  description: string;
  /** 2–4 feature cards displayed in a 2-column grid. */
  features: LoginPageFeature[];

  // ── Left panel footer ─────────────────────────────────────────────────────
  /** Defaults to the TLS / EU compliance line. */
  footerLeft?: React.ReactNode;
  /** Defaults to "Zsyio v1.2". */
  footerRight?: React.ReactNode;

  // ── Right panel ───────────────────────────────────────────────────────────
  formHeading: string;
  formSubtitle: string;
  /** Small security note shown below the form. */
  securityNote?: React.ReactNode;
  /** Marketing site URL for apps hosted on a separate origin. */
  productOverviewHref?: string;

  /** The per-app <LoginForm> client component. */
  children: React.ReactNode;
}

/**
 * Shared login page wrapper used by every Zsyio app.
 *
 * Renders the canonical split-panel layout:
 *   - Left  → branded hero with feature cards (hidden on mobile)
 *   - Right → form column with ThemeToggle, mobile logo, heading & {children}
 *
 * This component is server-safe (no "use client").
 */
export function LoginPageLayout({
  appName,
  appTagline,
  appIcon,
  statusLabel,
  badgeIcon,
  badgeText,
  headline,
  description,
  features,
  footerLeft,
  footerRight,
  formHeading,
  formSubtitle,
  securityNote,
  // The marketing site is its own app (apps/landing).
  productOverviewHref = process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3007",
  children,
}: LoginPageLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* Left branding hero */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] flex-col justify-between p-12 relative overflow-hidden bg-surface-subtle dark:bg-surface-subtle border-r border-border/80 text-foreground transition-colors duration-200">
        {/* Header row */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg  shrink-0 p-1.5 ring-1 ring-white/20">
              {appIcon}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-foreground font-display">
                {appName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{appTagline}</span>
            </div>
          </div>

          {statusLabel ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/90 border border-border/80 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-mono">{statusLabel}</span>
            </div>
          ) : (
            <ThemeToggle />
          )}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-start gap-8 max-w-xl my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-xs font-semibold shadow-2xs">
            {badgeIcon ?? <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{badgeText}</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-foreground font-display leading-[1.12]">
              {headline}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs hover:border-primary/40 transition-colors duration-200 ease-out"
              >
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                      feature.iconClassName ?? "bg-primary-light text-primary"
                    )}
                  >
                    {feature.icon}
                  </div>
                  <span>{feature.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer bar */}
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-4 z-10">
          {footerLeft ?? (
            <div className="flex items-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-xs">256-bit TLS · EU Data Privacy Compliant</span>
            </div>
          )}
          {footerRight ?? (
            <span className="font-mono text-xs text-muted-foreground">Zsyio v1.2</span>
          )}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14 xl:px-20 bg-background relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          <Link
            href={productOverviewHref}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle px-2.5 py-1 rounded-md transition-colors"
          >
            ← Product Overview
          </Link>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md  shrink-0 p-1.5">
              {appIcon}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-lg text-foreground font-display leading-tight">
                {appName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{appTagline}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight font-display">
              {formHeading}
            </h2>
            <p className="text-xs text-muted-foreground">{formSubtitle}</p>
          </div>

          {children}

          {securityNote && (
            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/80 mt-1">
              {securityNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
