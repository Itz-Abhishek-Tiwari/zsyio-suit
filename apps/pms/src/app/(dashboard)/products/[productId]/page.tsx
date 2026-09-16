import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import { ProductHeaderActions } from "@/components/products/ProductHeaderActions";
import { KpiCard, PageHeader, AccessDenied } from "@/components/shared";
import { ProductProfileTabs } from "@/components/products/ProductProfileTabs";
import {
  Box,
  CheckCircle2,
  ListTodo,
  Clock,
  Users,
} from "lucide-react";
import type { TaskStatus, Priority } from "@zsyio/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  if (!can(role, "product:view", permissions)) {
    return (
      <AccessDenied
        role={role}
        requiredAction="product:view"
        title="Product Details Restricted"
        description="Viewing this product details and deployment environments requires Product Viewer permissions."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const userId = session.user.id;
  const taskWhere = can(role, "task:view:all", permissions)
    ? { deletedAt: null }
    : { deletedAt: null, OR: [{ assignedToId: userId }, { reviewerId: userId }, { reviewers: { some: { userId } } }, { assignees: { some: { userId } } }] };

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      client: true,
      tasks: {
        where: taskWhere,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          reviewers: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });
  if (!product) notFound();

  const tasks = product.tasks;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const activeTasks = tasks.filter((t) => t.status !== "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const urgentTasks = tasks.filter(
    (t) => (t.priority === "CRITICAL" || t.priority === "HIGH") && t.status !== "DONE"
  ).length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const rawVersion = product.version?.trim();
  const formattedVersion = rawVersion
    ? rawVersion.startsWith("v")
      ? rawVersion
      : `v${rawVersion}`
    : null;

  const assignedUsersCount = new Set(
    tasks.map((t) => t.assignedTo?.id).filter(Boolean)
  ).size;

  const canCreateTask =
    can(role, "task:create", permissions) ||
    can(role, "task:create:any", permissions) ||
    can(role, "task:create:support", permissions);

  const serializedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    priority: t.priority as Priority,
    type: t.type,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    gitBranchSlug: t.gitBranchSlug,
    assignedTo: t.assignedTo,
    reviewer: t.reviewer,
    reviewers: t.reviewers.map((r) => ({
      userId: r.user.id,
      user: r.user,
    })),
    assignees: t.assignees.map((a) => ({
      user: a.user,
    })),
  }));

  const canViewClients = can(role, "client:view", permissions);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 w-full">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {canViewClients ? (
              <>
                <Link href="/clients" className="hover:text-foreground transition-colors">
                  Clients
                </Link>
                <span>/</span>
                <Link
                  href={`/clients/${product.clientId}`}
                  className="hover:text-foreground transition-colors truncate max-w-[180px]"
                >
                  {product.client.name}
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground truncate max-w-[180px]">
                  {product.client.name}
                </span>
                <span>/</span>
              </>
            )}
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        }
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{product.name}</span>
            <ProductEnvironmentBadge environment={product.environment} />
            {formattedVersion && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-foreground/80 border border-border font-mono">
                {formattedVersion}
              </span>
            )}
          </div>
        }
        titleIcon={
          product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Box className="w-5 h-5 text-primary" />
          )
        }
        description={
          <p className="text-xs text-muted-foreground mt-0.5">
            Product workspace and task delivery for <strong className="text-foreground">{product.client.name}</strong>.
          </p>
        }
        actions={
          <ProductHeaderActions
            key="product-header-actions"
            productId={product.id}
            productName={product.name}
            clientId={product.clientId}
            deployedUrl={product.deployedUrl}
            repoUrl={product.repoUrl}
            canEdit={can(role, "product:edit", permissions)}
            canCreateTask={canCreateTask}
            canDelete={can(role, "product:delete", permissions)}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Tasks"
          value={totalTasks}
          subtext={`${completedTasks} finished · ${activeTasks} open`}
          icon={<ListTodo className="w-5 h-5 text-primary" />}
        />
        <KpiCard
          label="Delivery Rate"
          value={`${progressPercent}%`}
          subtext={`${completedTasks} of ${totalTasks} tasks resolved`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <KpiCard
          label="In-Flight Tasks"
          value={activeTasks}
          subtext={
            urgentTasks > 0
              ? `${urgentTasks} critical / high priority`
              : `${inProgressTasks} currently in progress`
          }
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <KpiCard
          label="Team Members"
          value={assignedUsersCount}
          subtext={assignedUsersCount === 1 ? "1 active developer" : `${assignedUsersCount} active developers`}
          icon={<Users className="w-5 h-5 text-sky-500" />}
        />
      </div>

      <div className="w-full">
        <ProductProfileTabs
          productId={product.id}
          productName={product.name}
          clientId={product.clientId}
          clientName={product.client.name}
          clientDomain={product.client.domain}
          clientLogoUrl={product.client.logoUrl}
          clientStatus={product.client.status}
          version={formattedVersion}
          deployedUrl={product.deployedUrl}
          repoUrl={product.repoUrl}
          environment={product.environment}
          lastDeployed={product.lastDeployed ? product.lastDeployed.toISOString() : null}
          canCreateTask={canCreateTask}
          canViewClients={canViewClients}
          tasks={serializedTasks}
        />
      </div>
    </div>
  );
}
