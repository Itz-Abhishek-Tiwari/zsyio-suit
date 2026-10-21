import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { ClientHeaderActions } from "@/components/clients/ClientHeaderActions";
import { KpiCard, PageHeader, AccessDenied } from "@/components/shared";
import { ClientProfileTabs } from "@/components/clients/ClientProfileTabs";

import { Button } from "@zsyio/ui";

import {
  Building2,
  Globe,
  Mail,
  Phone,
  Calendar,
  Package,
  ExternalLink,
  Users,
  Clock,
  CheckCircle2,
  ListTodo,
  ShieldCheck,
  StickyNote,
} from "lucide-react";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  if (!can(role, "client:view", permissions)) {
    return (
      <AccessDenied
        role={role}
        requiredAction="client:view"
        title="Client Profile Restricted"
        description="Viewing this client account and their product portfolio requires Client Viewer permissions."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          tasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              type: true,
              dueDate: true,
              updatedAt: true,
              assignedTo: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  });
  if (!client) notFound();

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const allTasks = client.products.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, product: { id: p.id, name: p.name } }))
  );
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
  const activeTasks = allTasks.filter((t) => t.status !== "DONE").length;
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED").length;
  const urgentTasks = allTasks.filter(
    (t) => (t.priority === "CRITICAL" || t.priority === "HIGH") && t.status !== "DONE"
  ).length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let contractDurationStr = "Continuous";
  if (client.contractStart) {
    const start = new Date(client.contractStart);
    const now = new Date();
    const diffMonths = Math.max(
      1,
      Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    contractDurationStr = `Active for ${diffMonths} ${diffMonths === 1 ? "month" : "months"}`;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {client.name}
            </span>
          </div>
        }
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{client.name}</span>
            <ClientStatusBadge status={client.status} />
          </div>
        }
        titleIcon={
          client.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-full h-full object-contain p-1 rounded-lg"
            />
          ) : (
            <span className="font-semibold text-sm text-primary">{initials}</span>
          )
        }
        description={
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-0.5">
            {client.domain && (
              <a
                href={client.domain.startsWith("http") ? client.domain : `https://${client.domain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>{client.domain.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
            {client.contactName && (
              <span className="inline-flex items-center gap-1 text-foreground/80 font-medium">
                <Users className="w-3.5 h-3.5 text-muted-foreground/70" />
                Lead: <strong className="text-foreground">{client.contactName}</strong>
              </span>
            )}
          </div>
        }
        actions={
          <ClientHeaderActions
            key="client-header-actions"
            clientId={client.id}
            clientName={client.name}
            canEdit={can(role, "client:edit", permissions)}
            canCreateProduct={can(role, "product:create", permissions)}
            canDelete={can(role, "client:delete", permissions)}
          />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Products Suite"
          value={client.products.length}
          subtext={`${client.products.length} registered products`}
          icon={<Package className="w-5 h-5 text-primary" />}
        />
        <KpiCard
          label="Delivery Progress"
          value={`${progressPercent}%`}
          subtext={`${completedTasks} of ${totalTasks} tasks done`}
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        />
        <KpiCard
          label="Active Workload"
          value={activeTasks}
          subtext={urgentTasks > 0 ? `${urgentTasks} high priority` : "All on schedule"}
          icon={<ListTodo className="w-5 h-5 text-warning" />}
        />
        <KpiCard
          label="Account Status"
          value={client.status}
          subtext={client.contractStart ? `Since ${formatDate(client.contractStart)}` : contractDurationStr}
          icon={<Clock className="w-5 h-5 text-notion-blue-fg" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ClientProfileTabs
            clientId={client.id}
            canCreateProduct={can(role, "product:create", permissions)}
            products={client.products.map((product) => ({
              ...product,
              createdAt: product.createdAt.toISOString(),
              updatedAt: product.updatedAt.toISOString(),
              lastDeployed: product.lastDeployed?.toISOString() ?? null,
              deletedAt: product.deletedAt?.toISOString() ?? null,
              tasks: product.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                type: t.type,
                dueDate: t.dueDate?.toISOString() ?? null,
              })),
            }))}
            tasks={allTasks}
            completedTasks={completedTasks}
            progressPercent={progressPercent}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-semibold   text-foreground">
                  Organization Details
                </h3>
                <span className="text-xs text-muted-foreground">Company & contact profile</span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="rounded-lg bg-surface-subtle/50 p-3 border border-border/50 flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Primary Contact
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                    {client.contactName ? client.contactName.charAt(0).toUpperCase() : "-"}
                  </div>
                  <span className="font-semibold text-foreground text-sm">
                    {client.contactName || "Not assigned"}
                  </span>
                </div>
              </div>

              {client.contactEmail && (
                <div>
                  <span className="text-xs font-semibold  text-muted-foreground block mb-1">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${client.contactEmail}`}
                    className="text-foreground hover:text-primary transition-colors flex items-center gap-2 truncate font-medium bg-surface-subtle/30 px-3 py-2 rounded-lg border border-border/50"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{client.contactEmail}</span>
                  </a>
                </div>
              )}

              {client.contactPhone && (
                <div>
                  <span className="text-xs font-semibold  text-muted-foreground block mb-1">
                    Phone Number
                  </span>
                  <a
                    href={`tel:${client.contactPhone}`}
                    className="text-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium bg-surface-subtle/30 px-3 py-2 rounded-lg border border-border/50"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{client.contactPhone}</span>
                  </a>
                </div>
              )}

              {client.domain && (
                <div>
                  <span className="text-xs font-semibold  text-muted-foreground block mb-1">
                    Web Domain
                  </span>
                  <a
                    href={
                      client.domain.startsWith("http")
                        ? client.domain
                        : `https://${client.domain}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:text-primary transition-colors flex items-center justify-between gap-2 truncate font-medium bg-surface-subtle/30 px-3 py-2 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{client.domain}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-semibold   text-foreground">
                  Contract Timeline
                </h3>
                <span className="text-xs text-muted-foreground">SLA & billing engagement</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-surface-subtle p-3 border border-border/60 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground  font-semibold">Start Date</span>
                <span className="font-semibold text-foreground">
                  {formatDate(client.contractStart) || "Not set"}
                </span>
              </div>
              <div className="rounded-lg bg-surface-subtle p-3 border border-border/60 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground  font-semibold">End Date</span>
                <span className="font-semibold text-foreground">
                  {formatDate(client.contractEnd) || "Continuous"}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-surface-subtle/40 border border-border/50 p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Engagement Period</span>
              </span>
              <span className="font-semibold text-foreground font-mono text-xs">
                {contractDurationStr}
              </span>
            </div>
          </div>

          {totalTasks > 0 && (
            <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-xs font-semibold   text-foreground">
                    Delivery Health
                  </h3>
                </div>
                <span className="text-xs font-semibold text-foreground">{progressPercent}%</span>
              </div>

              <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden flex gap-0.5">
                {completedTasks > 0 && (
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                    title={`${completedTasks} Done`}
                  />
                )}
                {allTasks.filter((t) => t.status === "IN_PROGRESS").length > 0 && (
                  <div
                    className="h-full bg-notion-blue-fg transition-all"
                    style={{
                      width: `${(allTasks.filter((t) => t.status === "IN_PROGRESS").length / totalTasks) * 100}%`,
                    }}
                    title="In Progress"
                  />
                )}
                {blockedTasks > 0 && (
                  <div
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${(blockedTasks / totalTasks) * 100}%` }}
                    title={`${blockedTasks} Blocked`}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span>Done: <strong className="text-foreground">{completedTasks}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-notion-blue-fg" />
                  <span>In Progress: <strong className="text-foreground">{allTasks.filter((t) => t.status === "IN_PROGRESS").length}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Blocked: <strong className="text-foreground">{blockedTasks}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>To Do: <strong className="text-foreground">{allTasks.filter((t) => t.status === "TODO" || t.status === "BACKLOG").length}</strong></span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                  <StickyNote className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold   text-foreground">
                    Notes & Documentation
                  </h3>
                  <span className="text-xs text-muted-foreground">Internal specs & SLA</span>
                </div>
              </div>
              <Link
                href={`/clients/${client.id}/notes`}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Edit Notes</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {client.notes ? (
              <div className="text-xs text-foreground/90 leading-relaxed bg-surface-subtle/40 p-3.5 rounded-lg border border-border/50 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
                {client.notes}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground bg-surface-subtle/30 rounded-lg border border-dashed border-border/60 flex flex-col items-center gap-2">
                <span>No documentation written yet.</span>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs font-semibold gap-1">
                  <Link href={`/clients/${client.id}/notes`}>
                    <StickyNote className="w-3 h-3 text-primary" />
                    <span>Create Client Notes</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
