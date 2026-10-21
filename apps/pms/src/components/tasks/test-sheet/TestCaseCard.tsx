"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@zsyio/ui";
import { Textarea } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import { UserAvatar } from "@zsyio/ui";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Save,
  X,
  ListChecks,
  Target,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import { STATUS_CONFIG, formatRelativeTime } from "./test-sheet.constants";
import type { TestCase, TestCaseStatus } from "@zsyio/types";

interface TestCaseCardProps {
  testCase: TestCase;
  index: number;
  canEdit: boolean;
  onStatusChange: (id: string, status: TestCaseStatus) => void;
  onUpdateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  onDeleteTestCase: (id: string) => Promise<void>;
}

export function TestCaseCard({
  testCase: tc,
  index,
  canEdit,
  onStatusChange,
  onUpdateTestCase,
  onDeleteTestCase,
}: TestCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<TestCase>>({});

  const statusInfo = STATUS_CONFIG[tc.status] || STATUS_CONFIG.PENDING;

  const handleStartEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditFormData({
      title: tc.title,
      description: tc.description,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      notes: tc.notes,
    });
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editFormData.title?.trim()) return;
    await onUpdateTestCase(tc.id, editFormData);
    setIsEditing(false);
  };

  const renderFormattedSteps = (rawSteps?: string | null) => {
    if (!rawSteps || !rawSteps.trim()) {
      return (
        <p className="text-xs text-muted-foreground italic">No explicit steps specified.</p>
      );
    }

    const lines = rawSteps
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const isList = lines.some((l) => /^\d+[\.\)]\s*/.test(l) || /^[-*•]\s*/.test(l));

    if (isList) {
      return (
        <div className="flex flex-col gap-2 pt-1">
          {lines.map((line, i) => {
            const cleanText = line.replace(/^(\d+[\.\)]|[-*•])\s*/, "");
            const stepNumMatch = line.match(/^(\d+)[\.\)]/);
            const stepNum = stepNumMatch ? stepNumMatch[1] : `${i + 1}`;

            return (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-surface-subtle text-foreground-secondary border border-border/80 flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5 shadow-2xs">
                  {stepNum}
                </span>
                <span className="text-xs text-foreground/90 leading-relaxed pt-0.5">
                  {cleanText}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line pt-1">
        {rawSteps}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-150 bg-card overflow-hidden shadow-2xs",
        isExpanded ? "border-border shadow-xs" : "border-border/70 hover:border-border hover:shadow-xs"
      )}
    >
      <div
        onClick={() => !isEditing && setIsExpanded((prev) => !prev)}
        className={cn(
          "p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none",
          isExpanded ? "bg-surface-subtle/50 border-b border-border/70" : "hover:bg-surface-subtle/40"
        )}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="font-mono text-xs font-semibold text-muted-foreground bg-surface-subtle px-1.5 py-0.5 rounded-md border border-border/80 shrink-0">
            #{String(index + 1).padStart(2, "0")}
          </span>

          <div onClick={(e) => e.stopPropagation()}>
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 transition-all cursor-pointer shadow-2xs",
                      statusInfo.bg,
                      statusInfo.border,
                      statusInfo.textColor,
                      statusInfo.pillBg
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotColor)} />
                    <span>{statusInfo.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 rounded-md p-1 shadow-md border border-border/80">
                  {(Object.keys(STATUS_CONFIG) as TestCaseStatus[]).map((st) => {
                    const conf = STATUS_CONFIG[st];
                    const ItemIcon = conf.icon;
                    return (
                      <DropdownMenuItem
                        key={st}
                        onClick={() => onStatusChange(tc.id, st)}
                        className={cn(
                          "flex items-center gap-2 text-xs font-medium cursor-pointer rounded-md px-2.5 py-1.5",
                          tc.status === st && "bg-muted font-semibold text-foreground"
                        )}
                      >
                        <ItemIcon className={cn("w-3.5 h-3.5", conf.color)} />
                        <span>{conf.label}</span>
                        {tc.status === st && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 select-none shadow-2xs",
                  statusInfo.bg,
                  statusInfo.border,
                  statusInfo.textColor
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotColor)} />
                <span>{statusInfo.label}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editFormData.title || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Scenario title..."
                  className="h-8 text-xs font-semibold rounded-lg bg-background"
                />
              </div>
            ) : (
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium tracking-tight truncate",
                  tc.status === "PASSED" && "text-foreground",
                  tc.status === "FAILED" && "text-destructive font-semibold",
                  tc.status === "BLOCKED" && "text-warning font-semibold",
                  tc.status === "PENDING" && "text-foreground"
                )}
              >
                {tc.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {canEdit && !isEditing && (
            <>
              {tc.status !== "PASSED" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(tc.id, "PASSED")}
                  title="Mark as Passed"
                  className="w-7 h-7 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}

              {tc.status !== "FAILED" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(tc.id, "FAILED")}
                  title="Mark as Failed"
                  className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors cursor-pointer"
            title={isExpanded ? "Collapse scenario details" : "Expand scenario details"}
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180 text-foreground"
              )}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-muted/[0.12] flex flex-col gap-4 text-xs animate-fade-in">
          {isEditing ? (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground   mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Description / Objective
                </label>
                <Input
                  value={editFormData.description || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Summary of the scenario objective..."
                  className="text-xs rounded-lg bg-background h-8.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground   mb-1.5 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    Steps to Execute
                  </label>
                  <Textarea
                    rows={4}
                    value={editFormData.steps || ""}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, steps: e.target.value }))
                    }
                    placeholder="1. Navigate to...&#10;2. Fill form...&#10;3. Submit..."
                    className="text-xs rounded-lg bg-background font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground   mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Expected Result
                  </label>
                  <Textarea
                    rows={4}
                    value={editFormData.expectedResult || ""}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        expectedResult: e.target.value,
                      }))
                    }
                    placeholder="Describe expected system behavior and success state..."
                    className="text-xs rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground   mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Execution Notes & Observations
                </label>
                <Textarea
                  rows={2}
                  value={editFormData.notes || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Actual outcome, environment details, or defect notes..."
                  className="text-xs rounded-lg bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="h-8 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-8 text-xs rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              {tc.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tc.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ListChecks className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono font-semibold   text-muted-foreground">
                      Steps to Test
                    </span>
                  </div>
                  {renderFormattedSteps(tc.steps)}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Target className="w-3.5 h-3.5 text-success" />
                    <span className="text-xs font-mono font-semibold   text-muted-foreground">
                      Expected Result
                    </span>
                  </div>
                  <div className="rounded-md border border-border/80 bg-surface-subtle/70 dark:bg-card/40 p-3 text-xs text-foreground/90 leading-relaxed font-normal">
                    {tc.expectedResult || "System behaves as expected per ticket requirements."}
                  </div>
                </div>
              </div>

              {tc.notes && (
                <div className="rounded-md border border-border/80 bg-surface-subtle/70 dark:bg-card/40 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-warning">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-mono font-semibold  ">
                      Tester Notes
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed pl-5 font-normal">
                    {tc.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {tc.testedBy ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-subtle border border-border/80 text-xs shadow-2xs">
                      <UserAvatar
                        user={{ name: tc.testedBy.name, email: tc.testedBy.email }}
                        size="xs"
                        className="w-4.5 h-4.5 text-xs"
                      />
                      <span className="font-semibold text-foreground">
                        {tc.testedBy.name}
                      </span>
                      {tc.testedAt && (
                        <span className="text-muted-foreground text-xs">
                          · {formatRelativeTime(tc.testedAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-subtle/60 border border-border/60 text-xs font-mono text-muted-foreground">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      Untested
                    </span>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleStartEdit}
                      className="h-7 text-xs px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTestCase(tc.id);
                      }}
                      className="h-7 text-xs px-2 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
