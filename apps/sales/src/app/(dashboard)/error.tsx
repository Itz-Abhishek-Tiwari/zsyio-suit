"use client";

import { SectionError } from "@zsyio/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError error={error} reset={reset} homeLabel="Overview" />;
}
