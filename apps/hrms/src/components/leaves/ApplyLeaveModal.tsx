"use client";

import { useState, useMemo } from "react";
import { Modal, Button, DatePicker, Textarea } from "@zsyio/ui";
import { CalendarOff, Loader2, Check, Sparkles, AlertTriangle } from "lucide-react";
import {
  useApplyLeaveMutation,
  useGetLeaveOverviewQuery,
  useGetAdminPoliciesQuery,
} from "@/store/api/timesheetApi";
import type { LeaveType } from "@zsyio/types";
import { toast } from "sonner";

interface ApplyLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: LeaveType;
}

const LEAVE_TYPES: { id: LeaveType; label: string; shortLabel: string; desc: string }[] = [
  { id: "CASUAL", label: "Casual Leave (CL)", shortLabel: "Casual", desc: "Planned days off" },
  { id: "SICK", label: "Sick Leave (SL)", shortLabel: "Sick", desc: "Medical recovery" },
  { id: "EARNED", label: "Earned / Annual (EL)", shortLabel: "Earned", desc: "Vacation / holidays" },
  { id: "UNPAID", label: "Leave Without Pay (LWP)", shortLabel: "Unpaid", desc: "Excess absence" },
  { id: "COMPENSATORY", label: "Comp-Off", shortLabel: "Compensatory", desc: "Extra work credit" },
];

export function ApplyLeaveModal({
  open,
  onOpenChange,
  defaultType = "CASUAL",
}: ApplyLeaveModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [leaveType, setLeaveType] = useState<LeaveType>(defaultType);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [reason, setReason] = useState("");

  const { data: leaveOverview } = useGetLeaveOverviewQuery();
  const { data: policiesData } = useGetAdminPoliciesQuery();
  const [applyLeave, { isLoading }] = useApplyLeaveMutation();

  const weekendDays = useMemo(() => {
    const raw = policiesData?.settings?.weekendDays || "0,6";
    return new Set(raw.split(",").map((s) => Number(s.trim())));
  }, [policiesData]);

  const computedWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isHalfDay) {
      const [sy, sm, sd] = startDate.split("-").map(Number);
      const d = new Date(sy, sm - 1, sd);
      if (weekendDays.has(d.getDay())) return 0;
      return 0.5;
    }
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const curr = new Date(sy, sm - 1, sd);
    const endCal = new Date(ey, em - 1, ed);
    if (endCal < curr) return 0;

    let count = 0;
    while (curr <= endCal) {
      if (!weekendDays.has(curr.getDay())) {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, isHalfDay, weekendDays]);

  const getAvailableDays = (type: LeaveType): number | null => {
    const b = leaveOverview?.balances?.find((item) => item.type === type);
    return b ? b.available : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }
    if (computedWorkingDays <= 0) {
      toast.error("Selected leave range contains only configured weekend days.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please state a reason for your leave request");
      return;
    }

    try {
      await applyLeave({
        leaveType,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : null,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Leave application submitted successfully for review!");
      onOpenChange(false);
      setReason("");
      setIsHalfDay(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to submit leave request.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Apply for Leave / Time Off"
      description="Submit a formal leave request to your reporting manager"
      icon={<CalendarOff className="w-5 h-5 text-warning" />}
      iconVariant="warning"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-lg text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="apply-leave-form"
            size="sm"
            disabled={isLoading}
            className="rounded-lg text-xs font-semibold gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Submit Application</span>
          </Button>
        </div>
      }
    >
      <form id="apply-leave-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Leave Type Selector Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Select Leave Type</label>
            <span className="text-xs text-muted-foreground">Available balance shown</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEAVE_TYPES.map((t) => {
              const selected = leaveType === t.id;
              const avail = getAvailableDays(t.id);

              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setLeaveType(t.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                    selected
                      ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-xs"
                      : "bg-surface-subtle/50 border-border/70 hover:bg-surface-elevated hover:border-border text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold truncate">{t.shortLabel}</p>
                    {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-muted-foreground truncate">{t.desc}</span>
                    {avail !== null && (
                      <span className="font-mono font-semibold text-foreground shrink-0 ml-1">
                        {avail}d
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Half Day Toggle & Session Switcher */}
        <div className="p-3 rounded-lg bg-surface-subtle/60 border border-border/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">Half Day Leave</span>
              <span className="text-xs text-muted-foreground">
                Counts as 0.5 day for partial shift absence
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isHalfDay}
              onClick={() => {
                const next = !isHalfDay;
                setIsHalfDay(next);
                if (next) setEndDate(startDate);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border ${
                isHalfDay ? "bg-success border-success/30" : "bg-muted border-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card transition-transform ${
                  isHalfDay ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Half Day Session Selector */}
          {isHalfDay && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={() => setHalfDayType("FIRST_HALF")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  halfDayType === "FIRST_HALF"
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-surface-elevated text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                First Half (Morning)
              </button>
              <button
                type="button"
                onClick={() => setHalfDayType("SECOND_HALF")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  halfDayType === "SECOND_HALF"
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-surface-elevated text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                Second Half (Afternoon)
              </button>
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {isHalfDay ? "Leave Date" : "Start Date"}
            </label>
            <DatePicker
              value={startDate}
              onChange={(v) => {
                if (v) {
                  setStartDate(v);
                  if (isHalfDay || new Date(endDate) < new Date(v)) {
                    setEndDate(v);
                  }
                }
              }}
              className="h-9.5 w-full text-xs font-semibold"
            />
          </div>

          {!isHalfDay && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">End Date</label>
              <DatePicker
                value={endDate}
                minDate={startDate}
                onChange={(v) => v && setEndDate(v)}
                className="h-9.5 w-full text-xs font-semibold"
              />
            </div>
          )}
        </div>

        {/* Working Days Summary & Weekend Notice */}
        {startDate && endDate && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
              computedWorkingDays === 0
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-surface-subtle/70 border-border/70 text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {computedWorkingDays === 0 && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
              <span>
                {computedWorkingDays === 0
                  ? "Selected date falls on a configured weekend."
                  : "Working days to deduct (weekends excluded):"}
              </span>
            </div>
            <span className="font-mono font-semibold text-foreground">
              {computedWorkingDays} {computedWorkingDays === 1 ? "day" : "days"}
            </span>
          </div>
        )}

        {/* Reason Textarea */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Reason for Absence <span className="text-destructive">*</span></label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide details regarding your leave request..."
            rows={2}
            className="text-xs rounded-lg bg-surface-subtle resize-none"
            required
          />
        </div>
      </form>
    </Modal>
  );
}
