"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedTabs } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { ProductCard } from "@/components/products/ProductCard";
import { EmptyState } from "@zsyio/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zsyio/ui";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskDueDateBadge,
  TaskShortIdBadge,
  DeveloperBadge,
} from "@/components/tasks/TaskBadges";
import { Package, ListTodo, Plus, ArrowUpRight } from "lucide-react";
import type { TaskStatus, Priority, Environment } from "@zsyio/types";

export interface ClientProfileTabsProps {
  clientId: string;
  canCreateProduct: boolean;
  products: Array<{
    id: string;
    clientId: string;
    name: string;
    imageUrl: string | null;
    version: string | null;
    deployedUrl: string | null;
    repoUrl: string | null;
    environment: Environment;
    lastDeployed: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    tasks: Array<{
      id: string;
      title: string;
      status: TaskStatus;
      priority: Priority;
      type: string;
      dueDate: string | null;
    }>;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    type: string;
    dueDate: Date | null;
    product: { id: string; name: string };
    assignedTo: { id: string; name: string; email: string } | null;
  }>;
  completedTasks: number;
  progressPercent: number;
}

export function ClientProfileTabs({
  clientId,
  canCreateProduct,
  products,
  tasks,
}: ClientProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"products" | "tasks">("products");

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs<"products" | "tasks">
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          tabs={[
            {
              id: "products",
              label: "Products & Deployments",
              icon: <Package className="w-3.5 h-3.5" />,
              count: products.length,
              badgeVariant: "primary",
            },
            {
              id: "tasks",
              label: "Client Tasks & Roadmap",
              icon: <ListTodo className="w-3.5 h-3.5" />,
              count: tasks.length,
              badgeVariant: "primary",
            },
          ]}
        />

        {canCreateProduct && (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary-light"
          >
            <Link href={`/clients/${clientId}/products/new`}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </Button>
        )}
      </div>

      {activeTab === "products" && (
        <div className="animate-fade-in">
          {products.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title="No products registered"
              description="Add software suites, web applications, or tools belonging to this client account."
              action={
                canCreateProduct ? (
                  <Button asChild size="sm" className="mt-2 text-xs font-semibold gap-1.5 rounded-lg">
                    <Link href={`/clients/${clientId}/products/new`}>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Product</span>
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="animate-fade-in">
          {tasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo />}
              title="No tasks recorded"
              description="Tasks created across any of this client's product boards will appear here."
            />
          ) : (
            <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-surface-subtle/50">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="w-[100px] min-w-[100px] font-semibold text-xs   text-muted-foreground py-3 pl-4 whitespace-nowrap">
                        ID
                      </TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-xs   text-muted-foreground py-3">
                        Task Title
                      </TableHead>
                      <TableHead className="min-w-[150px] font-semibold text-xs   text-muted-foreground py-3 whitespace-nowrap">
                        Product
                      </TableHead>
                      <TableHead className="w-[120px] min-w-[120px] font-semibold text-xs   text-muted-foreground py-3 whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="w-[110px] min-w-[110px] font-semibold text-xs   text-muted-foreground py-3 whitespace-nowrap">
                        Priority
                      </TableHead>
                      <TableHead className="w-[150px] min-w-[150px] font-semibold text-xs   text-muted-foreground py-3 whitespace-nowrap">
                        Assignee
                      </TableHead>
                      <TableHead className="w-[110px] min-w-[110px] font-semibold text-xs   text-muted-foreground py-3 whitespace-nowrap">
                        Due Date
                      </TableHead>
                      <TableHead className="w-[44px] min-w-[44px] text-right py-3 pr-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-surface-subtle/40 transition-colors border-b border-border/50">
                        <TableCell className="font-mono text-xs font-semibold py-3.5 pl-4 whitespace-nowrap">
                          <TaskShortIdBadge task={task} className="text-xs" />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground text-xs py-3.5 min-w-[180px]">
                          <Link
                            href={`/tasks?taskId=${task.id}`}
                            className="hover:text-primary transition-colors line-clamp-1"
                            title={task.title}
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3.5 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-subtle border border-border/70 text-xs font-medium text-foreground/85 max-w-[180px] truncate"
                            title={task.product.name}
                          >
                            {task.product.name}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 whitespace-nowrap">
                          <TaskStatusBadge status={task.status} className="text-xs py-0.5" />
                        </TableCell>
                        <TableCell className="py-3.5 whitespace-nowrap">
                          <TaskPriorityBadge priority={task.priority} className="text-xs py-0.5" />
                        </TableCell>
                        <TableCell className="py-3.5 text-xs whitespace-nowrap">
                          {task.assignedTo ? (
                            <DeveloperBadge name={task.assignedTo.name} className="text-xs" />
                          ) : (
                            <span className="text-muted-foreground/60 text-xs italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 whitespace-nowrap">
                          <TaskDueDateBadge
                            dueDate={task.dueDate?.toISOString()}
                            status={task.status}
                            compact
                          />
                        </TableCell>
                        <TableCell className="text-right py-3.5 pr-4 whitespace-nowrap">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary-light"
                          >
                            <Link href={`/tasks?taskId=${task.id}`}>
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
