"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowUpRight, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { APPS } from "../navigation/AppSwitcher";
import { cn } from "../lib/utils";

export interface AccessRestrictedProps {
  currentApp: "pms" | "notes" | "hrms" | "admin" | "sales";
  role?: string;
  userEmail?: string;
  allowedApps?: ("pms" | "notes" | "hrms" | "admin" | "sales")[];
  className?: string;
}

export function AccessRestricted({
  currentApp,
  role = "User",
  userEmail,
  allowedApps = [],
  className,
}: AccessRestrictedProps) {
  const targetApp = APPS.find((a) => a.id === currentApp) || APPS[0];
  const TargetIcon = targetApp.icon;

  const accessibleApps = APPS.filter(
    (app) => app.id !== currentApp && allowedApps.includes(app.id)
  );

  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background text-foreground animate-fade-in select-none",
        className
      )}
    >
      <div className="w-full max-w-lg flex flex-col items-center text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 dark:bg-destructive/15 text-destructive flex items-center justify-center ring-1 ring-destructive/25 shadow-xl shadow-destructive/5">
            <TargetIcon className="w-10 h-10 opacity-70" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-destructive shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Restricted Workspace Clearance</span>
        </div>

        {/* Heading & Context */}
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-foreground mb-2">
          Access Restricted
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
          Your account {userEmail ? <span className="font-semibold text-foreground font-mono">({userEmail})</span> : null}{" "}
          with role <span className="font-bold text-foreground uppercase tracking-wide font-mono bg-surface-subtle px-1.5 py-0.5 rounded border border-border/80">{role}</span> does
          not have clearance to access <span className="font-bold text-foreground">{targetApp.name}</span>.
        </p>

        {/* Available Workspaces */}
        {accessibleApps.length > 0 && (
          <div className="w-full bg-surface-subtle/80 border border-border/80 rounded-2xl p-4 mb-6 text-left shadow-xs">
            <div className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
              <span>Your Authorized Applications</span>
              <span className="text-[10px] text-muted-foreground font-mono font-normal">
                {accessibleApps.length} available
              </span>
            </div>

            <div className="space-y-2">
              {accessibleApps.map((app) => {
                const Icon = app.icon;
                return (
                  <a
                    key={app.id}
                    href={app.defaultUrl}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:bg-surface-elevated hover:border-primary/40 transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl border ${app.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {app.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-normal">
                          {app.tagline}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all shrink-0 ml-2" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {accessibleApps.length > 0 ? (
            <Button asChild className="gap-2 rounded-xl font-semibold shadow-xs">
              <a href={accessibleApps[0].defaultUrl}>
                <span>Go to {accessibleApps[0].name.replace("Zsyio ", "")}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2 rounded-xl font-semibold cursor-pointer border-border hover:bg-surface-elevated"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          )}

          <Button asChild variant="outline" className="gap-2 rounded-xl font-semibold border-border hover:bg-surface-elevated">
            <Link href="/login">
              <LogOut className="w-4 h-4 text-muted-foreground" />
              <span>Switch Account</span>
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-[11px] text-muted-foreground mt-8">
          Need access to this application? Contact your Zsyio organization administrator to request capability clearance.
        </p>
      </div>
    </div>
  );
}
