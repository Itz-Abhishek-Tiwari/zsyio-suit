"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader, Button, KpiCard, EmptyState, LeaveStatusBadge, SegmentedTabs, Modal, Textarea, Label, Popover, PopoverTrigger, PopoverContent } from "@zsyio/ui";
import {
  CalendarOff,
  PlusCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  UserCheck,
  Sliders,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import {
  useGetLeaveOverviewQuery,
  useGetTeamLeavesQuery,
  useReviewLeaveMutation,
  useCancelLeaveMutation,
} from "@/store/api/timesheetApi";
import { ApplyLeaveModal } from "@/components/leaves/ApplyLeaveModal";
import { useTimeZone } from "@/context/TimeZoneContext";
import { toast } from "sonner";
import type { LeaveBalance, LeaveRequestItem } from "@zsyio/types";

export default function LeavesPage() {
  const router = useRouter();
  const { formatDate } = useTimeZone();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];

  const isSuperAdminOrAdmin =
    userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const canReviewLeaves =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userPermissions.includes("timesheet:manage");

  const [activeTab, setActiveTab] = useState<string>("MY_LEAVES");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const currentUserId = session?.user?.id;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [rejectModalLeave, setRejectModalLeave] = useState<LeaveRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const { data: leaveOverview, isLoading: overviewLoading } = useGetLeaveOverviewQuery();
  const { data: teamLeaves, isLoading: teamLoading } = useGetTeamLeavesQuery(undefined, {
    skip: !canReviewLeaves || activeTab !== "APPROVALS",
  });

  const [reviewLeave, { isLoading: isReviewing }] = useReviewLeaveMutation();
  const [cancelLeave, { isLoading: isCancelling }] = useCancelLeaveMutation();

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED", reviewerComment?: string) => {
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

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await cancelLeave(id).unwrap();
      toast.success("Leave request cancelled successfully");
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
        err?.data?.message ||
        err?.message ||
        "Failed to cancel leave request"
      );
    }
  };

  const balances = leaveOverview?.balances || [];
  const myLeaves = leaveOverview?.myLeaves || [];
  const pendingApprovalsCount = leaveOverview?.pendingApprovalsCount || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Leaves & Time Off"
          title="Time Off & Leave Management"
          titleIcon={<CalendarOff className="w-5 h-5 text-warning" />}
          description="Apply for planned absences, check remaining leave quotas, and inspect approval statuses."
        />

        <div className="flex items-center gap-2 shrink-0">
          {isSuperAdminOrAdmin && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/admin?tab=POLICIES")}
              className="h-10 px-3.5 rounded-lg text-xs font-semibold gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Manage Quotas</span>
            </Button>
          )}

          <Button
            size="lg"
            onClick={() => setApplyModalOpen(true)}
            className="h-10 px-4 rounded-lg text-xs font-semibold gap-2 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </Button>
        </div>
      </div>

      {/* Leave Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading
          ? ["Casual Leave", "Sick Leave", "Earned Leave", "Compensatory Off"].map((title) => (
              <KpiCard
                key={title}
                label={title}
                value="-"
                icon={<Calendar className="w-5 h-5" />}
                subtext="Loading balance..."
              />
            ))
          : balances.slice(0, 4).map((b: LeaveBalance) => (
              <KpiCard
                key={b.type}
                label={b.label}
                value={`${b.available} Days`}
                variant={
                  b.type === "CASUAL"
                    ? "amber"
                    : b.type === "SICK"
                    ? "rose"
                    : b.type === "EARNED"
                    ? "emerald"
                    : "default"
                }
                icon={<Calendar className="w-5 h-5" />}
                subtext={`${b.used} days utilized of ${b.total} annual quota`}
              />
            ))}
      </div>

      {/* Tabs / Header */}
      {canReviewLeaves ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
            tabs={[
              {
                id: "MY_LEAVES",
                label: `My Applications (${myLeaves.length})`,
                icon: <Clock className="w-3.5 h-3.5" />,
              },
              {
                id: "APPROVALS",
                label: `Team Approvals ${pendingApprovalsCount > 0 ? `(${pendingApprovalsCount} Pending)` : ""}`,
                icon: <UserCheck className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 pt-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              My Leave Applications ({myLeaves.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              History of your submitted time off requests and their current review status
            </p>
          </div>
        </div>
      )}

      {/* Tab 1: My Applications Table */}
      {(activeTab === "MY_LEAVES" || !canReviewLeaves) && (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          {overviewLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading leave records...</span>
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Leave Applications Found"
                description="You haven't applied for any leaves yet this year."
                icon={<CalendarOff className="w-8 h-8 text-muted-foreground" />}
                action={
                  <Button
                    size="sm"
                    onClick={() => setApplyModalOpen(true)}
                    className="mt-3 rounded-lg text-xs font-semibold gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Apply for Leave Now</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Dates</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reviewed By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {myLeaves.map((leave: LeaveRequestItem) => (
                    <tr key={leave.id} className="hover:bg-surface-subtle/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {leave.leaveType}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-muted-foreground" suppressHydrationWarning>
                        {formatDate(leave.startDate)}
                        {leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
                        {leave.isHalfDay && (
                          <span className="ml-1.5 text-xs font-sans px-1.5 py-0.2 rounded bg-surface-subtle border border-border/60 font-semibold">
                            Half Day ({leave.halfDayType === "FIRST_HALF" ? "1st" : "2nd"})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        {leave.daysCount} {leave.daysCount === 1 ? "day" : "days"}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground">
                        &ldquo;{leave.reason}&rdquo;
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <LeaveStatusBadge status={leave.status} size="xs" />
                          {leave.status === "REJECTED" && leave.reviewerComment && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  title={`Rejection reason: "${leave.reviewerComment}"`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer max-w-[150px] group"
                                >
                                  <Info className="w-3 h-3 shrink-0 text-destructive  transition-transform" />
                                  <span className="truncate italic font-normal">&ldquo;{leave.reviewerComment}&rdquo;</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="start" sideOffset={6} className="w-72 p-3.5 bg-surface-elevated border border-border/80 shadow-md rounded-lg">
                                <div className="space-y-2 text-left">
                                  <div className="flex items-center gap-1.5 text-destructive font-semibold text-xs">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Rejection Reason</span>
                                  </div>
                                  <p className="text-xs text-foreground bg-surface-subtle/70 p-2.5 rounded-lg border border-border/50 italic leading-relaxed">
                                    &ldquo;{leave.reviewerComment}&rdquo;
                                  </p>
                                  {leave.reviewer?.name && (
                                    <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                                      Reviewed by <span className="font-medium text-foreground">{leave.reviewer.name}</span>
                                    </p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {leave.reviewer?.name || "-"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {(leave.status === "PENDING" || leave.status === "APPROVED") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(leave.id)}
                            disabled={isCancelling}
                            className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Team Approvals Queue */}
      {canReviewLeaves && activeTab === "APPROVALS" && (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          {teamLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading team leave requests...</span>
            </div>
          ) : !teamLeaves || teamLeaves.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="All Clear! No Pending Requests"
                description="There are currently no leave applications awaiting your review."
                icon={<CheckCircle2 className="w-8 h-8 text-success" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {teamLeaves.map((leave) => {
                    const isOwnLeave = Boolean(currentUserId && leave.userId === currentUserId);
                    const canReview = isSuperAdmin || !isOwnLeave;

                    return (
                      <tr key={leave.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">{leave.user?.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {leave.user?.email}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {leave.leaveType}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-muted-foreground" suppressHydrationWarning>
                          {formatDate(leave.startDate)}
                          {leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
                          {leave.isHalfDay && (
                            <span className="ml-1.5 text-xs font-sans px-1.5 py-0.2 rounded bg-surface-subtle border border-border/60 font-semibold">
                              Half Day
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
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
                              <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60 inline-block">
                                Self-approval disabled
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(leave.id, "APPROVED")}
                                  disabled={isReviewing}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-success hover:bg-success text-white"
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
                                  disabled={isReviewing}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive-light border-destructive/30"
                                >
                                  Reject
                                </Button>
                              </div>
                            )
                          ) : (
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground block">
                                {leave.status === "APPROVED" ? "Approved" : "Rejected"} by {leave.reviewer?.name || "Admin"}
                              </span>
                              {leave.status === "REJECTED" && leave.reviewerComment && (
                                <p className="text-xs text-destructive italic leading-snug">
                                  Reason: &ldquo;{leave.reviewerComment}&rdquo;
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
          )}
        </div>
      )}

      <ApplyLeaveModal open={applyModalOpen} onOpenChange={setApplyModalOpen} />

      {/* Rejection Modal with Mandatory Reason */}
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
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rejectionError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="leave-page-rejection-reason" className="text-xs font-semibold">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="leave-page-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Critical project deadline, coverage unavailable..."
              rows={3}
              required
              minLength={3}
              className="text-xs rounded-lg bg-surface-subtle resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This comment will be visible to the employee on their leave details.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalLeave(null)}
              disabled={isReviewing}
              className="text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isReviewing || !rejectionReason.trim()}
              className="text-xs rounded-lg font-semibold gap-1.5"
            >
              {isReviewing ? (
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
