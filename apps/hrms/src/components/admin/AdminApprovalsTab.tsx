"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  useGetTeamLeavesQuery,
  useReviewLeaveMutation,
  useGetTeamRegularizationsQuery,
  useReviewRegularizationMutation,
} from "@/store/api/timesheetApi";
import {
  LeaveStatusBadge,
  Button,
  EmptyState,
  SegmentedTabs,
  Modal,
  Textarea,
  Label,
} from "@zsyio/ui";
import {
  CheckCircle2,
  Loader2,
  CalendarOff,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useTimeZone } from "@/context/TimeZoneContext";
import type { LeaveRequestItem, AttendanceRegularizationItem } from "@zsyio/types";
import { toast } from "sonner";

function RegularizationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <X className="w-3 h-3" />
          Rejected
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-subtle text-muted-foreground border border-border/60">
          {status}
        </span>
      );
  }
}

export function AdminApprovalsTab() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const { formatTime, formatDate, timeZoneConfig } = useTimeZone();

  const [subTab, setSubTab] = useState<string>("REGULARIZATIONS");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [rejectModalLeave, setRejectModalLeave] = useState<LeaveRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const [rejectModalReg, setRejectModalReg] = useState<AttendanceRegularizationItem | null>(null);
  const [regRejectionReason, setRegRejectionReason] = useState("");
  const [regRejectionError, setRegRejectionError] = useState<string | null>(null);

  // Pending counts for sub-tab badges
  const { data: pendingLeaves } = useGetTeamLeavesQuery({ status: "PENDING" });
  const { data: pendingRegs } = useGetTeamRegularizationsQuery({ status: "PENDING" });
  const pendingLeavesCount = pendingLeaves?.length || 0;
  const pendingRegCount = pendingRegs?.length || 0;

  // Active query filtered by status
  const activeStatusQuery = statusFilter === "ALL" ? undefined : { status: statusFilter };
  const { data: teamLeaves, isLoading: isLeavesLoading } = useGetTeamLeavesQuery(activeStatusQuery);
  const [reviewLeave, { isLoading: isReviewingLeave }] = useReviewLeaveMutation();

  const { data: teamRegularizations, isLoading: isRegLoading } = useGetTeamRegularizationsQuery(activeStatusQuery);
  const [reviewRegularization, { isLoading: isReviewingReg }] = useReviewRegularizationMutation();

  const handleReviewLeave = async (id: string, status: "APPROVED" | "REJECTED", reviewerComment?: string) => {
    try {
      await reviewLeave({ id, status, reviewerComment }).unwrap();
      toast.success(`Leave request ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Failed to update leave request"
      );
    }
  };

  const handleConfirmRejectLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalLeave) return;

    if (!rejectionReason.trim()) {
      setRejectionError("Please provide a reason for rejecting this leave request.");
      return;
    }

    try {
      await reviewLeave({
        id: rejectModalLeave.id,
        status: "REJECTED",
        reviewerComment: rejectionReason.trim(),
      }).unwrap();
      toast.success("Leave request rejected successfully.");
      setRejectModalLeave(null);
      setRejectionReason("");
      setRejectionError(null);
    } catch (err: any) {
      setRejectionError(
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Failed to reject leave request."
      );
    }
  };

  const handleReviewReg = async (id: string, status: "APPROVED" | "REJECTED", reviewerComment?: string) => {
    try {
      await reviewRegularization({ id, status, reviewerComment }).unwrap();
      toast.success(`Attendance regularization ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Failed to update regularization request"
      );
    }
  };

  const handleConfirmRejectReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReg) return;

    if (!regRejectionReason.trim()) {
      setRegRejectionError("Please provide a reason for rejecting this regularization request.");
      return;
    }

    try {
      await reviewRegularization({
        id: rejectModalReg.id,
        status: "REJECTED",
        reviewerComment: regRejectionReason.trim(),
      }).unwrap();
      toast.success("Attendance regularization rejected successfully.");
      setRejectModalReg(null);
      setRegRejectionReason("");
      setRegRejectionError(null);
    } catch (err: any) {
      setRegRejectionError(
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Failed to reject regularization request."
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Tab Switcher & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedTabs
          value={subTab}
          onChange={setSubTab}
          size="sm"
          tabs={[
            {
              id: "REGULARIZATIONS",
              label: `Attendance Regularizations ${pendingRegCount > 0 ? `(${pendingRegCount})` : ""}`,
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
            },
            {
              id: "LEAVES",
              label: `Leave & Time Off ${pendingLeavesCount > 0 ? `(${pendingLeavesCount})` : ""}`,
              icon: <CalendarOff className="w-3.5 h-3.5" />,
            },
          ]}
        />

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-surface-subtle/80 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          {(
            [
              { id: "PENDING", label: "Pending" },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
              { id: "ALL", label: "All Records" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === item.id
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === "REGULARIZATIONS" ? (
        isRegLoading ? (
          <div className="py-20 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card rounded-lg border border-border/80">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading attendance regularizations...</span>
          </div>
        ) : !teamRegularizations || teamRegularizations.length === 0 ? (
          <div className="p-8 rounded-lg bg-card border border-border/80 shadow-xs">
            <EmptyState
              title={
                statusFilter === "PENDING"
                  ? "No Pending Attendance Regularizations"
                  : statusFilter === "APPROVED"
                  ? "No Approved Regularizations Found"
                  : statusFilter === "REJECTED"
                  ? "No Rejected Regularizations Found"
                  : "No Attendance Regularizations Found"
              }
              description={
                statusFilter === "PENDING"
                  ? "All employee attendance regularization requests have been reviewed."
                  : `No attendance regularizations with status ${statusFilter.toLowerCase()} found.`
              }
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">
                Attendance Regularization Requests ({statusFilter === "ALL" ? "All Records" : statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {teamRegularizations.length}{" "}
                {teamRegularizations.length === 1 ? "record" : "records"}{" "}
                {statusFilter === "PENDING" ? "awaiting manager/admin approval" : "in this view"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Shift Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">
                      Requested Shift Interval{" "}
                      <span className="font-mono text-[10px] opacity-75">
                        ({timeZoneConfig.code})
                      </span>
                    </th>
                    <th className="py-3 px-4">Justification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">
                      {statusFilter === "PENDING" ? "Decision" : "Review Info / Decision"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {teamRegularizations.map((reg) => {
                    const inTime = reg.requestedClockIn ? formatTime(reg.requestedClockIn) : "-";
                    const outTime = reg.requestedClockOut ? formatTime(reg.requestedClockOut) : "-";
                    const isOwnReg = Boolean(currentUserId && reg.userId === currentUserId);
                    const canReviewReg = isSuperAdmin || !isOwnReg;

                    return (
                      <tr key={reg.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground">{reg.user?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {reg.user?.email}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground" suppressHydrationWarning>
                          {formatDate(reg.date)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-surface-subtle border border-border/60 uppercase">
                            {reg.type.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-muted-foreground">
                          <span className="font-bold text-foreground">{inTime}</span>
                          {" → "}
                          <span className="font-bold text-foreground">{outTime}</span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground">
                          &ldquo;{reg.reason}&rdquo;
                        </td>

                        <td className="py-3.5 px-4">
                          <RegularizationStatusBadge status={reg.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {reg.status === "PENDING" ? (
                            !canReviewReg ? (
                              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60 inline-block">
                                Self-approval disabled
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleReviewReg(reg.id, "APPROVED")}
                                  disabled={isReviewingReg}
                                  className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRejectModalReg(reg);
                                    setRegRejectionReason("");
                                    setRegRejectionError(null);
                                  }}
                                  disabled={isReviewingReg}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </Button>
                              </div>
                            )
                          ) : reg.status === "APPROVED" ? (
                            <div className="text-right space-y-0.5">
                              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved by {reg.reviewer?.name || "Manager"}</span>
                              </div>
                              {reg.reviewedAt && (
                                <p className="text-[10px] text-muted-foreground font-mono" suppressHydrationWarning>
                                  {formatDate(reg.reviewedAt)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-right space-y-0.5">
                              <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                <X className="w-3.5 h-3.5" />
                                <span>Rejected by {reg.reviewer?.name || "Manager"}</span>
                              </div>
                              {reg.reviewerComment && (
                                <p className="text-[10px] text-muted-foreground max-w-[200px] ml-auto truncate" title={reg.reviewerComment}>
                                  &ldquo;{reg.reviewerComment}&rdquo;
                                </p>
                              )}
                              {reg.reviewedAt && (
                                <p className="text-[10px] text-muted-foreground font-mono" suppressHydrationWarning>
                                  {formatDate(reg.reviewedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : isLeavesLoading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card rounded-lg border border-border/80">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading leave records...</span>
        </div>
      ) : !teamLeaves || teamLeaves.length === 0 ? (
        <div className="p-8 rounded-lg bg-card border border-border/80 shadow-xs">
          <EmptyState
            title={
              statusFilter === "PENDING"
                ? "No Pending Leaves"
                : statusFilter === "APPROVED"
                ? "No Approved Leaves Found"
                : statusFilter === "REJECTED"
                ? "No Rejected Leaves Found"
                : "No Leave Records Found"
            }
            description={
              statusFilter === "PENDING"
                ? "All employee leave applications have been processed."
                : `No leave applications with status ${statusFilter.toLowerCase()} found.`
            }
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Leave & Time Off Requests ({statusFilter === "ALL" ? "All Records" : statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {teamLeaves.length} {teamLeaves.length === 1 ? "application" : "applications"}{" "}
                {statusFilter === "PENDING" ? "awaiting managerial decision" : "in this view"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">
                    {statusFilter === "PENDING" ? "Decision Actions" : "Review Info / Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {teamLeaves.map((leave) => {
                  const isOwnLeave = Boolean(currentUserId && leave.userId === currentUserId);
                  const canReview = !isOwnLeave;

                  return (
                    <tr key={leave.id} className="hover:bg-surface-subtle/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{leave.user?.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {leave.user?.email}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-foreground">{leave.leaveType}</td>

                      <td className="py-3.5 px-4 font-mono text-muted-foreground" suppressHydrationWarning>
                        {formatDate(leave.startDate)}
                        {leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
                        {leave.isHalfDay && (
                          <span className="ml-1.5 text-[10px] font-sans px-1.5 py-0.2 rounded bg-surface-subtle border border-border/60 font-semibold">
                            Half Day
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {leave.daysCount}d
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground">
                        &ldquo;{leave.reason}&rdquo;
                      </td>

                      <td className="py-3.5 px-4">
                        <LeaveStatusBadge status={leave.status} size="xs" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {leave.status === "PENDING" ? (
                          !canReview ? (
                            <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60 inline-block">
                              Self-approval disabled
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleReviewLeave(leave.id, "APPROVED")}
                                disabled={isReviewingLeave}
                                className="h-7 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectModalLeave(leave);
                                  setRejectionReason("");
                                  setRejectionError(null);
                                }}
                                disabled={isReviewingLeave}
                                className="h-7 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                              >
                                Reject
                              </Button>
                            </div>
                          )
                        ) : leave.status === "APPROVED" ? (
                          <div className="text-right space-y-0.5">
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved by {leave.reviewer?.name || "Manager"}</span>
                            </div>
                            {leave.reviewedAt && (
                              <p className="text-[10px] text-muted-foreground font-mono" suppressHydrationWarning>
                                {formatDate(leave.reviewedAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-right space-y-0.5">
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <X className="w-3.5 h-3.5" />
                              <span>Rejected by {leave.reviewer?.name || "Manager"}</span>
                            </div>
                            {leave.reviewerComment && (
                              <p className="text-[10px] text-muted-foreground max-w-[200px] ml-auto truncate" title={leave.reviewerComment}>
                                &ldquo;{leave.reviewerComment}&rdquo;
                              </p>
                            )}
                            {leave.reviewedAt && (
                              <p className="text-[10px] text-muted-foreground font-mono" suppressHydrationWarning>
                                {formatDate(leave.reviewedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Rejection Modal with Reason */}
      <Modal
        open={Boolean(rejectModalLeave)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModalLeave(null);
            setRejectionReason("");
            setRejectionError(null);
          }
        }}
        title="Reject Leave Request"
        description={
          rejectModalLeave
            ? `Please specify a reason for rejecting ${rejectModalLeave.user?.name || "the employee"}'s ${rejectModalLeave.leaveType} leave request (${formatDate(rejectModalLeave.startDate)}${rejectModalLeave.startDate !== rejectModalLeave.endDate ? ` → ${formatDate(rejectModalLeave.endDate)}` : ""}). A reason is required.`
            : undefined
        }
      >
        <form onSubmit={handleConfirmRejectLeave} className="space-y-4 pt-1">
          {rejectionError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rejectionError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="leave-rejection-reason" className="text-xs font-semibold">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="leave-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Critical sprint release scheduled, team coverage unavailable, insufficient notice..."
              rows={3}
              required
              minLength={3}
              className="text-xs rounded-xl bg-surface-subtle resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be recorded and displayed to the employee.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalLeave(null)}
              disabled={isReviewingLeave}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isReviewingLeave || !rejectionReason.trim()}
              className="text-xs rounded-xl font-bold gap-1.5"
            >
              {isReviewingLeave ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>Confirm Rejection</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Regularization Rejection Reason Modal */}
      <Modal
        open={Boolean(rejectModalReg)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModalReg(null);
            setRegRejectionReason("");
            setRegRejectionError(null);
          }
        }}
        title="Reject Attendance Regularization"
        description={
          rejectModalReg
            ? `Provide a reason for rejecting ${rejectModalReg.user?.name || "the employee"}'s attendance regularization request for ${formatDate(rejectModalReg.date)}.`
            : "Provide a reason for rejecting this regularization request."
        }
      >
        <form onSubmit={handleConfirmRejectReg} className="space-y-4 pt-2">
          {regRejectionError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regRejectionError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reg-rejection-reason" className="text-xs font-semibold">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reg-rejection-reason"
              value={regRejectionReason}
              onChange={(e) => setRegRejectionReason(e.target.value)}
              placeholder="e.g., Shift records show conflicting activity, not authorized by team manager..."
              rows={3}
              required
              minLength={3}
              className="text-xs rounded-xl bg-surface-subtle resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be recorded and displayed to the employee.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalReg(null)}
              disabled={isReviewingReg}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isReviewingReg || !regRejectionReason.trim()}
              className="text-xs rounded-xl font-bold gap-1.5"
            >
              {isReviewingReg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>Confirm Rejection</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
