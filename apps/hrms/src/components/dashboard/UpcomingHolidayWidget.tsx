"use client";

import Link from "next/link";
import { CalendarHeart, ArrowRight } from "lucide-react";
import { useGetHolidaysQuery } from "@/store/api/timesheetApi";
import { Skeleton } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import type { CompanyHoliday } from "@zsyio/types";

interface UpcomingHolidayWidgetProps {
  upcomingHoliday?: CompanyHoliday | null;
  loading?: boolean;
}

export function UpcomingHolidayWidget({
  upcomingHoliday: propHoliday,
  loading: propLoading,
}: UpcomingHolidayWidgetProps = {}) {
  const { formatDate } = useTimeZone();
  const { data: fetchedData, isLoading: queryLoading } = useGetHolidaysQuery(undefined, {
    skip: propHoliday !== undefined,
  });
  const upcoming = propHoliday !== undefined ? propHoliday : fetchedData?.upcoming;
  const isLoading = propLoading !== undefined ? propLoading : (queryLoading && upcoming === undefined);

  return (
    <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-2xs">
              <CalendarHeart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Upcoming Company Holiday</h3>
              <p className="text-[11px] text-muted-foreground">Official office holiday</p>
            </div>
          </div>

          {upcoming && (
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25">
              {upcoming.daysRemaining === 0
                ? "Today!"
                : upcoming.daysRemaining === 1
                ? "Tomorrow!"
                : `In ${upcoming.daysRemaining} days`}
            </span>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-20 rounded-md" />
        ) : upcoming ? (
          <div className="p-3.5 rounded-md bg-gradient-to-r from-sky-500/10 via-surface-subtle to-surface-elevated border border-sky-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-foreground">{upcoming.name}</span>
              <span className="text-[11px] font-mono font-semibold text-primary">
                {upcoming.dayOfWeek}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono" suppressHydrationWarning>
              {formatDate(upcoming.date)}
            </p>
            {upcoming.description && (
              <p className="text-[11px] text-muted-foreground italic pt-0.5">
                &ldquo;{upcoming.description}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4">No upcoming holidays scheduled.</p>
        )}
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <Link
          href="/holidays"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
        >
          <span>Browse Annual Holiday Calendar</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
