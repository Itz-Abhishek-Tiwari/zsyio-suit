import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { ReportsView } from "./reports-view";
import { AccessDenied } from "@/components/shared";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "report:view", session.user.permissions)) {
    return (
      <AccessDenied
        role={session.user.role}
        requiredAction="report:view"
        title="Reports Access Restricted"
        description="Viewing workload distribution, client performance, and analytics requires Manager or Administrator privileges."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  return <ReportsView />;
}
