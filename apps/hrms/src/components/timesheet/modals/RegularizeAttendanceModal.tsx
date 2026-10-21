"use client";

import { useState, useEffect } from "react";
import { Modal, Button, DatePicker, Input, Label, Textarea } from "@zsyio/ui";
import { Clock, AlertCircle, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useApplyRegularizationMutation } from "@/store/api/timesheetApi";
import type { RegularizationType } from "@zsyio/types";
import { toast } from "sonner";
import { useTimeZone } from "@/context/TimeZoneContext";

interface RegularizeAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

const REGULARIZATION_TYPES: {
  id: RegularizationType;
  label: string;
  desc: string;
}[] = [
  {
    id: "MISSED_PUNCH_IN",
    label: "Missed Clock In",
    desc: "Forgot to punch in at start of shift",
  },
  {
    id: "MISSED_PUNCH_OUT",
    label: "Missed Clock Out",
    desc: "Forgot to clock out before leaving",
  },
  {
    id: "MISSED_BOTH",
    label: "Missed Both (Full Day)",
    desc: "Forgot both clock in and clock out for entire shift",
  },
  {
    id: "TIME_CORRECTION",
    label: "Time Correction",
    desc: "Adjust incorrectly recorded shift times",
  },
];

export function RegularizeAttendanceModal({
  open,
  onOpenChange,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
}: RegularizeAttendanceModalProps) {
  const { timeZoneConfig, getTodayDateStr, timeToIso } = useTimeZone();
  const today = getTodayDateStr();
  const [date, setDate] = useState(defaultDate || today);
  const [type, setType] = useState<RegularizationType>("MISSED_BOTH");
  const [startTime, setStartTime] = useState(defaultStartTime || "09:00");
  const [endTime, setEndTime] = useState(defaultEndTime || "18:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || today);
      if (defaultStartTime) setStartTime(defaultStartTime);
      if (defaultEndTime) setEndTime(defaultEndTime);
      setError(null);
    }
  }, [open, defaultDate, defaultStartTime, defaultEndTime, today]);

  const [applyRegularization, { isLoading }] = useApplyRegularizationMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !reason.trim()) {
      setError("Please specify the date and reason for attendance regularization.");
      return;
    }

    if (startTime && endTime && startTime >= endTime) {
      setError("Requested clock out time must be after clock in time.");
      return;
    }

    try {
      await applyRegularization({
        date,
        type,
        requestedClockIn: startTime ? timeToIso(date, startTime) : undefined,
        requestedClockOut: endTime ? timeToIso(date, endTime) : undefined,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Attendance regularization request submitted for admin approval!");
      onOpenChange(false);
      setReason("");
    } catch (err: any) {
      setError(err?.data?.error?.message || "Failed to submit regularization request.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Regularize Attendance"
      description="Request manager/admin approval to fix missed punches or regularize working hours."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
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
            form="regularize-attendance-form"
            size="sm"
            disabled={isLoading}
            className="rounded-lg text-xs font-semibold gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Regularization</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="regularize-attendance-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Informative Notice */}
        <div className="p-3 rounded-lg bg-primary-light/60 border border-primary/20 text-xs text-foreground flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Regularization requests are sent to your manager or administrator for review.
            Once approved, your official timesheet and working duration will be updated automatically.
          </p>
        </div>

        {/* Date Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="regularize-date" className="text-xs font-semibold">
            Attendance Date
          </Label>
          <DatePicker
            value={date}
            maxDate={today}
            onChange={(val) => val && setDate(val)}
            className="w-full h-9 text-xs"
          />
        </div>

        {/* Regularization Type Radio Grid */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Regularization Reason Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {REGULARIZATION_TYPES.map((t) => {
              const isSelected = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary-light text-primary font-semibold shadow-2xs"
                      : "border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground"
                  }`}
                >
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Requested Shift Times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="clock-in" className="text-xs font-semibold">
              Requested Clock In <span className="font-mono opacity-75 font-normal">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="clock-in"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-lg font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clock-out" className="text-xs font-semibold">
              Requested Clock Out <span className="font-mono opacity-75 font-normal">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="clock-out"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-lg font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Reason / Explanation */}
        <div className="space-y-1.5">
          <Label htmlFor="regularize-reason" className="text-xs font-semibold">
            Reason / Justification <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="regularize-reason"
            rows={2}
            placeholder="Please explain why this attendance record requires regularization (e.g. forgot to punch out before offsite meeting, device battery died)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs rounded-lg"
            required
            minLength={3}
          />
        </div>
      </form>
    </Modal>
  );
}
