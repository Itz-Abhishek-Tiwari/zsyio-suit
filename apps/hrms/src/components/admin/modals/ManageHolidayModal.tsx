"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Input, Label, Textarea } from "@zsyio/ui";
import { CalendarHeart, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import {
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
} from "@/store/api/timesheetApi";
import type { CompanyHoliday } from "@zsyio/types";
import { toast } from "sonner";

interface ManageHolidayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: CompanyHoliday | null;
  defaultYear?: number;
  existingHolidays?: CompanyHoliday[];
}

export function ManageHolidayModal({
  open,
  onOpenChange,
  holiday,
  defaultYear,
  existingHolidays = [],
}: ManageHolidayModalProps) {
  const currentYear = defaultYear || new Date().getFullYear();
  const isEditing = Boolean(holiday);

  const [name, setName] = useState("");
  const [date, setDate] = useState(`${currentYear}-01-01`);
  const [isOptional, setIsOptional] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const conflictingHoliday = existingHolidays.find(
    (h) => h.date === date && (!holiday || h.id !== holiday.id)
  );

  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (holiday) {
      setName(holiday.name);
      setDate(holiday.date);
      setIsOptional(holiday.isOptional ?? false);
      setDescription(holiday.description || "");
    } else {
      setName("");
      setDate(`${currentYear}-01-01`);
      setIsOptional(false);
      setDescription("");
    }
    setError(null);
  }, [holiday, currentYear, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a holiday name.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Please select a valid holiday date (YYYY-MM-DD).");
      return;
    }
    if (conflictingHoliday) {
      setError(`A holiday ("${conflictingHoliday.name}") is already scheduled on ${date}.`);
      return;
    }

    setError(null);

    try {
      if (isEditing && holiday) {
        await updateHoliday({
          id: holiday.id,
          input: {
            name: name.trim(),
            date,
            isOptional,
            description: description.trim() || null,
          },
        }).unwrap();
        toast.success(`Holiday "${name}" updated successfully.`);
      } else {
        await createHoliday({
          name: name.trim(),
          date,
          isOptional,
          description: description.trim() || null,
        }).unwrap();
        toast.success(`Holiday "${name}" added to company calendar.`);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      setError(e?.data?.error?.message || "Failed to save holiday.");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Company Holiday" : "Add Company Holiday"}
      icon={<CalendarHeart className="w-5 h-5 text-sky-500" />}
      iconVariant="indigo"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4.5 pt-1">
        {error && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="holiday-name" className="text-xs font-semibold">
            Holiday Title <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="holiday-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Independence Day, Diwali, Thanksgiving"
            required
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="holiday-date" className="text-xs font-semibold">
              Date (YYYY-MM-DD) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-xs font-mono"
            />
            {conflictingHoliday && (
              <p className="text-[11px] text-rose-500 font-medium">
                Conflict: &ldquo;{conflictingHoliday.name}&rdquo; already exists on this date.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Holiday Classification</Label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOptional(false)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  !isOptional
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300 font-bold shadow-xs"
                    : "bg-surface-subtle border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                Mandatory
              </button>
              <button
                type="button"
                onClick={() => setIsOptional(true)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isOptional
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold shadow-xs"
                    : "bg-surface-subtle border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                Optional / Restricted
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="holiday-desc" className="text-xs font-semibold">
            Description / Significance (Optional)
          </Label>
          <Textarea
            id="holiday-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Worldwide tribute to workers' historic contributions and labor rights."
            rows={3}
            className="text-xs resize-none"
          />
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/70 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            {isOptional
              ? "Optional holidays allow employees to request restricted festive leave according to company leave policies."
              : "Mandatory public holidays are non-working company days and are excluded from employee absence calculations."}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isSaving}
            className="rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{isEditing ? "Save Changes" : "Create Holiday"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
