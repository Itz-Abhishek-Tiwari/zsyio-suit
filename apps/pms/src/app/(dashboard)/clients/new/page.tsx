import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { ClientForm } from "@/components/clients/ClientForm";
import { AccessDenied } from "@/components/shared";

export const metadata = {
  title: "New Client - Zsyio Flow",
  description: "Create a new client account.",
};

export default async function NewClientPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "client:create", session.user.permissions)) {
    return (
      <AccessDenied
        role={session.user.role}
        requiredAction="client:create"
        title="Client Creation Restricted"
        description="Registering new client accounts and organizations requires Manager or Administrator privileges."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <ClientForm />
    </div>
  );
}
