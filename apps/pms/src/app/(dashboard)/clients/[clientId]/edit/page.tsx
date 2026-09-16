import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { ClientForm } from "@/components/clients/ClientForm";
import { AccessDenied } from "@/components/shared";

export default async function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "client:edit", session.user.permissions)) {
    return (
      <AccessDenied
        role={session.user.role}
        requiredAction="client:edit"
        title="Client Editing Restricted"
        description="Updating client contact information and settings requires Manager or Administrator privileges."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
  if (!client) notFound();

  const serialized = {
    ...client,
    contractStart: client.contractStart?.toISOString() ?? null,
    contractEnd: client.contractEnd?.toISOString() ?? null,
    deletedAt: client.deletedAt?.toISOString() ?? null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <ClientForm client={serialized} />
    </div>
  );
}
