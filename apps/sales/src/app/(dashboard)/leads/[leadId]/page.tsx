import { Suspense } from "react";
import { SalesLeadDetail } from "@/components/leads/SalesLeadDetail";
import { Skeleton } from "@zsyio/ui";

export const metadata = {
  title: "Lead Details - Zsyio Pulse",
  description: "View and manage sales lead information, activities, and deal status.",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          </div>
        </div>
      }
    >
      <SalesLeadDetail leadId={leadId} />
    </Suspense>
  );
}
