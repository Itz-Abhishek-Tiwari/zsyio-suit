"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
  Label,
} from "@zsyio/ui";
import { Calendar, FileEdit, ArrowRight, AlertCircle, Loader2, Check } from "lucide-react";

export interface ChangeReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  type?: "date" | "general";
  title?: string;
  description?: string;
  oldValue?: string | null;
  newValue?: string | null;
  isLoading?: boolean;
}

const DATE_REASON_PRESETS = [
  "Client requested deadline extension",
  "External dependency / blocker",
  "Scope change / Added requirements",
  "Sprint re-planning / Capacity adjustment",
  "QA & testing timeline extended",
];

const GENERAL_REASON_PRESETS = [
  "Updated task specifications & scope",
  "Clarified acceptance criteria",
  "Product roadmap re-prioritization",
  "Bug fix & correction of details",
];

export function ChangeReasonModal({
  isOpen,
  onClose,
  onConfirm,
  type = "date",
  title,
  description,
  oldValue,
  newValue,
  isLoading = false,
}: ChangeReasonModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setTouched(false);
    }
  }, [isOpen]);

  const presets = type === "date" ? DATE_REASON_PRESETS : GENERAL_REASON_PRESETS;
  const isDateType = type === "date";
  const modalTitle = title || (isDateType ? "Reason for Due Date Change" : "Reason for Ticket Changes");
  const modalDescription =
    description ||
    (isDateType
      ? "A reason is required whenever a ticket's due date is set or modified."
      : "A reason is required to document this update in the ticket history.");

  const isInvalid = touched && !reason.trim();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden border-border/80 bg-background shadow-md rounded-lg flex flex-col">
        <div className="shrink-0 border-b border-border/70 p-5 pb-4 bg-muted/40">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                {isDateType ? <Calendar className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
              </div>
              <span>{modalTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {modalDescription}
            </DialogDescription>
          </DialogHeader>

          {(oldValue || newValue) && (
            <div className="mt-3.5 p-2.5 rounded-lg bg-card border border-border/70 flex items-center justify-between text-xs gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-muted-foreground ">
                  Previous Date
                </span>
                <span className="font-semibold text-foreground truncate">
                  {oldValue || "No due date"}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <div className="flex flex-col min-w-0 text-right">
                <span className="text-xs font-semibold text-primary ">
                  New Date
                </span>
                <span className="font-semibold text-primary truncate">
                  {newValue || "No due date"}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="changeReasonInput" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Reason for change</span>
                <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>

            <Textarea
              id="changeReasonInput"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (!touched) setTouched(true);
              }}
              placeholder={
                isDateType
                  ? "Explain why the due date is being changed or rescheduled..."
                  : "Explain the rationale for updating this ticket..."
              }
              rows={3}
              className="resize-none text-xs rounded-lg focus-visible:ring-primary"
              autoFocus
            />

            {isInvalid && (
              <p className="text-xs font-medium text-destructive flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Please provide a reason before saving.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold   text-muted-foreground">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const isSelected = reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setReason(preset);
                      setTouched(true);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-left flex items-center gap-1 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-card hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/80"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-2 flex items-center justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !reason.trim()}
              className="h-8 text-xs font-semibold gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Apply"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
