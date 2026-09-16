"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useGetTestCasesQuery,
  useCreateTestCaseMutation,
  useUpdateTestCaseMutation,
  useDeleteTestCaseMutation,
  useResetTestCasesMutation,
  useGenerateAiTestCasesMutation,
} from "@/store/api/tasksApi";
import { useSession } from "next-auth/react";
import { TestSheetHeader, type TestFilterType } from "./TestSheetHeader";
import { TestCaseCard } from "./TestCaseCard";
import { TestCaseModal } from "./TestCaseModal";
import { TestSheetEmptyState } from "./TestSheetEmptyState";
import { Button } from "@zsyio/ui";
import { FilterX } from "lucide-react";
import type { TestCase, TestCaseStatus } from "@zsyio/types";

interface TestSheetTabProps {
  taskId: string;
  taskTitle?: string;
  canEdit?: boolean;
}

export function TestSheetTab({ taskId, taskTitle, canEdit = true }: TestSheetTabProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const { data: testCases = [], isLoading } = useGetTestCasesQuery(taskId, {
    skip: !taskId,
  });

  const [createTestCase, { isLoading: isCreating }] = useCreateTestCaseMutation();
  const [updateTestCase] = useUpdateTestCaseMutation();
  const [deleteTestCase] = useDeleteTestCaseMutation();
  const [resetTestCases, { isLoading: isResetting }] = useResetTestCasesMutation();
  const [generateAiTestCases, { isLoading: isGeneratingAi }] = useGenerateAiTestCasesMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TestFilterType>("ALL");

  const totalCount = testCases.length;
  const passedCount = testCases.filter((tc) => tc.status === "PASSED").length;
  const failedCount = testCases.filter((tc) => tc.status === "FAILED").length;
  const blockedCount = testCases.filter((tc) => tc.status === "BLOCKED").length;
  const pendingCount = testCases.filter(
    (tc) => tc.status === "PENDING" || tc.status === "SKIPPED"
  ).length;
  const passPercentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const filteredTestCases = useMemo(() => {
    if (activeFilter === "ALL") return testCases;
    if (activeFilter === "PASSED") return testCases.filter((tc) => tc.status === "PASSED");
    if (activeFilter === "FAILED") return testCases.filter((tc) => tc.status === "FAILED");
    if (activeFilter === "BLOCKED") return testCases.filter((tc) => tc.status === "BLOCKED");
    if (activeFilter === "PENDING") {
      return testCases.filter((tc) => tc.status === "PENDING" || tc.status === "SKIPPED");
    }
    return testCases;
  }, [testCases, activeFilter]);

  const handleStatusChange = async (testCaseId: string, newStatus: TestCaseStatus) => {
    if (!canEdit) return;
    try {
      await updateTestCase({
        taskId,
        testCaseId,
        body: {
          status: newStatus,
          testedById: currentUser?.id,
          testedAt: new Date().toISOString(),
        },
      }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update test case status.");
    }
  };

  const handleUpdateTestCase = async (testCaseId: string, data: Partial<TestCase>) => {
    if (!canEdit) return;
    try {
      await updateTestCase({
        taskId,
        testCaseId,
        body: data,
      }).unwrap();
      toast.success("Test scenario updated successfully.");
    } catch {
      toast.error("Failed to update test scenario.");
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!canEdit) return;
    try {
      await deleteTestCase({ taskId, testCaseId }).unwrap();
      toast.success("Test scenario removed.");
    } catch {
      toast.error("Failed to delete test scenario.");
    }
  };

  const handleCreateTestCase = async (data: {
    title: string;
    description?: string;
    steps?: string;
    expectedResult?: string;
  }) => {
    try {
      await createTestCase({
        taskId,
        body: {
          ...data,
          order: totalCount + 1,
        },
      }).unwrap();
      toast.success("New test scenario added!");
      setIsAddModalOpen(false);
    } catch {
      toast.error("Failed to add test scenario.");
    }
  };

  const handleResetDefaults = async () => {
    if (!canEdit) return;
    try {
      await resetTestCases(taskId).unwrap();
      toast.success("Loaded default QA test suite.");
    } catch {
      toast.error("Failed to load default test scenarios.");
    }
  };

  const handleGenerateAi = async () => {
    if (!canEdit) return;
    try {
      const res = await generateAiTestCases(taskId).unwrap();
      toast.success(`Generated ${res.length} AI QA test scenarios! ✨`);
    } catch {
      toast.error("Failed to generate AI test cases.");
    }
  };

  const handleCopyMarkdown = () => {
    if (!testCases.length) return;
    const rows = testCases
      .map(
        (tc, i) =>
          `| ${i + 1} | ${tc.title} | ${tc.status} | ${tc.expectedResult || "-"} | ${tc.testedBy?.name || "Untested"} |`
      )
      .join("\n");
    const markdown = `# QA Test Report - ${taskTitle || "Ticket"}\n\n| # | Scenario | Status | Expected Result | Tester |\n|---|---|---|---|---|\n${rows}\n\n*Summary: ${passedCount}/${totalCount} Passed (${passPercentage}%)*`;

    navigator.clipboard.writeText(markdown);
    toast.success("QA Test Sheet copied as Markdown table!");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4 animate-pulse">
        <div className="h-28 rounded-lg bg-muted/40" />
        <div className="h-14 rounded-lg bg-muted/40" />
        <div className="h-14 rounded-lg bg-muted/40" />
        <div className="h-14 rounded-lg bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
      <TestSheetHeader
        passedCount={passedCount}
        failedCount={failedCount}
        blockedCount={blockedCount}
        pendingCount={pendingCount}
        totalCount={totalCount}
        passPercentage={passPercentage}
        canEdit={canEdit}
        isGeneratingAi={isGeneratingAi}
        isResetting={isResetting}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCopyMarkdown={handleCopyMarkdown}
        onGenerateAi={handleGenerateAi}
        onResetDefaults={handleResetDefaults}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {testCases.length === 0 ? (
        <TestSheetEmptyState
          canEdit={canEdit}
          isGeneratingAi={isGeneratingAi}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onGenerateAi={handleGenerateAi}
          onResetDefaults={handleResetDefaults}
        />
      ) : filteredTestCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-lg border border-dashed border-border/80 bg-muted/15 text-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground">
            <FilterX className="w-4.5 h-4.5" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            No test scenarios match the &quot;{activeFilter}&quot; filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFilter("ALL")}
            className="h-7.5 text-xs rounded-md mt-1 cursor-pointer"
          >
            Show All Scenarios
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredTestCases.map((tc, index) => (
            <TestCaseCard
              key={tc.id}
              testCase={tc}
              index={index}
              canEdit={canEdit}
              onStatusChange={handleStatusChange}
              onUpdateTestCase={handleUpdateTestCase}
              onDeleteTestCase={handleDeleteTestCase}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <TestCaseModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={handleCreateTestCase}
          isSaving={isCreating}
        />
      )}
    </div>
  );
}
