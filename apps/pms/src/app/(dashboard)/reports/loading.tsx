import { Skeleton } from "@zsyio/ui";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <Skeleton className="h-7 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-surface-subtle/70 rounded-lg border border-border/70 w-fit">
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/80 bg-card p-4.5 flex flex-col gap-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-sm" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-64 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="w-4 h-4 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
