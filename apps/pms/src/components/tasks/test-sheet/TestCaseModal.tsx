"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Textarea } from "@zsyio/ui";
import { Loader2, Plus, FileEdit, FileText, ListChecks, Target } from "lucide-react";
import type { TestCase } from "@zsyio/types";

interface TestCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    steps?: string;
    expectedResult?: string;
  }) => Promise<void>;
  initialData?: Partial<TestCase> | null;
  isSaving: boolean;
}

export function TestCaseModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSaving,
}: TestCaseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setSteps(initialData?.steps || "");
      setExpectedResult(initialData?.expectedResult || "");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      steps: steps.trim() || undefined,
      expectedResult: expectedResult.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl p-5 sm:p-6 border-border/80 shadow-xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              {initialData?.id ? <FileEdit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground font-display">
                {initialData?.id ? "Edit Test Scenario" : "Add New Test Scenario"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                Define the steps and expected behavior to verify this ticket.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 py-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              Scenario Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify checkout completes when payment is authorized"
              required
              className="text-xs h-9 rounded-md"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Description / Objective
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Happy path test ensuring order persistence and invoice generation"
              className="text-xs h-9 rounded-md"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-primary" />
              Steps to Execute
            </label>
            <Textarea
              rows={3}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Navigate to /checkout&#10;2. Enter valid card details&#10;3. Click 'Pay Now'"
              className="text-xs rounded-md font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Expected Result
            </label>
            <Textarea
              rows={2}
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Order is confirmed, user redirected to success page, and confirmation email sent."
              className="text-xs rounded-md"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-8 text-xs rounded-md border-border/80 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !title.trim()}
              className="h-8 text-xs rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-2xs gap-1.5 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialData?.id ? "Save Changes" : "Create Scenario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
