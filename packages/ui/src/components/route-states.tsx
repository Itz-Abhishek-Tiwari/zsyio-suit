"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, AlertTriangle, Compass, FileQuestion, Home, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { CardGridSkeleton } from "./loading-skeleton";

type RouteError = Error & { digest?: string };

function ErrorDigest({ digest }: { digest?: string }) {
  if (!digest) return null;
  return (
    <p className="text-xs font-mono text-muted-foreground/60 mb-6 bg-surface-subtle px-3 py-1 rounded-md border border-border">
      Error Digest: {digest}
    </p>
  );
}

/** Full-screen fallback for an app's root `error.tsx`. */
export function RouteErrorScreen({
  error,
  reset,
  homeLabel = "Return to Dashboard",
}: {
  error: RouteError;
  reset: () => void;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-background text-foreground animate-fade-in">
      <div className="w-14 h-14 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-xs">
        <AlertOctagon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An unexpected error occurred while loading this view. Try again, or go back to the dashboard.
      </p>
      <ErrorDigest digest={error.digest} />
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="outline" className="gap-2 font-semibold h-10">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Try Again</span>
        </Button>
        <Button asChild className="gap-2 font-semibold h-10 shadow-xs">
          <Link href="/">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{homeLabel}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** In-shell fallback for a `(dashboard)/error.tsx`: the sidebar and header stay usable. */
export function SectionError({
  error,
  reset,
  homeLabel = "Overview",
}: {
  error: RouteError;
  reset: () => void;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error("Section error:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-border shadow-xs animate-fade-in my-6">
      <div className="w-12 h-12 rounded-md bg-warning/10 text-warning flex items-center justify-center mb-4 border border-warning/20">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-display font-semibold tracking-tight mb-2">Unable to load this section</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Something went wrong while loading this section. The rest of the app still works.
      </p>
      <ErrorDigest digest={error.digest} />
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="outline" size="sm" className="gap-2 font-semibold h-9 rounded-md">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Retry</span>
        </Button>
        <Button asChild size="sm" className="gap-2 font-semibold h-9 shadow-xs rounded-md">
          <Link href="/">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>{homeLabel}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** In-shell 404 for a `(dashboard)/not-found.tsx`, so `notFound()` keeps the sidebar and header. */
export function SectionNotFound({ homeLabel = "Back to overview" }: { homeLabel?: string }) {
  return (
    <EmptyState
      size="lg"
      icon={<FileQuestion className="h-6 w-6" aria-hidden="true" />}
      title="Page not found"
      description="This page or record doesn't exist, or you don't have access to it."
      action={
        <Button asChild>
          <Link href="/">{homeLabel}</Link>
        </Button>
      }
    />
  );
}

/** Generic page skeleton for a `(dashboard)/loading.tsx`: a page header and a card grid. */
export function SectionLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-6 animate-fade-in" role="status" aria-label={label}>
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-7 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <CardGridSkeleton count={6} columns={3} />
    </div>
  );
}

/** Shown when a list or board request failed, instead of an empty state that looks like "no data". */
export function LoadErrorState({
  title = "Couldn't load this data",
  description = "Check your connection and try again.",
  onRetry,
  size = "md",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <EmptyState
      size={size}
      icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" className="gap-2" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
