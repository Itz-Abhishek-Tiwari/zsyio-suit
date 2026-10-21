"use client";

import Link from "next/link";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zsyio/ui";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskDueDateBadge,
  TaskShortIdBadge,
  DeveloperBadge,
  TaskTypeBadge,
} from "@/components/tasks/TaskBadges";
import {
  ListTodo,
  Search,
  Plus,
  ArrowUpRight,
  GitBranch,
  FilterX,
} from "lucide-react";
import type { TaskStatus, Priority } from "@zsyio/types";

export interface SerializedProductTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  type: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  gitBranchSlug: string | null;
  assignedTo: { id: string; name: string; email: string } | null;
  assignees?: Array<{
    user: { id: string; name: string; email: string };
  }>;
}

export interface ProductTasksTabProps {
  productId: string;
  clientId: string;
  productName: string;
  canCreateTask: boolean;
  tasks: SerializedProductTask[];
  filteredTasks: SerializedProductTask[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
}

export function ProductTasksTab({
  productId,
  clientId,
  productName,
  canCreateTask,
  tasks,
  filteredTasks,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
}: ProductTasksTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, ticket ID, or assignee..."
            className="pl-9 h-9 text-xs rounded-lg bg-surface-subtle/60 border-border/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs rounded-lg w-[135px] bg-surface-subtle/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">All Active</SelectItem>
              <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW" className="text-xs">In Review</SelectItem>
              <SelectItem value="TODO" className="text-xs">To Do</SelectItem>
              <SelectItem value="BACKLOG" className="text-xs">Backlog</SelectItem>
              <SelectItem value="BLOCKED" className="text-xs">Blocked</SelectItem>
              <SelectItem value="DONE" className="text-xs">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-xs rounded-lg w-[135px] bg-surface-subtle/60">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="CRITICAL" className="text-xs">Critical</SelectItem>
              <SelectItem value="HIGH" className="text-xs">High</SelectItem>
              <SelectItem value="MEDIUM" className="text-xs">Medium</SelectItem>
              <SelectItem value="LOW" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 text-center rounded-lg border border-dashed border-border/80 bg-card/50">
          <div className="w-12 h-12 rounded-lg bg-surface-subtle border border-border flex items-center justify-center mb-3">
            <ListTodo className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No tasks found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            {tasks.length === 0
              ? `No tasks have been created for ${productName} yet.`
              : "No tasks match your current search and filter criteria."}
          </p>
          {canCreateTask && tasks.length === 0 && (
            <Button asChild size="sm" className="font-semibold gap-1.5 shadow-xs">
              <Link href={`/tasks/new?productId=${productId}&clientId=${clientId}`}>
                <Plus className="w-4 h-4" />
                <span>Create First Task</span>
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/80 bg-surface-subtle/50">
                <TableHead className="w-[110px] text-xs font-semibold   text-muted-foreground pl-4">
                  ID
                </TableHead>
                <TableHead className="text-xs font-semibold   text-muted-foreground">
                  Task
                </TableHead>
                <TableHead className="w-[120px] text-xs font-semibold   text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold   text-muted-foreground">
                  Priority
                </TableHead>
                <TableHead className="w-[160px] text-xs font-semibold   text-muted-foreground">
                  Assignee
                </TableHead>
                <TableHead className="w-[120px] text-xs font-semibold   text-muted-foreground">
                  Due Date
                </TableHead>
                <TableHead className="w-[45px] text-right pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="group transition-colors hover:bg-surface-subtle/60 cursor-pointer"
                >
                  <TableCell className="pl-4 font-mono font-semibold text-xs py-3.5">
                    <Link href={`/tasks?taskId=${task.id}`}>
                      <TaskShortIdBadge task={task} />
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <Link
                      href={`/tasks?taskId=${task.id}`}
                      className="flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TaskTypeBadge type={task.type} />
                        {task.gitBranchSlug && (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/80 bg-surface-subtle px-1.5 py-0.5 rounded border border-border/50">
                            <GitBranch className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[180px]">{task.gitBranchSlug}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <TaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="py-3.5">
                    <TaskPriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell className="py-3.5">
                    {task.assignedTo ? (
                      <DeveloperBadge name={task.assignedTo.name} />
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <TaskDueDateBadge dueDate={task.dueDate} status={task.status} />
                  </TableCell>
                  <TableCell className="py-3.5 text-right pr-4">
                    <Link
                      href={`/tasks?taskId=${task.id}`}
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-surface-elevated transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
