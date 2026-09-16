import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { AccessDenied } from "@/components/shared";
import { ClientNotesWorkspace } from "@/components/clients/notes/ClientNotesWorkspace";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clientId: string }>;
}): Promise<Metadata> {
  const { clientId } = await params;
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { name: true },
  });

  return {
    title: client ? `${client.name} - Notes & Documentation` : "Client Notes",
    description: "Client documentation, specifications, SLA details, and knowledge base.",
  };
}

export default async function ClientNotesPage({
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
        title="Client Notes Restricted"
        description="Viewing this client's notes and internal documentation requires Client Viewer permissions."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
  });

  if (!client) {
    notFound();
  }

  const canEdit = can(role, "client:edit", permissions) || can(role, "note:edit", permissions);

  return (
    <ClientNotesWorkspace
      clientId={client.id}
      initialClient={{
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        contractStart: client.contractStart?.toISOString() ?? null,
        contractEnd: client.contractEnd?.toISOString() ?? null,
        deletedAt: client.deletedAt?.toISOString() ?? null,
      }}
      canEdit={canEdit}
    />
  );
}
