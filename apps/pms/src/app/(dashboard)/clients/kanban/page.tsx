import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { AccessDenied } from "@/components/shared";
import { ClientKanbanView } from "./client-kanban-view";

export const metadata = {
  title: "Client Pipeline & Kanban - Zsyio Flow",
  description: "Track enterprise client status, pipeline lifecycle, and internal notes on a visual Kanban board.",
};

export default async function ClientKanbanPage() {
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
        title="Client Tracking Access Restricted"
        description="Viewing client pipeline and status tracking requires Client Viewer or Manager permissions."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  return <ClientKanbanView role={role} permissions={permissions} />;
}
