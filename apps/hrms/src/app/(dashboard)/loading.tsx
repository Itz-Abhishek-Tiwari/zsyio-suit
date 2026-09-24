import { Skeleton } from "@zsyio/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* PageHeader Skeleton */}
      <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-7 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Punch Console Hero Skeleton */}
      <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="h-12 w-52 rounded-md" />
            <Skeleton className="h-3.5 w-72 rounded-md" />
            <div className="pt-2 space-y-2">
              <Skeleton className="h-3.5 w-48 rounded-md" />
              <Skeleton className="h-2 w-full max-w-md rounded-sm" />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Skeleton className="h-11 w-32 rounded-md" />
            <Skeleton className="h-11 w-36 rounded-md" />
          </div>
        </div>

        {/* 4 KPI metric cards within hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 rounded-md border border-border/60 bg-surface-subtle/50 space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Rhythm Barometer Skeleton */}
      <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-md shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          </div>
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="grid grid-cols-7 gap-2 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* 2-Column Cockpit Widgets Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Leave Balances Skeleton */}
        <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-md shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>

        {/* Company Holidays Skeleton */}
        <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-md shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="h-20 rounded-md" />
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-md shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
