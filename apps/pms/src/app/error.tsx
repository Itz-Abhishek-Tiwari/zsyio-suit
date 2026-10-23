"use client";

import { RouteErrorScreen } from "@zsyio/ui";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorScreen error={error} reset={reset} homeLabel="Return to Dashboard" />;
}
