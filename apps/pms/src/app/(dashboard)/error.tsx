"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@zsyio/ui";
import { AlertTriangle, RotateCcw, Compass } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-border shadow-xs animate-fade-in my-6">
      <div className="w-12 h-12 rounded-md bg-warning/10 text-warning flex items-center justify-center mb-4 border border-warning/20">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-display font-semibold tracking-tight mb-2">Unable to load this section</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        There was an issue processing your request in this section. The rest of the dashboard remains operational.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/60 mb-6 bg-surface-subtle px-3 py-1 rounded-md border border-border">
          Error Digest: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="outline" size="sm" className="gap-2 font-semibold h-9 rounded-md">
          <RotateCcw className="w-4 h-4" />
          <span>Retry</span>
        </Button>
        <Button asChild size="sm" className="gap-2 font-semibold h-9 shadow-xs rounded-md">
          <Link href="/">
            <Compass className="w-4 h-4" />
            <span>Overview</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
