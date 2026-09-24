"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PageHeader, SegmentedTabs, Button, UserAvatar } from "@zsyio/ui";
import { DayTimelineView } from "@/components/timesheet/DayTimelineView";
import { WeeklyTimesheetTable } from "@/components/timesheet/WeeklyTimesheetTable";
import { MonthlyAttendanceCalendar } from "@/components/timesheet/MonthlyAttendanceCalendar";
import { useGetDailyTimesheetQuery } from "@/store/api/timesheetApi";
import { Clock, Calendar, CalendarDays, ArrowLeft, User, Loader2 } from "lucide-react";

function TimelineContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || undefined;
  const dateParam = searchParams.get("date");

  const { data: session } = useSession();
  const isViewingOther = Boolean(userId && session?.user?.id && userId !== session.user.id);

  const [viewMode, setViewMode] = useState<string>("DAY");
  const [selectedDate, setSelectedDate] = useState<string>(
    dateParam || new Date().toISOString().split("T")[0]
  );

  // Sync date from URL if it changes
  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  // Fetch timesheet data to resolve the target employee's name and details
  const { data: timesheetData } = useGetDailyTimesheetQuery(
    { date: selectedDate, userId },
    { skip: !userId }
  );
  const employee = timesheetData?.user;

  return (
    <div className="space-y-6">
      {/* Top Banner when viewing an employee's timeline */}
      {isViewingOther && (
        <div className="p-4 rounded-lg bg-surface-subtle border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            {employee && <UserAvatar user={employee} size="md" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {employee?.name || "Loading employee profile..."}
                </span>
                {employee?.role && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                    {employee.role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {employee?.email || "Employee Activity Timeline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-md gap-1.5 border-border hover:bg-surface-elevated"
            >
              <Link href="/directory">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Directory</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs rounded-xl gap-1.5 text-primary hover:bg-primary/10"
            >
              <Link href="/timeline">
                <User className="w-3.5 h-3.5" />
                <span>My Timesheet</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow={isViewingOther ? "Employee Timesheet & Logs" : "Personal Timesheet & Logs"}
          title={
            isViewingOther
              ? `${employee?.name || "Employee"}'s Activity Hub`
              : "Personal Timesheet & Activity Hub"
          }
          titleIcon={<Clock className="w-5 h-5 text-primary" />}
          description={
            isViewingOther
              ? `Inspect daily working intervals, weekly attendance logs, and monthly calendar for ${employee?.name || "this employee"}.`
              : "Inspect your daily working intervals, weekly attendance logs, and monthly attendance matrix."
          }
        />

        <div className="shrink-0">
          <SegmentedTabs
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            tabs={[
              { id: "DAY", label: "Daily Punch Log", icon: <Clock className="w-3.5 h-3.5" /> },
              { id: "WEEK", label: "Weekly Timesheet", icon: <Calendar className="w-3.5 h-3.5" /> },
              { id: "MONTH", label: "Monthly Calendar", icon: <CalendarDays className="w-3.5 h-3.5" /> },
            ]}
          />
        </div>
      </div>

      {viewMode === "DAY" && (
        <DayTimelineView initialDate={selectedDate} userId={userId} />
      )}

      {viewMode === "WEEK" && (
        <WeeklyTimesheetTable
          userId={userId}
          onSelectDay={(date) => {
            setSelectedDate(date);
            setViewMode("DAY");
          }}
        />
      )}

      {viewMode === "MONTH" && (
        <MonthlyAttendanceCalendar
          userId={userId}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setViewMode("DAY");
          }}
        />
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading timesheet hub...</span>
        </div>
      }
    >
      <TimelineContent />
    </Suspense>
  );
}
