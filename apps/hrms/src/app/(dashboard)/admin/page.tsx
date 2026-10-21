"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useGetAdminTimesheetsQuery,
  useGetTeamLeavesQuery,
  useGetTeamRegularizationsQuery,
} from "@/store/api/timesheetApi";
import { TimesheetFilterBar } from "@/components/timesheet/TimesheetFilterBar";
import { AdminTimesheetTable } from "@/components/timesheet/AdminTimesheetTable";
import { AdminApprovalsTab } from "@/components/admin/AdminApprovalsTab";
import { AdminHolidaysTab } from "@/components/admin/AdminHolidaysTab";
import { AdminLeavePoliciesTab } from "@/components/admin/AdminLeavePoliciesTab";
import { PageHeader, KpiCard, Button, SegmentedTabs, EmptyState } from "@zsyio/ui";
import {
  Users2,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ListFilter,
  CalendarHeart,
  Sliders,
} from "lucide-react";

export default function AdminAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];

  const canAccessAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userPermissions.includes("timesheet:view:all") ||
    userPermissions.includes("timesheet:manage");

  const canManagePolicies =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userPermissions.includes("timesheet:manage");

  const initialTab = searchParams.get("tab") || "ROSTER";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if ((tabParam === "POLICIES" || tabParam === "HOLIDAYS") && !canManagePolicies) {
        setActiveTab("ROSTER");
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams, canManagePolicies]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [entryType, setEntryType] = useState("ALL");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAdminTimesheetsQuery(
    {
      search: search || undefined,
      date: date || undefined,
      status: status !== "ALL" ? status : undefined,
      entryType: entryType !== "ALL" ? entryType : undefined,
      incompleteOnly: incompleteOnly ? true : undefined,
      page,
      limit: 30,
    },
    { skip: !canAccessAdmin }
  );

  const { data: pendingLeaves } = useGetTeamLeavesQuery(
    { status: "PENDING" },
    { skip: !canAccessAdmin }
  );
  const { data: pendingRegs } = useGetTeamRegularizationsQuery(
    { status: "PENDING" },
    { skip: !canAccessAdmin }
  );
  const totalPendingApprovals = (pendingLeaves?.length || 0) + (pendingRegs?.length || 0);

  const handleReset = () => {
    setSearch("");
    setDate("");
    setStatus("ALL");
    setEntryType("ALL");
    setIncompleteOnly(false);
    setPage(1);
  };

  const metrics = data?.metrics || {
    activeWorkingNow: 0,
    currentlyOoo: 0,
    clockedOutToday: 0,
    incompleteRecordsCount: 0,
  };

  if (sessionStatus !== "loading" && !canAccessAdmin) {
    return (
      <div className="p-8 sm:p-12">
        <EmptyState
          title="Access Restricted"
          description="You do not have permission to access administrative consoles, team attendance rosters, or approval queues."
          icon={<AlertTriangle className="w-10 h-10 text-warning" />}
          action={
            <Button onClick={() => router.push("/leaves")} className="mt-4">
              Return to Leaves
            </Button>
          }
        />
      </div>
    );
  }

  const headerInfo = (() => {
    switch (activeTab) {
      case "APPROVALS":
        return {
          eyebrow: "Review Queue",
          title: "Approvals & Regularizations",
          icon: <UserCheck className="w-5 h-5 text-primary" />,
          desc: "Review pending employee leave requests, attendance regularization exceptions, and manager approvals.",
        };
      case "POLICIES":
        return {
          eyebrow: "Organization Setup",
          title: "Leave Quotas & Work Rules",
          icon: <Sliders className="w-5 h-5 text-primary" />,
          desc: "Configure standard annual leave allowances, work shift expectations, and customize individual employee allocations.",
        };
      case "HOLIDAYS":
        return {
          eyebrow: "Organization Setup",
          title: "Company Holiday Calendar",
          icon: <CalendarHeart className="w-5 h-5 text-primary" />,
          desc: "Maintain organization holidays, floating festive observances, and non-working business calendar dates.",
        };
      case "ROSTER":
      default:
        return {
          eyebrow: "Organization Overview",
          title: "Team Attendance & Timesheet Management",
          icon: <Users2 className="w-5 h-5 text-primary" />,
          desc: "Monitor active working sessions, oversee breaks, inspect audit logs, and export organization attendance reports.",
        };
    }
  })();

  return (
    <div className="space-y-6">
      {/* Contextual Page Header */}
      <PageHeader
        eyebrow={headerInfo.eyebrow}
        title={headerInfo.title}
        titleIcon={headerInfo.icon}
        description={headerInfo.desc}
        borderBottom
      />

      {/* KPI Cards from @zsyio/ui (shown on ROSTER tab) */}
      {activeTab === "ROSTER" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Working Now"
            value={isLoading ? "-" : metrics.activeWorkingNow}
            icon={<Clock className="w-5 h-5" />}
            variant="emerald"
            subtext="Active working sessions today"
          />

          <KpiCard
            label="Currently on Break"
            value={isLoading ? "-" : metrics.currentlyOoo}
            icon={<Coffee className="w-5 h-5" />}
            variant="amber"
            subtext="Employees on temporary breaks"
          />

          <KpiCard
            label="Clocked Out Today"
            value={isLoading ? "-" : metrics.clockedOutToday}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="sky"
            subtext="Completed day shifts"
          />

          <KpiCard
            label="Incomplete Records"
            value={isLoading ? "-" : metrics.incompleteRecordsCount}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="rose"
            highlightAlert={!isLoading && metrics.incompleteRecordsCount > 0}
            subtext="Missing clock out or break end"
          />
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          value={activeTab}
          onChange={handleTabChange}
          size="sm"
          tabs={[
            { id: "ROSTER", label: "Team Attendance Roster", icon: <ListFilter className="w-3.5 h-3.5" /> },
            {
              id: "APPROVALS",
              label: `Approvals & Exceptions ${totalPendingApprovals > 0 ? `(${totalPendingApprovals})` : ""}`,
              icon: <UserCheck className="w-3.5 h-3.5" />,
            },
            ...(canManagePolicies
              ? [
                  { id: "POLICIES", label: "Leave Quotas & Work Rules", icon: <Sliders className="w-3.5 h-3.5" /> },
                  { id: "HOLIDAYS", label: "Holiday Calendar", icon: <CalendarHeart className="w-3.5 h-3.5" /> },
                ]
              : []),
          ]}
        />
      </div>

      {activeTab === "ROSTER" && (
        <>
          {/* Filter Bar */}
          <TimesheetFilterBar
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            date={date}
            onDateChange={(v) => {
              setDate(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            entryType={entryType}
            onEntryTypeChange={(v) => {
              setEntryType(v);
              setPage(1);
            }}
            incompleteOnly={incompleteOnly}
            onIncompleteOnlyToggle={(v) => {
              setIncompleteOnly(v);
              setPage(1);
            }}
            onReset={handleReset}
          />

          {/* Timesheets Table */}
          <AdminTimesheetTable items={data?.items || []} isLoading={isLoading} />

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
              <span>
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.pagination.page <= 1}
                  className="h-8 px-2.5 rounded-lg text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  className="h-8 px-2.5 rounded-lg text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "APPROVALS" && <AdminApprovalsTab />}

      {activeTab === "POLICIES" && canManagePolicies && <AdminLeavePoliciesTab />}

      {activeTab === "HOLIDAYS" && canManagePolicies && <AdminHolidaysTab />}
    </div>
  );
}
