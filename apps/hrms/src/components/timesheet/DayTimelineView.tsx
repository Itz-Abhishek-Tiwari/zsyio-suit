"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  DatePicker,
  EmptyState,
  SegmentedTabs,
  TimesheetStatusBadge,
  ConfirmDialog,
} from "@zsyio/ui";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Briefcase,
  History,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Timer,
  ShieldCheck,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  useGetDailyTimesheetQuery,
  useGetMyRegularizationsQuery,
  useDeleteManualOooMutation,
} from "@/store/api/timesheetApi";
import { cn, formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import type { TimelineSegment } from "@zsyio/types";
import { toast } from "sonner";
import { AuditHistoryModal } from "./modals/AuditHistoryModal";
import { RegularizeAttendanceModal } from "./modals/RegularizeAttendanceModal";
import { AddManualOooModal } from "./modals/AddManualOooModal";
import { CircularShiftChart } from "./CircularShiftChart";

interface DayTimelineViewProps {
  userId?: string;
  initialDate?: string;
}

export function DayTimelineView({ userId, initialDate }: DayTimelineViewProps) {
  const { data: session } = useSession();
  const isViewingOther = Boolean(userId && session?.user?.id && userId !== session.user.id);
  const { formatTime, formatDate, timeZone, timeZoneConfig, getTodayDateStr } = useTimeZone();

  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditSessionId, setSelectedAuditSessionId] = useState<string | null>(null);
  const [regularizeOpen, setRegularizeOpen] = useState(false);
  const [manualOooOpen, setManualOooOpen] = useState(false);
  const [editingOooSession, setEditingOooSession] = useState<{
    id: string;
    startTime: string;
    endTime: string | null;
    reason: string | null;
  } | null>(null);
  const [deletingOooId, setDeletingOooId] = useState<string | null>(null);

  const [deleteManualOoo, { isLoading: isDeletingOoo }] = useDeleteManualOooMutation();

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAdmin =
    session?.user?.role === "ADMIN" ||
    (session?.user as any)?.permissions?.includes("timesheet:manage");
  const canEditOoo = !isViewingOther || isSuperAdmin || isAdmin;

  const handleOpenEditOoo = (item: TimelineSegment) => {
    setEditingOooSession({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      reason: item.reason || null,
    });
    setManualOooOpen(true);
  };

  const handleDeleteOooConfirm = async () => {
    if (!deletingOooId) return;
    try {
      await deleteManualOoo(deletingOooId).unwrap();
      toast.success("Manual break entry deleted successfully");
      setDeletingOooId(null);
    } catch (err: any) {
      toast.error(
        err?.data?.error || err?.data?.message || err?.message || "Failed to delete manual break"
      );
    }
  };

  const { data: timesheet, isLoading } = useGetDailyTimesheetQuery({
    date: selectedDate,
    userId,
  });

  const { data: myRegularizations } = useGetMyRegularizationsQuery(undefined, {
    skip: isViewingOther,
  });
  const pendingRegularizationForDate = myRegularizations?.find(
    (r) => r.date === selectedDate && r.status === "PENDING"
  );
  const rejectedRegularizationForDate = myRegularizations?.find(
    (r) => r.date === selectedDate && r.status === "REJECTED"
  );

  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const handleOpenAudit = (sessionId: string) => {
    setSelectedAuditSessionId(sessionId);
    setAuditModalOpen(true);
  };

  // Filter timeline items
  const filteredTimeline = useMemo(() => {
    if (!timesheet) return [];
    if (filterType === "WORK") {
      return timesheet.timeline.filter((item) => item.type === "WORK");
    }
    if (filterType === "OOO") {
      return timesheet.timeline.filter((item) => item.type === "OOO");
    }
    return timesheet.timeline;
  }, [timesheet, filterType]);

  const workCount = timesheet?.timeline.filter((t) => t.type === "WORK").length ?? 0;
  const oooCount = timesheet?.timeline.filter((t) => t.type === "OOO").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Date Navigation & Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-3.5 rounded-lg bg-card border border-border/80 shadow-xs">
        {/* Left: Stepper + DatePicker + Shift Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Day Stepper */}
          <div className="inline-flex items-center rounded-md border border-border/80 bg-surface-subtle/60 p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevDay}
              className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-card"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              disabled={isToday}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-semibold transition-all",
                isToday
                  ? "bg-primary/10 text-primary font-semibold cursor-default opacity-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              Today
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextDay}
              disabled={isToday}
              className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Date Picker (Single Source of Truth for Selected Date) */}
          <div className="shrink-0">
            <DatePicker
              value={selectedDate}
              maxDate={todayStr}
              onChange={(val) => val && setSelectedDate(val)}
              formatFn={(d) =>
                d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone,
                })
              }
              className="h-9 w-48 sm:w-52 text-xs font-semibold"
            />
          </div>

          {/* Shift Status Badge */}
          {timesheet?.summary?.status && (
            <TimesheetStatusBadge status={timesheet.summary.status} size="xs" />
          )}
        </div>

        {/* Right: Actions */}
        {!isViewingOther && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingOooSession(null);
                setManualOooOpen(true);
              }}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 border-border/80 text-foreground hover:bg-surface-subtle transition-all shadow-2xs"
            >
              <Coffee className="w-4 h-4 text-warning" />
              <span>Add Manual Break</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegularizeOpen(true)}
              className="h-9 px-3.5 rounded-md text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary-light transition-all shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Regularize Attendance</span>
            </Button>
          </div>
        )}
      </div>


      {/* Pending Regularization Banner */}
      {pendingRegularizationForDate && (
        <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 shrink-0 animate-pulse text-warning" />
            <div>
              <p className="font-semibold">Attendance Regularization Pending Approval</p>
              <p className="text-xs opacity-90">
                A request to regularize this day&apos;s shift ({pendingRegularizationForDate.type.replace(/_/g, " ")}) is awaiting manager/admin decision.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-warning/20 text-xs font-semibold   shrink-0">
            Pending Review
          </span>
        </div>
      )}

      {/* Rejected Regularization Banner */}
      {!pendingRegularizationForDate && rejectedRegularizationForDate && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                Attendance Regularization Rejected
                {rejectedRegularizationForDate.reviewer?.name ? ` by ${rejectedRegularizationForDate.reviewer.name}` : ""}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {rejectedRegularizationForDate.reviewerComment ? (
                  <>Reason: <span className="font-semibold italic">&ldquo;{rejectedRegularizationForDate.reviewerComment}&rdquo;</span></>
                ) : (
                  "The attendance regularization request was rejected."
                )}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-destructive/20 text-xs font-semibold   shrink-0 text-destructive">
            Rejected
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2.5 bg-card rounded-lg border border-border/80">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading activity timeline & daily breakdown...</span>
        </div>
      ) : !timesheet || timesheet.timeline.length === 0 ? (
        <div className="p-8 rounded-lg bg-card border border-border/80 shadow-xs">
          <EmptyState
            title="No Activity Recorded for this Day"
            description={`No clock in sessions or breaks were logged on ${formatDate(selectedDate)}.`}
            icon={<Clock className="w-8 h-8 text-muted-foreground" />}
            action={
              !isViewingOther ? (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegularizeOpen(true)}
                    className="rounded-lg text-xs font-semibold gap-1.5 border-primary/30 text-primary"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Regularize Attendance</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingOooSession(null);
                      setManualOooOpen(true);
                    }}
                    className="rounded-lg text-xs font-semibold gap-1.5"
                  >
                    <Coffee className="w-3.5 h-3.5 text-warning" />
                    <span>Log Break</span>
                  </Button>
                </div>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Circular Shift Visual Timeline Graph */}
          <CircularShiftChart timesheet={timesheet} selectedDate={selectedDate} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Activity Timeline Column (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 sm:p-6 rounded-lg bg-card border border-border/80 shadow-xs space-y-5">
                {/* Header & Filter Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Chronological Activity</h3>
                      <p className="text-xs text-muted-foreground">
                        Continuous sequence of logged working intervals and breaks
                      </p>
                    </div>
                  </div>

                  <SegmentedTabs
                    value={filterType}
                    onChange={setFilterType}
                    size="sm"
                    tabs={[
                      { id: "ALL", label: `All (${timesheet.timeline.length})` },
                      { id: "WORK", label: `Work (${workCount})` },
                      { id: "OOO", label: `Breaks (${oooCount})` },
                    ]}
                  />
                </div>

                {/* Timeline Items Feed */}
              <div className="space-y-2.5 pt-1">
                {filteredTimeline.map((item) => {
                  const isWork = item.type === "WORK";

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-lg border transition-all p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isWork
                          ? "bg-surface-subtle/40 border-border/70 hover:border-success/40 hover:bg-card"
                          : "bg-warning/5 border-warning/20 hover:border-warning/40 hover:bg-warning/10"
                      }`}
                    >
                      {/* Left: Icon, Details, and Interval */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs transition-transform  ${
                            isWork
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          {isWork ? <Briefcase className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-foreground">
                              {isWork ? "Working Session" : "Break"}
                            </span>

                            <TimesheetStatusBadge
                              status={item.entryType === "MANUAL" ? "MANUAL" : "AUTOMATIC"}
                              size="xs"
                            />

                            {item.status === "ACTIVE" && (
                              <TimesheetStatusBadge status="WORKING" size="xs" customLabel="In Progress" />
                            )}
                            {item.status === "INCOMPLETE" && (
                              <TimesheetStatusBadge status="INCOMPLETE" size="xs" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                            <span className="font-semibold text-foreground/90">{formatTime(item.startTime)}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                            <span className="font-semibold text-foreground/90">
                              {item.endTime ? formatTime(item.endTime) : "Ongoing"}
                            </span>
                          </div>

                          {item.reason && (
                            <p className="text-xs text-muted-foreground italic truncate max-w-md pt-0.5">
                              &ldquo;{item.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Duration Chip & Actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold border shadow-2xs ${
                            isWork
                              ? "bg-success/10 text-success border-success/25"
                              : "bg-warning/10 text-warning border-warning/25"
                          }`}
                        >
                          {formatDuration(item.durationMinutes)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.type === "OOO" && item.entryType === "MANUAL" && canEditOoo && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditOoo(item)}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground bg-card hover:bg-surface-elevated border border-border/80 shadow-2xs transition-colors"
                                title="Edit manual break"
                                aria-label="Edit manual break"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingOooId(item.id)}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive bg-card hover:bg-destructive/10 border border-border/80 hover:border-destructive/30 shadow-2xs transition-colors"
                                title="Delete manual break"
                                aria-label="Delete manual break"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {item.hasAuditLogs && (
                            <button
                              type="button"
                              onClick={() => handleOpenAudit(item.id)}
                              className="h-6 px-2 rounded-md flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 shadow-2xs transition-colors cursor-pointer"
                              title="View audit history"
                            >
                              <History className="w-3 h-3" />
                              <span>Audit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Attendance Summary Card (1 col) */}
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Day Summary</h3>
                </div>
                <TimesheetStatusBadge status={timesheet.summary.status} size="xs" />
              </div>

              {/* Net Working Hours Big Highlight Hero Card */}
              <div className="p-4 rounded-md bg-primary/10 border border-primary/20 space-y-1 text-center shadow-2xs">
                <span className="text-xs font-semibold   text-primary font-mono">
                  Net Working Hours
                </span>
                <p className="text-3xl font-semibold text-foreground font-display tracking-tight">
                  {formatDuration(timesheet.summary.netWorkingMinutes)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Formula: Session ({formatDuration(timesheet.summary.totalSessionMinutes)}) − Breaks ({formatDuration(timesheet.summary.totalOooMinutes)})
                </p>
              </div>

              {/* Detailed Breakdown Rows */}
              <div className="space-y-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-success" />
                    <span>
                      First Clock In{" "}
                      <span className="text-xs font-mono opacity-75">
                        ({timeZoneConfig.code})
                      </span>
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-foreground" suppressHydrationWarning>
                    {formatTime(timesheet.summary.firstClockIn)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-destructive" />
                    <span>
                      Last Clock Out{" "}
                      <span className="text-xs font-mono opacity-75">
                        ({timeZoneConfig.code})
                      </span>
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-foreground" suppressHydrationWarning>
                    {formatTime(timesheet.summary.lastClockOut)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="w-3.5 h-3.5 text-notion-blue-fg" />
                    <span>Total Session Span</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {formatDuration(timesheet.summary.totalSessionMinutes)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coffee className="w-3.5 h-3.5 text-warning" />
                    <span>Total Breaks</span>
                  </div>
                  <span className="font-mono font-semibold text-warning">
                    − {formatDuration(timesheet.summary.totalOooMinutes)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground">Manual Adjustments</span>
                  <span className="font-semibold text-foreground">
                    {timesheet.summary.manualEntriesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Audit History Modal */}
      <AuditHistoryModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        sessionId={selectedAuditSessionId}
      />

      {/* Attendance Regularization Modal */}
      <RegularizeAttendanceModal
        open={regularizeOpen}
        onOpenChange={setRegularizeOpen}
        defaultDate={selectedDate}
      />
      <AddManualOooModal
        open={manualOooOpen}
        onOpenChange={(open) => {
          setManualOooOpen(open);
          if (!open) setEditingOooSession(null);
        }}
        defaultDate={selectedDate}
        editSession={editingOooSession}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingOooId)}
        onOpenChange={(open) => !open && setDeletingOooId(null)}
        title="Delete Manual Break Entry?"
        description="Are you sure you want to permanently delete this manual break? The break duration will be removed from the timesheet calculation."
        variant="destructive"
        confirmText="Delete Entry"
        isLoading={isDeletingOoo}
        onConfirm={handleDeleteOooConfirm}
      />
    </div>
  );
}
