"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
} from "@zsyio/ui";
import { Clock, Loader2, DollarSign, Sparkles, Check } from "lucide-react";
import { useCreateTimeEntryMutation } from "@/store/api/timeEntriesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManualTimeEntryModalProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualTimeEntryModal({
  taskId,
  open,
  onOpenChange,
}: ManualTimeEntryModalProps) {
  const [createTimeEntry, { isLoading }] = useCreateTimeEntryMutation();

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(true);

  const numHours = parseFloat(hours) || 0;
  const numMinutes = parseInt(minutes, 10) || 0;
  const totalMinutes = Math.round(numHours * 60 + numMinutes);
  const totalDecimalHours = (totalMinutes / 60).toFixed(2);

  const handleApplyPreset = (h: number, m: number) => {
    setHours(String(h));
    setMinutes(String(m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalMinutes <= 0) {
      toast.error("Please enter a valid time duration greater than 0 minutes.");
      return;
    }

    try {
      const startedAt = new Date(`${date}T09:00:00.000Z`).toISOString();
      const endedAt = new Date(
        new Date(startedAt).getTime() + totalMinutes * 60 * 1000
      ).toISOString();

      await createTimeEntry({
        taskId,
        startedAt,
        endedAt,
        durationMin: totalMinutes,
        description: description.trim() || null,
        isBillable,
      }).unwrap();

      toast.success(
        `Logged ${numHours > 0 ? `${numHours}h ` : ""}${numMinutes > 0 ? `${numMinutes}m` : ""} of work!`
      );
      onOpenChange(false);
      setDescription("");
      setHours("1");
      setMinutes("0");
    } catch {
      toast.error("Failed to log time entry.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border/80 shadow-md">
        <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground font-display">
                Log Time Entry
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record completed offline hours or manual work sessions against this ticket.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Quick Duration Presets */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold   text-muted-foreground flex items-center gap-1 font-display">
              <Sparkles className="w-3 h-3 text-warning" />
              Quick Presets
            </Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "15m", h: 0, m: 15 },
                { label: "30m", h: 0, m: 30 },
                { label: "45m", h: 0, m: 45 },
                { label: "1h", h: 1, m: 0 },
                { label: "2h", h: 2, m: 0 },
                { label: "4h (Half Day)", h: 4, m: 0 },
                { label: "8h (Full Day)", h: 8, m: 0 },
              ].map((p) => {
                const isSelected = numHours === p.h && numMinutes === p.m;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.h, p.m)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="log-date" className="text-xs font-semibold text-muted-foreground">
                Date of Work
              </Label>
              <div className="relative">
                <Input
                  id="log-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="log-hours" className="text-xs font-semibold text-muted-foreground">
                Hours
              </Label>
              <Input
                id="log-hours"
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="text-xs font-mono"
              />
            </div>

            {/* Minutes */}
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="log-minutes" className="text-xs font-semibold text-muted-foreground">
                Minutes
              </Label>
              <Input
                id="log-minutes"
                type="number"
                min="0"
                max="59"
                step="5"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Total Duration Calculated Pill */}
          <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Calculated Duration:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">
                {numHours > 0 ? `${numHours}h ` : ""}{numMinutes > 0 ? `${numMinutes}m` : numHours === 0 ? "0m" : ""}
              </span>
              <Badge variant="outline" className="font-mono text-xs py-0 px-1.5">
                {totalDecimalHours}h decimal
              </Badge>
            </div>
          </div>

          {/* Work Summary / Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="log-desc" className="text-xs font-semibold text-muted-foreground">
              Work Summary / Notes
            </Label>
            <Textarea
              id="log-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What tasks or bugfixes were completed during this session? (optional)"
              className="text-xs resize-none"
            />
          </div>

          {/* Billable Toggle Card */}
          <button
            type="button"
            onClick={() => setIsBillable(!isBillable)}
            className={cn(
              "p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer select-none",
              isBillable
                ? "bg-success/10 border-success/30 text-success"
                : "bg-muted/30 border-border/60 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center border",
                  isBillable
                    ? "bg-success text-white border-success/30 shadow-2xs"
                    : "bg-muted text-muted-foreground border-border/80"
                )}
              >
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Client Billable Session
                </span>
                <span className="text-xs text-muted-foreground">
                  Include this effort in client reporting and billable utilization
                </span>
              </div>
            </div>

            <div
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                isBillable
                  ? "bg-success border-success/30 text-white"
                  : "border-border bg-card"
              )}
            >
              {isBillable && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || totalMinutes <= 0}
              className="text-xs font-semibold gap-1.5 shadow-2xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Save Time Log</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
