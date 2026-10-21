"use client";

import { useEffect } from "react";
import { Button } from "@zsyio/ui";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Recruit application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-background text-foreground animate-fade-in">
      <div className="w-14 h-14 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-xs">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An unexpected error occurred while loading this view. Try again or return to Recruit.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/60 mb-6 bg-surface-subtle px-3 py-1 rounded-md border border-border">
          Error Digest: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <Button onClick={() => { window.location.href = "/"; }} className="gap-2">
          <Home className="w-4 h-4" />
          Return to Recruit
        </Button>
      </div>
    </div>
  );
}
