"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@zsyio/ui";
import { useDeleteProductMutation } from "@/store/api/productsApi";
import { Globe, GitBranch, ExternalLink } from "lucide-react";
import { useDeleteWithConfirm } from "@zsyio/ui";
import { EntityHeaderActions } from "@/components/shared/EntityHeaderActions";

interface ProductHeaderActionsProps {
  productId: string;
  productName: string;
  clientId: string;
  deployedUrl?: string | null;
  repoUrl?: string | null;
  canEdit: boolean;
  canCreateTask: boolean;
  canDelete: boolean;
}

export function ProductHeaderActions({
  productId,
  productName,
  clientId,
  deployedUrl,
  repoUrl,
  canEdit,
  canCreateTask,
  canDelete,
}: ProductHeaderActionsProps) {
  const router = useRouter();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const { confirmOpen, setConfirmOpen, handleDelete } = useDeleteWithConfirm({
    deleteTrigger: () => deleteProduct(productId),
    successMessage: `Product "${productName}" has been deleted.`,
    errorFallback: "Failed to delete product.",
    onSuccess: () => router.push(`/clients/${clientId}`),
  });

  return (
    <EntityHeaderActions
      extraActions={
        <>
          {deployedUrl && (
            <Button asChild variant="outline" size="sm" className="font-semibold gap-1.5 h-9 hidden sm:inline-flex">
              <a
                href={deployedUrl.startsWith("http") ? deployedUrl : `https://${deployedUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live App</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
            </Button>
          )}

          {repoUrl && (
            <Button asChild variant="outline" size="sm" className="font-semibold gap-1.5 h-9 hidden sm:inline-flex">
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Repo</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
            </Button>
          )}
        </>
      }
      canEdit={canEdit}
      editHref={`/products/${productId}/edit`}
      editLabel="Edit Product"
      canCreate={canCreateTask}
      createHref={`/tasks/new?productId=${productId}&clientId=${clientId}`}
      createLabel="New Task"
      canDelete={canDelete}
      isDeleting={isDeleting}
      confirmOpen={confirmOpen}
      onConfirmOpenChange={setConfirmOpen}
      onConfirmDelete={handleDelete}
      deleteButtonTitle="Delete Product"
      deleteDialogTitle={`Delete "${productName}"?`}
      deleteDialogDescription="Are you sure you want to delete this product? All tasks and associated activities will be archived."
      deleteConfirmText="Delete Product"
    />
  );
}
