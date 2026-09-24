"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Input, Label } from "@zsyio/ui";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAdminCorrectSessionMutation } from "@/store/api/timesheetApi";
import { toast } from "sonner";
import { useTimeZone } from "@/context/TimeZoneContext";

interface AdminCorrectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    type: "WORK" | "OOO";
    employeeName: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
  } | null;
}

function getInitialTime(iso: string | null | undefined, fallback: string, timeZone: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).formatToParts(d);
    const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
    const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${hh}:${mm}`;
  } catch {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
}

export function AdminCorrectionModal({ open, onOpenChange, session }: AdminCorrectionModalProps) {
  const { formatTime, formatDate, timeZone, timeZoneConfig, timeToIso } = useTimeZone();

  const [startTime, setStartTime] = useState(() => getInitialTime(session?.startTime, "09:30", timeZone));
  const [endTime, setEndTime] = useState(() => getInitialTime(session?.endTime, "18:00", timeZone));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && session) {
      setStartTime(getInitialTime(session.startTime, "09:30", timeZone));
      setEndTime(getInitialTime(session.endTime, "18:00", timeZone));
      setReason("");
      setError(null);
    }
  }, [open, session, timeZone]);

  const [adminCorrect, { isLoading }] = useAdminCorrectSessionMutation();

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !reason.trim()) {
      setError("Please provide start time, end time, and an audit reason.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be strictly after start time.");
      return;
    }

    setError(null);

    const startIso = timeToIso(session.date, startTime);
    const endIso = timeToIso(session.date, endTime);

    try {
      await adminCorrect({
        sessionId: session.id,
        sessionType: session.type,
        startTime: startIso,
        endTime: endIso,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Timesheet entry corrected and audit trail logged.");
      onOpenChange(false);
      setReason("");
    } catch (err: any) {
      setError(err?.data?.error?.message || "Failed to correct session.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Admin Timesheet Correction"
      description={`Modify the recorded hours for ${session.employeeName} on ${formatDate(session.date)}. Every change is logged to the system audit history.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface-subtle border border-border/80 text-xs space-y-1">
          <p className="font-semibold text-foreground">Current Recorded Record:</p>
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
            <span>Start: {formatTime(session.startTime)}</span>
            <span>→</span>
            <span>End: {formatTime(session.endTime)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-start" className="text-xs font-semibold">
              Corrected Start Time <span className="font-mono opacity-75">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="admin-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-end" className="text-xs font-semibold">
              Corrected End Time <span className="font-mono opacity-75">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="admin-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-reason" className="text-xs font-semibold">
            Correction Reason (Audit Log) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="admin-reason"
            placeholder="e.g. Employee requested correction, System discrepancy..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs h-9 rounded-xl"
            required
            minLength={3}
          />
          <p className="text-[11px] text-muted-foreground">
            This reason will be permanently attached to the audit record with your administrator ID.
          </p>
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
            className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply Correction</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
