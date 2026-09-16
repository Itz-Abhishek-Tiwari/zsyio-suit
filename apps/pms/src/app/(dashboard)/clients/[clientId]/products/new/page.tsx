import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { ProductForm } from "@/components/products/ProductForm";
import { AccessDenied } from "@/components/shared";

export default async function NewProductPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "product:create", session.user.permissions)) {
    return (
      <AccessDenied
        role={session.user.role}
        requiredAction="product:create"
        title="Product Creation Restricted"
        description="Adding new products and deployment environments requires Manager or Administrator privileges."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!client) notFound();

  return <ProductForm clientId={clientId} clientName={client.name} />;
}
