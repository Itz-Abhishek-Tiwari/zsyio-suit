"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button, SegmentedTabs, type SegmentedTabItem } from "@zsyio/ui";
import {
  FileCheck2,
  Copy,
  Sparkles,
  RotateCcw,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";

export type TestFilterType = "ALL" | "PASSED" | "FAILED" | "BLOCKED" | "PENDING";

interface TestSheetHeaderProps {
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  pendingCount: number;
  totalCount: number;
  passPercentage: number;
  canEdit: boolean;
  isGeneratingAi: boolean;
  isResetting: boolean;
  activeFilter?: TestFilterType;
  onFilterChange?: (filter: TestFilterType) => void;
  onCopyMarkdown: () => void;
  onGenerateAi: () => void;
  onResetDefaults: () => void;
  onOpenAddModal: () => void;
}

export function TestSheetHeader({
  passedCount,
  failedCount,
  blockedCount,
  pendingCount,
  totalCount,
  passPercentage,
  canEdit,
  isGeneratingAi,
  isResetting,
  activeFilter = "ALL",
  onFilterChange,
  onCopyMarkdown,
  onGenerateAi,
  onResetDefaults,
  onOpenAddModal,
}: TestSheetHeaderProps) {
  const filterTabs: Array<SegmentedTabItem<TestFilterType>> = [
    {
      id: "ALL",
      label: "All",
      icon: <Layers className="w-3.5 h-3.5" />,
      count: totalCount,
      badgeVariant: "default",
    },
    {
      id: "PASSED",
      label: "Passed",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
      count: passedCount,
      badgeVariant: "emerald",
    },
    {
      id: "FAILED",
      label: "Failed",
      icon: <XCircle className="w-3.5 h-3.5 text-destructive" />,
      count: failedCount,
      badgeVariant: "rose",
    },
    ...(blockedCount > 0
      ? [
          {
            id: "BLOCKED" as TestFilterType,
            label: "Blocked",
            icon: <AlertTriangle className="w-3.5 h-3.5 text-warning" />,
            count: blockedCount,
            badgeVariant: "amber" as const,
          },
        ]
      : []),
    {
      id: "PENDING",
      label: "Pending",
      icon: <Clock className="w-3.5 h-3.5 text-notion-blue-fg" />,
      count: pendingCount,
      badgeVariant: "default",
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-3 border-b border-border/70">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-success/10 text-success border border-success/25 flex items-center justify-center shrink-0 shadow-2xs">
            <FileCheck2 className="w-4 h-4" />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-foreground font-display tracking-tight">
                QA Test Sheet &amp; Acceptance Criteria
              </h3>

              {totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-semibold border bg-surface-subtle border-border/80 text-foreground-secondary shadow-2xs">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      passPercentage === 100
                        ? "bg-success"
                        : passPercentage > 0
                        ? "bg-notion-blue-fg"
                        : "bg-muted-foreground"
                    )}
                  />
                  <span>
                    {passedCount}/{totalCount} Passed ({passPercentage}%)
                  </span>
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {canEdit
                ? "Manage test scenarios, track verification results, and generate AI test plans."
                : "QA test scenarios and verification results (View Only)."}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyMarkdown}
              className="h-8 text-xs gap-1.5 rounded-md border-border/80 hover:bg-surface-subtle text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
              title="Copy markdown table for PR or release notes"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy MD</span>
            </Button>
          )}

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateAi}
                disabled={isGeneratingAi}
                className="h-8 text-xs gap-1.5 rounded-md border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-all cursor-pointer shadow-2xs"
                title="Generate tailored QA test scenarios with AI"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>AI Generate</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onResetDefaults}
                disabled={isResetting}
                className="h-8 text-xs gap-1.5 rounded-md border-border/80 hover:bg-surface-subtle text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                title="Reset test suite back to standard default QA template"
              >
                <RotateCcw className={cn("w-3.5 h-3.5", isResetting && "animate-spin")} />
                <span>Defaults</span>
              </Button>

              <Button
                size="sm"
                onClick={onOpenAddModal}
                className="h-8 text-xs gap-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-2xs transition-all cursor-pointer px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col gap-3 pt-1">
          {/* Refined segmented progress indicator */}
          <div className="w-full h-1.5 rounded-full bg-surface-subtle overflow-hidden flex border border-border/40 shadow-2xs">
            {passedCount > 0 && (
              <div
                style={{ width: `${(passedCount / totalCount) * 100}%` }}
                className="bg-success transition-all duration-150 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                title={`Passed: ${passedCount}`}
              />
            )}
            {failedCount > 0 && (
              <div
                style={{ width: `${(failedCount / totalCount) * 100}%` }}
                className="bg-destructive transition-all duration-150"
                title={`Failed: ${failedCount}`}
              />
            )}
            {blockedCount > 0 && (
              <div
                style={{ width: `${(blockedCount / totalCount) * 100}%` }}
                className="bg-warning transition-all duration-150"
                title={`Blocked: ${blockedCount}`}
              />
            )}
          </div>

          {/* Unified Zsyio SegmentedTabs Filter */}
          <div className="overflow-x-auto pb-0.5">
            <SegmentedTabs<TestFilterType>
              value={activeFilter}
              onChange={(filter) => onFilterChange?.(filter)}
              size="sm"
              tabs={filterTabs}
            />
          </div>
        </div>
      )}
    </div>
  );
}
