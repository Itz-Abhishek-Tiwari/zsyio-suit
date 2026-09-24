"use client";

import { useState } from "react";
import { Modal, Button, Input, Label } from "@zsyio/ui";
import { Coffee, Utensils, Calendar, Briefcase, UserCheck, Building2, Loader2 } from "lucide-react";
import { useStartOooMutation } from "@/store/api/timesheetApi";
import { toast } from "sonner";

interface StartOooModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_REASONS = [
  { label: "Lunch break", icon: Utensils },
  { label: "Coffee / Personal break", icon: Coffee },
  { label: "Out of Office (OOO)", icon: Building2 },
  { label: "Appointment / Doctor", icon: Calendar },
  { label: "External meeting", icon: Briefcase },
  { label: "Personal work", icon: UserCheck },
];

export function StartOooModal({ open, onOpenChange }: StartOooModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("Lunch break");
  const [customReason, setCustomReason] = useState("");
  const [startOoo, { isLoading }] = useStartOooMutation();

  const handleStart = async () => {
    const finalReason = customReason.trim() || selectedPreset;
    try {
      await startOoo({ reason: finalReason }).unwrap();
      toast.success(`You are now on break: ${finalReason}`);
      onOpenChange(false);
      setCustomReason("");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to start break.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Take a Break"
      description="Record a temporary break during your working day. Your status will switch to On Break until you return."
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Quick Reason</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_REASONS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.label && !customReason;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.label);
                    setCustomReason("");
                  }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border hover:bg-surface-elevated text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="custom-reason" className="text-xs font-semibold">
            Or Specify Custom Reason
          </Label>
          <Input
            id="custom-reason"
            placeholder="e.g. Bank visit, 30m team sync..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="text-xs h-9 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Start Break</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
