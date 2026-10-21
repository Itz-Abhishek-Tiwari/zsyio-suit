import { Skeleton } from "@zsyio/ui";

export default function TasksLoading() {
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

      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-border/80 bg-card shadow-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Skeleton className="h-9 w-60 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        {[
          { label: "Backlog" },
          { label: "To Do" },
          { label: "In Progress" },
          { label: "In Review" },
          { label: "Blocked" },
          { label: "Done" },
        ].map((col, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-lg border border-border/80 bg-surface-subtle/40 p-3 min-h-[520px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>

            <div className="flex flex-col gap-2.5">
              {[1, 2, idx === 0 || idx === 2 ? 3 : 0].filter(Boolean).map((cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-lg border border-border/70 bg-card p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
