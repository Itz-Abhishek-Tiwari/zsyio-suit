"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface DatePickerProps {
  value?: string | null; // Expected format: YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: string;
  minDate?: string;
  className?: string;
  id?: string;
  name?: string;
  formatFn?: (date: Date) => string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseISO(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr?: string | null): string {
  const parsed = parseISO(dateStr);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

import * as PopoverPrimitive from "@radix-ui/react-popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  disabled = false,
  maxDate,
  minDate,
  className,
  id,
  name,
  formatFn,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => parseISO(value), [value]);

  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return selectedDate || new Date();
  });

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelectDay = (date: Date) => {
    const iso = formatISO(date);
    if (maxDate && iso > maxDate) return;
    if (minDate && iso < minDate) return;
    onChange?.(iso);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.("");
  };

  const handleQuickPreset = (presetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + presetDays);
    handleSelectDay(target);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      {name && <input type="hidden" name={name} value={value || ""} id={id} />}

      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "group flex h-10 w-full items-center justify-between rounded-xl border border-input-border bg-input px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-all duration-150 outline-none cursor-pointer",
            "hover:border-border-strong",
            isOpen
              ? "border-ring ring-4 ring-ring/15"
              : "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15",
            disabled && "cursor-not-allowed opacity-50 bg-surface-subtle",
            className
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
            <span className={cn("truncate", !value && "text-muted-foreground/60 font-normal")}>
              {value ? (formatFn && selectedDate ? formatFn(selectedDate) : formatDisplayDate(value)) : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && !disabled && (
              <span
                onClick={handleClear}
                title="Clear date"
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive-light/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="top"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-72 rounded-2xl border border-border bg-surface-elevated p-3.5 shadow-2xl animate-fade-in select-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-border/60 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="flex-1 py-1 px-2 rounded-lg bg-surface-subtle hover:bg-primary-light hover:text-primary transition-colors text-center font-bold text-foreground-secondary cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(1)}
              className="flex-1 py-1 px-2 rounded-lg bg-surface-subtle hover:bg-primary-light hover:text-primary transition-colors text-center font-bold text-foreground-secondary cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              className="flex-1 py-1 px-2 rounded-lg bg-surface-subtle hover:bg-primary-light hover:text-primary transition-colors text-center font-bold text-foreground-secondary cursor-pointer"
            >
              +1 Week
            </button>
          </div>

          <div className="flex items-center justify-between px-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-foreground font-display">
              {MONTH_NAMES[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] font-bold text-muted-foreground uppercase">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateIso = formatISO(date);
              const isSelected = value === dateIso;

              const dateObj = new Date(date);
              dateObj.setHours(0, 0, 0, 0);
              const isToday = dateObj.getTime() === today.getTime();

              const isDayDisabled = Boolean(
                (maxDate && dateIso > maxDate) || (minDate && dateIso < minDate)
              );

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => !isDayDisabled && handleSelectDay(date)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all relative mx-auto",
                    isDayDisabled
                      ? "text-muted-foreground/20 cursor-not-allowed opacity-30 select-none pointer-events-none"
                      : "cursor-pointer",
                    !isDayDisabled && !isCurrentMonth && "text-muted-foreground/30 font-normal",
                    !isDayDisabled && isCurrentMonth && !isSelected && "text-foreground hover:bg-surface-subtle",
                    !isDayDisabled && isToday && !isSelected && "border border-primary text-primary font-bold",
                    !isDayDisabled && isSelected && "bg-primary text-primary-foreground font-bold shadow-xs"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
