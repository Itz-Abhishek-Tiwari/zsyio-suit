import { Skeleton, CardGridSkeleton } from "@zsyio/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in" role="status" aria-label="Loading Recruit">
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-7 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <CardGridSkeleton count={6} columns={3} />
    </div>
  );
}
