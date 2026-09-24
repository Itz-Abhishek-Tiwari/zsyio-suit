"use client";

import { DashboardHero } from "@zsyio/ui";
import { TodayStatusCard } from "@/components/timesheet/TodayStatusCard";
import { IncompleteRecordsBanner } from "@/components/timesheet/IncompleteRecordsBanner";
import { WeekAttendanceBarometer } from "@/components/dashboard/WeekAttendanceBarometer";
import { QuickLeaveSummaryWidget } from "@/components/dashboard/QuickLeaveSummaryWidget";
import { UpcomingHolidayWidget } from "@/components/dashboard/UpcomingHolidayWidget";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { useGetHrmsDashboardQuery } from "@/store/api/timesheetApi";
import { Compass, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TimesheetDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useGetHrmsDashboardQuery();

  const userName =
    session?.user?.name ||
    (session?.user?.email ? session.user.email.split("@")[0].replace(/[._-]/g, " ") : undefined);
  const userRole = session?.user?.role ? session.user.role.replace(/_/g, " ") : "Workforce";

  const isWorking = data?.status?.state === "WORKING";
  const isBreak = data?.status?.state === "OOO";

  return (
    <div className="space-y-6">
      {/* Executive Command Deck */}
      <DashboardHero
        badge={{
          label: "Zsyio People & Attendance",
          icon: Compass,
          variant: "emerald",
        }}
        systemStatus={{
          label: "PUNCH STATION ACTIVE",
        }}
        userName={userName}
        userRole={userRole}
        accentTone="emerald"
        description="Track your daily work sessions, manage breaks, inspect shift targets, and monitor leave balances."
        metrics={[
          {
            label: "Shift Target",
            value: "8h 00m",
            icon: Clock,
            subtext: "Standard business day",
          },
          {
            label: "Casual Leaves",
            value: isLoading
              ? "..."
              : String(data?.leaves?.balances?.find((b) => b.type === "CASUAL")?.available ?? 0),
            icon: Calendar,
            subtext: "Days remaining",
          },
          {
            label: "Sick Leaves",
            value: isLoading
              ? "..."
              : String(data?.leaves?.balances?.find((b) => b.type === "SICK")?.available ?? 0),
            icon: Calendar,
            subtext: "Days remaining",
          },
          {
            label: "Live Status",
            value: isWorking ? "Clocked In" : isBreak ? "On Break" : "Offline",
            icon: CheckCircle2,
            trend: isWorking ? "up" : "neutral",
            subtext: isWorking ? "Work session active" : isBreak ? "Break running" : "Ready to punch",
          },
        ]}
      />

      {/* Warning Banner for Incomplete Sessions */}
      <IncompleteRecordsBanner statusData={data?.status} />

      {/* Today's Punch Console & KPI Metric Cards */}
      <TodayStatusCard initialData={data?.status} loading={isLoading} />

      {/* 7-Day Rhythm Barometer */}
      <WeekAttendanceBarometer initialMonthlyData={data?.monthlyAttendance} loading={isLoading} />

      {/* 2-Column Cockpit Widgets: Leave Balances & Company Holidays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <QuickLeaveSummaryWidget initialData={data?.leaves} loading={isLoading} />
        <UpcomingHolidayWidget upcomingHoliday={data?.upcomingHoliday} loading={isLoading} />
      </div>

      {/* Today's Live Activity Stream */}
      <RecentActivityFeed initialTimesheet={data?.todayTimesheet} loading={isLoading} />
    </div>
  );
}
