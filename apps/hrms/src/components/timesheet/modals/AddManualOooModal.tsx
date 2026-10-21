"use client";

import { useState, useEffect } from "react";
import { Modal, Button, DatePicker, Input, Label } from "@zsyio/ui";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAddManualOooMutation, useUpdateManualOooMutation } from "@/store/api/timesheetApi";
import { toast } from "sonner";
import { useTimeZone } from "@/context/TimeZoneContext";

interface AddManualOooModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  editSession?: {
    id: string;
    startTime: string;
    endTime: string | null;
    reason: string | null;
  } | null;
}

export function AddManualOooModal({
  open,
  onOpenChange,
  defaultDate,
  editSession,
}: AddManualOooModalProps) {
  const { timeZone, timeZoneConfig, getTodayDateStr, timeToIso } = useTimeZone();
  const todayStr = getTodayDateStr();
  const [date, setDate] = useState(defaultDate || todayStr);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("13:30");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addManualOoo, { isLoading: isAdding }] = useAddManualOooMutation();
  const [updateManualOoo, { isLoading: isUpdating }] = useUpdateManualOooMutation();
  const isLoading = isAdding || isUpdating;

  useEffect(() => {
    if (open) {
      if (editSession) {
        setDate(defaultDate || todayStr);
        if (editSession.startTime) {
          try {
            const parts = new Intl.DateTimeFormat("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone,
            }).formatToParts(new Date(editSession.startTime));
            const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
            const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
            setStartTime(`${hh}:${mm}`);
          } catch {
            const s = new Date(editSession.startTime);
            setStartTime(`${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`);
          }
        }
        if (editSession.endTime) {
          try {
            const parts = new Intl.DateTimeFormat("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone,
            }).formatToParts(new Date(editSession.endTime));
            const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
            const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
            setEndTime(`${hh}:${mm}`);
          } catch {
            const e = new Date(editSession.endTime);
            setEndTime(`${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`);
          }
        }
        setReason(editSession.reason || "");
      } else {
        setDate(defaultDate || todayStr);
        setStartTime("13:00");
        setEndTime("13:30");
        setReason("");
      }
      setError(null);
    }
  }, [open, editSession, defaultDate, todayStr, timeZone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !reason.trim()) {
      setError("Please provide date, start time, end time, and reason.");
      return;
    }

    if (endTime <= startTime) {
      setError("Break end time must be after start time.");
      return;
    }

    setError(null);

    try {
      const payload = {
        date,
        startTime: timeToIso(date, startTime),
        endTime: timeToIso(date, endTime),
        reason: reason.trim(),
      };

      if (editSession) {
        await updateManualOoo({ id: editSession.id, body: payload }).unwrap();
        toast.success("Manual break updated successfully.");
      } else {
        await addManualOoo(payload).unwrap();
        toast.success("Manual break added successfully.");
      }

      onOpenChange(false);
      setReason("");
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.message || "Failed to save manual break.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editSession ? "Edit Manual Break" : "Add Manual Break"}
      description={
        editSession
          ? "Update the recorded break interval or reason. Changes are recorded in the audit history."
          : "Record a temporary break that you forgot to start or end earlier in the day. The break duration will be deducted from your total working hours."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ooo-date" className="text-xs font-semibold">
            Date
          </Label>
          <DatePicker
            value={date}
            maxDate={todayStr}
            onChange={(val) => val && setDate(val)}
            className="w-full h-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ooo-start" className="text-xs font-semibold">
              Break Start Time <span className="font-mono opacity-75 font-normal">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="ooo-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ooo-end" className="text-xs font-semibold">
              Break End Time <span className="font-mono opacity-75 font-normal">({timeZoneConfig.code})</span>
            </Label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="ooo-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="pl-9 text-xs h-9 rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ooo-reason" className="text-xs font-semibold">
            Break Reason <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {["Lunch break", "Coffee / Personal break", "Out of Office (OOO)", "Appointment / Doctor", "External meeting"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${
                  reason === preset
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "bg-surface-subtle border-border/70 hover:bg-surface-elevated text-muted-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <Input
            id="ooo-reason"
            placeholder="e.g. Lunch break, Out of Office (OOO), Doctor appointment..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs h-9 rounded-lg"
            required
            minLength={2}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
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
            size="sm"
            disabled={isLoading}
            className="rounded-lg text-xs gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editSession ? "Update Break" : "Save Manual Break"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
