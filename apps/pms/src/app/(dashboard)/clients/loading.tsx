import { Skeleton } from "@zsyio/ui";

export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card shadow-xs"
          >
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border/80 bg-card shadow-xs">
        <Skeleton className="h-9 w-full sm:w-80 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div className="h-1 w-full bg-muted" />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-sm" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-44 rounded-md" />
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-24 rounded-md" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
