"use client";

import { useState } from "react";
import { Modal, Button, Input, Label } from "@zsyio/ui";
import { Clock, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { useFixTimesheetMutation } from "@/store/api/timesheetApi";
import { toast } from "sonner";
import { useTimeZone } from "@/context/TimeZoneContext";

interface FixIncompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    type: "WORK" | "OOO";
    date: string;
    startTime: string;
    reason?: string | null;
  } | null;
}

export function FixIncompleteModal({ open, onOpenChange, session }: FixIncompleteModalProps) {
  const { formatTime, formatDate, timeZoneConfig, timeToIso } = useTimeZone();
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("Forgot to clock out before leaving");
  const [error, setError] = useState<string | null>(null);

  const [fixTimesheet, { isLoading }] = useFixTimesheetMutation();

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endTime || !reason.trim()) {
      setError("Please provide an end time and reason.");
      return;
    }

    setError(null);

    // Compute full ISO timestamp based on session date in active timezone
    const endIso = timeToIso(session.date, endTime);

    try {
      await fixTimesheet({
        sessionId: session.id,
        sessionType: session.type,
        endTime: endIso,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Timesheet corrected and marked completed.");
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.data?.error?.message || "Failed to fix incomplete timesheet.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Fix Incomplete Timesheet"
      description="Provide the missing Clock Out or Break End time to complete this record."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              Missing {session.type === "WORK" ? "Clock Out" : "Break End"} on {formatDate(session.date)}
            </p>
            <p className="text-[11px] opacity-90">
              Started at: {formatTime(session.startTime)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fix-end-time" className="text-xs font-semibold">
            Actual {session.type === "WORK" ? "Clock Out" : "Break End"} Time <span className="font-mono opacity-75 font-normal">({timeZoneConfig.code})</span>
          </Label>
          <div className="relative">
            <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="fix-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="pl-9 text-xs h-9 rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fix-reason" className="text-xs font-semibold">
            Reason for Missing Entry <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fix-reason"
            placeholder="e.g. Forgot to clock out before leaving..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs h-9 rounded-xl"
            required
            minLength={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save & Complete Timesheet</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
