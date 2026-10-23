import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { Button, getAppUrl } from "@zsyio/ui";
import { ClientTable } from "@/components/clients/ClientTable";
import { PageHeader, AccessDenied } from "@/components/shared";
import { Plus, Building2, Columns3 } from "lucide-react";

export const metadata = {
  title: "Clients - Zsyio Flow",
  description: "Manage enterprise client accounts, their products, and contact information.",
};

export default async function ClientsPage() {
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
        title="Clients Access Restricted"
        description="Viewing enterprise client profiles and accounts requires Client Viewer or Manager permissions."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        titleIcon={<Building2 className="w-5 h-5 text-primary" />}
        description="Manage enterprise accounts, products, and contact information."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              asChild
              className="h-9 px-3 text-xs font-semibold gap-1.5 border-border shadow-2xs hover:bg-surface-elevated"
            >
              <Link href="/clients/kanban">
                <Columns3 className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </Link>
            </Button>

            {can(role, "sales:view", permissions) && (
              <Button
                variant="outline"
                asChild
                className="h-9 px-3 text-xs font-semibold gap-1.5 border-notion-purple-fg/30 text-notion-purple-fg hover:bg-notion-purple-fg/10 shadow-2xs"
              >
                <a
                  href={getAppUrl("sales", "/kanban")}
                >
                  <span>Sales CRM</span>
                </a>
              </Button>
            )}

            {can(role, "client:create", permissions) && (
              <Button asChild className="shrink-0 gap-1.5 font-semibold shadow-xs h-9 px-3.5 text-xs">
                <Link href="/clients/new">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Client</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <ClientTable />
    </div>
  );
}
