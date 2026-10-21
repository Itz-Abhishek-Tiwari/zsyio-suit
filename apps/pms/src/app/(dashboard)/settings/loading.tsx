import { Skeleton } from "@zsyio/ui";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <Skeleton className="h-8 w-full rounded-md" />

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <div className="flex items-center -space-x-1.5">
                <Skeleton className="h-7 w-7 rounded-full border border-card" />
                <Skeleton className="h-7 w-7 rounded-full border border-card" />
                <Skeleton className="h-7 w-7 rounded-full border border-card" />
              </div>
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
