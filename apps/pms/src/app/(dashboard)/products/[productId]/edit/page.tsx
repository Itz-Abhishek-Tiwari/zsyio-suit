import { notFound, redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { ProductForm } from "@/components/products/ProductForm";
import { AccessDenied } from "@/components/shared";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user.role, "product:edit", session.user.permissions)) {
    return (
      <AccessDenied
        role={session.user.role}
        requiredAction="product:edit"
        title="Product Editing Restricted"
        description="Modifying product configuration, repository URLs, and deployment environments requires Manager or Administrator privileges."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: { client: { select: { name: true } } },
  });
  if (!product) notFound();

  const serialized = {
    ...product,
    lastDeployed: product.lastDeployed?.toISOString() ?? null,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <ProductForm
      clientId={product.clientId}
      clientName={product.client?.name}
      product={serialized}
    />
  );
}
