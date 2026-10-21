"use client";

import { useRef } from "react";
import { Palette, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { SUITE_ACCENTS, useAccent } from "./accent-provider";
import { cn } from "../lib/utils";

export function AccentPicker() {
  const { accent, setAccent } = useAccent();
  const contentRef = useRef<HTMLDivElement>(null);
  const selected = SUITE_ACCENTS.find((option) => option.id === accent)!;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Change accent color" title="Change accent color" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card/70 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          <Palette className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} align="end" className="w-60 p-4" aria-label="Suite accent color" onOpenAutoFocus={(event) => {
        event.preventDefault();
        contentRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
      }}>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="text-sm font-semibold text-foreground">Accent color</legend>
          <p className="mt-1 mb-3 text-xs leading-relaxed text-muted-foreground">One color across your apps.</p>
          <div className="grid gap-1">
            {SUITE_ACCENTS.map((option) => (
              <label className="relative flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm text-foreground hover:bg-surface-subtle has-checked:bg-surface-subtle has-focus-visible:outline-2 has-focus-visible:outline-ring has-focus-visible:outline-offset-2" key={option.id}>
                <input className="sr-only" type="radio" name="suite-accent" value={option.id} checked={accent === option.id} onChange={() => setAccent(option.id)} />
                <span className={cn("h-4 w-4 shrink-0 rounded-full", option.swatch)} aria-hidden="true" />
                <span>{option.label}</span>
                {accent === option.id && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />}
              </label>
            ))}
          </div>
        </fieldset>
        <p role="status" className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Selected: {selected.label}</p>
      </PopoverContent>
    </Popover>
  );
}
