"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  CheckSquare,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredAction?: string;
  role?: string;
  className?: string;
  homeHref?: string;
  homeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showSecondaryButton?: boolean;
}

export function AccessDenied({
  title = "Access Restricted",
  description = "You do not have the required permissions to access this page or resource.",
  requiredAction,
  role,
  className,
  homeHref = "/",
  homeLabel = "Dashboard",
  secondaryHref,
  secondaryLabel,
  showSecondaryButton = false,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground shadow-xs">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>HTTP 403 Forbidden</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground mb-3">
        {title}
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(role || requiredAction) && (
        <div className="w-full max-w-md bg-surface-subtle/80 border border-border rounded-2xl p-4 mb-8 text-left shadow-xs">
          <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Permission Details</span>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
            {role && (
              <div className="flex items-center justify-between">
                <span>Current Role:</span>
                <span className="font-semibold text-foreground bg-surface-elevated px-2 py-0.5 rounded-md border border-border">
                  {role}
                </span>
              </div>
            )}
            {requiredAction && (
              <div className="flex items-center justify-between">
                <span>Required Capability:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 bg-surface-elevated px-2 py-0.5 rounded-md border border-border">
                  {requiredAction}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center mb-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2 rounded-xl h-10 px-4 font-semibold cursor-pointer border-border hover:bg-surface-elevated"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </Button>

        {showSecondaryButton && secondaryHref && (
          <Button asChild variant="secondary" className="gap-2 rounded-xl h-10 px-4 font-semibold">
            <Link href={secondaryHref}>
              <CheckSquare className="w-4 h-4" />
              <span>{secondaryLabel || "View Tasks"}</span>
            </Link>
          </Button>
        )}

        <Button asChild className="gap-2 rounded-xl h-10 px-4 font-semibold shadow-xs">
          <Link href={homeHref}>
            <LayoutDashboard className="w-4 h-4" />
            <span>{homeLabel}</span>
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-subtle px-3.5 py-2 rounded-xl border border-border/60">
        <Mail className="w-3.5 h-3.5 text-primary" />
        <span>Need higher access? Contact your workspace Administrator.</span>
      </div>
    </div>
  );
}
