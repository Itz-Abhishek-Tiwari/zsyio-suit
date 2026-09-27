import Link from "next/link";
import { SalesKanbanBoard } from "@/components/kanban/SalesKanbanBoard";
import { PageHeader } from "@/components/shared";
import { Button } from "@zsyio/ui";
import { Plus, LayoutGrid } from "lucide-react";

import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";

export const metadata = {
  title: "Sales Pipeline - Zsyio Pulse",
  description: "Manage, track, and advance prospective client deals across your sales workflow.",
};

export default async function KanbanPage() {
  const session = await auth();
  const role = session?.user?.role;
  const permissions = session?.user?.permissions;

  const canEdit = can(role, "sales:edit", permissions);
  const canCreate = can(role, "sales:create", permissions);
  const canDelete = can(role, "sales:delete", permissions);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Pipeline"
        titleIcon={<LayoutGrid className="w-5 h-5" />}
        description="Manage, track, and advance prospective client deals across your sales workflow."
        actions={
          canCreate ? (
            <Button asChild size="default" className="gap-1.5 shadow-xs font-semibold">
              <Link href="/leads/new">
                <Plus className="w-4 h-4" />
                <span>New Lead</span>
              </Link>
            </Button>
          ) : undefined
        }
      />

      <SalesKanbanBoard
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
