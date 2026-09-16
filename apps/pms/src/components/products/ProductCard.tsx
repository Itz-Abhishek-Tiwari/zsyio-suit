import Link from "next/link";
import { Button, Badge, formatDate } from "@zsyio/ui";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import {
  Box,
  ArrowUpRight,
  Clock,
  Globe,
  GitFork,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  ExternalLink,
  Layers,
  ShieldAlert,
} from "lucide-react";
import type { Product, TaskStatus, Priority } from "@zsyio/types";

export interface ProductCardProps {
  product: Product & {
    tasks?: {
      id: string;
      title?: string;
      status: TaskStatus;
      priority: Priority;
      type?: string;
      dueDate?: string | null;
    }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  // Format version cleanly without double 'v'
  const rawVersion = product.version?.trim();
  const formattedVersion = rawVersion
    ? rawVersion.startsWith("v")
      ? rawVersion
      : `v${rawVersion}`
    : null;

  const tasks = product.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO" || t.status === "BACKLOG").length;

  const criticalTasks = tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "DONE").length;
  const highTasks = tasks.filter((t) => t.priority === "HIGH" && t.status !== "DONE").length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="group relative w-full rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch">
      <div className="w-full md:w-56 lg:w-64 min-h-[160px] md:min-h-full relative bg-surface-subtle shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center">
        {product.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 bg-radial from-primary/5 via-surface-subtle to-surface-subtle">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs group-hover:scale-110 transition-transform duration-300">
              <Box className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Product Suite
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10">
          <ProductEnvironmentBadge
            environment={product.environment}
            className="backdrop-blur-md shadow-xs bg-background/85"
          />
        </div>

        {formattedVersion && product.imageUrl && (
          <span className="absolute top-3 right-3 z-10 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-white/10 text-foreground shadow-xs">
            {formattedVersion}
          </span>
        )}
      </div>

      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={`/products/${product.id}`}
                className="text-lg font-bold font-display tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group/link"
              >
                <span className="truncate">{product.name}</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover/link:opacity-100 transition-all text-primary shrink-0" />
              </Link>

              {formattedVersion && !product.imageUrl && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border/80 text-foreground/80">
                  {formattedVersion}
                </span>
              )}
            </div>

            {criticalTasks > 0 ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 mt-0.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span>{criticalTasks} critical blocker requiring attention</span>
              </div>
            ) : highTasks > 0 ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{highTasks} high priority task active</span>
              </div>
            ) : null}
          </div>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex text-xs font-semibold h-8 px-3.5 gap-1.5 rounded-xl border-border/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0 shadow-2xs"
          >
            <Link href={`/products/${product.id}`}>
              <span>Open Product Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl bg-surface-subtle/60 border border-border/60 p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ListTodo className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-foreground">
                {totalTasks === 0 ? "No active tasks" : `${totalTasks} ${totalTasks === 1 ? "task in backlog" : "total tasks"}`}
              </span>
            </div>

            {totalTasks > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                <strong className="text-foreground">{completedTasks}</strong> of {totalTasks} completed ({progressPercent}%)
              </span>
            )}
          </div>

          {totalTasks > 0 ? (
            <>
              <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
                {inProgressTasks > 0 && (
                  <Badge variant="warning" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{inProgressTasks} In Progress</span>
                  </Badge>
                )}
                {inReviewTasks > 0 && (
                  <Badge variant="purple" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{inReviewTasks} In Review</span>
                  </Badge>
                )}
                {blockedTasks > 0 && (
                  <Badge variant="destructive" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{blockedTasks} Blocked</span>
                  </Badge>
                )}
                {completedTasks > 0 && (
                  <Badge variant="success" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{completedTasks} Done</span>
                  </Badge>
                )}
                {todoTasks > 0 && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{todoTasks} To Do</span>
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No tasks have been scheduled yet for this product.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            {product.deployedUrl && (
              <a
                href={product.deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors bg-surface-subtle hover:bg-surface-subtle/80 px-2.5 py-1 rounded-lg border border-border/60 text-xs text-foreground/80"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[180px]">{product.deployedUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
            )}

            {product.repoUrl && (
              <a
                href={product.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors bg-surface-subtle hover:bg-surface-subtle/80 px-2.5 py-1 rounded-lg border border-border/60 text-xs text-foreground/80"
              >
                <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Repository</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
            )}

            {product.lastDeployed ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                Deployed {formatDate(product.lastDeployed)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                Created {formatDate(product.createdAt)}
              </span>
            )}
          </div>

          <Button
            asChild
            size="sm"
            variant="ghost"
            className="sm:hidden text-xs font-semibold h-8 px-3 gap-1 rounded-lg ml-auto"
          >
            <Link href={`/products/${product.id}`}>
              <span>Open Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
