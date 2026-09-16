"use client";

import React from "react";
import { Button } from "@zsyio/ui";
import { FileCheck2, RotateCcw, Sparkles, Plus } from "lucide-react";

interface TestSheetEmptyStateProps {
  canEdit: boolean;
  isGeneratingAi: boolean;
  onOpenAddModal: () => void;
  onGenerateAi: () => void;
  onResetDefaults: () => void;
}

export function TestSheetEmptyState({
  canEdit,
  isGeneratingAi,
  onOpenAddModal,
  onGenerateAi,
  onResetDefaults,
}: TestSheetEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed border-border/80 bg-surface-subtle/50 text-center gap-3">
      <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
        <FileCheck2 className="w-5 h-5" />
      </div>

      <div className="flex flex-col items-center gap-1 max-w-md">
        <h4 className="text-sm font-bold text-foreground tracking-tight">
          No QA test scenarios created yet
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {canEdit
            ? "Create structured test scenarios to verify acceptance criteria, prevent regressions, or let AI generate a tailored test plan."
            : "No QA test cases have been added to this ticket yet."}
        </p>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="h-8 text-xs rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-1.5 shadow-2xs transition-all cursor-pointer px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Scenario
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateAi}
            disabled={isGeneratingAi}
            className="h-8 text-xs rounded-md border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate with AI
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onResetDefaults}
            className="h-8 text-xs rounded-md gap-1.5 border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load Standard Suite
          </Button>
        </div>
      )}
    </div>
  );
}
