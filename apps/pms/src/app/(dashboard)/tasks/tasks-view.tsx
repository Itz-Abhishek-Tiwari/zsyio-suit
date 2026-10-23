"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button, TopProgressBar, PageHeader } from "@zsyio/ui";
import { TaskFiltersBar } from "@/components/tasks/TaskFiltersBar";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskTable } from "@/components/tasks/TaskTable";

import { useGetTasksQuery, useGetTaskQuery } from "@/store/api/tasksApi";
import { useAppSelector } from "@/store/hooks";
import type { Role } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import { Plus, CheckSquare } from "lucide-react";

import dynamic from "next/dynamic";

// The task modal pulls in the markdown renderer, comments and test sheets; load it on first open.
const TaskViewModal = dynamic(() => import("@/components/tasks/TaskViewModal").then((module) => module.TaskViewModal), { ssr: false });

export function TasksView({ role, permissions }: { role: Role | string; permissions?: string[] | null }) {
  const boardView = useAppSelector((s) => s.boardView);
  const filters = useAppSelector((s) => s.filters);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlTaskId = searchParams?.get("taskId");

  const { data: urlTask } = useGetTaskQuery(urlTaskId ?? "", {
    skip: !urlTaskId,
  });

  // so this subscribes to the existing request instead of firing a new one.
  const activeFilters = boardView === "kanban" ? { ...filters, page: 1, pageSize: 500 } : filters;
  const { isFetching } = useGetTasksQuery(activeFilters);

  const handleCloseUrlModal = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("taskId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {isFetching && <TopProgressBar />}

      <PageHeader
        title="Tasks"
        titleIcon={<CheckSquare className="w-5 h-5" />}
        description="Manage, track, and reassign product tasks across your workflow."
        actions={
          (can(role, "task:create", permissions) ||
            can(role, "task:create:any", permissions) ||
            can(role, "task:create:support", permissions)) ? (
            <Button asChild size="default" className="shadow-xs">
              <Link href="/tasks/new" className="gap-1.5 font-semibold">
                <Plus className="w-4 h-4" />
                <span>New task</span>
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TaskFiltersBar />

      {boardView === "kanban" ? <KanbanBoard filters={filters} /> : <TaskTable filters={filters} />}

      {urlTaskId && (
        <TaskViewModal
          taskId={urlTaskId}
          task={urlTask}
          isOpen={Boolean(urlTaskId)}
          onClose={handleCloseUrlModal}
        />
      )}
    </div>
  );
}


