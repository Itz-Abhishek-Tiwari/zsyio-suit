import { Skeleton } from "@zsyio/ui";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-52 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-md" />
            </div>

            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-14 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <Skeleton className="h-1.5 w-full rounded-sm" />
              <Skeleton className="h-3 w-36 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-md" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-60 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((p) => (
                <Skeleton key={p} className="h-12 w-full rounded-md" />
              ))}
            </div>

            <Skeleton className="h-56 w-full rounded-md" />
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>

            <div className="flex flex-col gap-2.5">
              {[1, 2, 3, 4].map((task) => (
                <div
                  key={task}
                  className="rounded-md border border-border/60 bg-surface-subtle/50 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-5 w-16 rounded-md shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-sm" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2].map((n) => (
                <Skeleton key={n} className="h-24 w-full rounded-md" />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((a) => (
                <div key={a} className="flex items-start gap-3">
                  <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-2.5 w-20 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
