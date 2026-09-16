"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@zsyio/ui";
import { useDeleteClientMutation } from "@/store/api/clientsApi";
import { StickyNote } from "lucide-react";
import { useDeleteWithConfirm } from "@zsyio/ui";
import { EntityHeaderActions } from "@/components/shared/EntityHeaderActions";

interface ClientHeaderActionsProps {
  clientId: string;
  clientName: string;
  canEdit: boolean;
  canCreateProduct: boolean;
  canDelete: boolean;
}

export function ClientHeaderActions({
  clientId,
  clientName,
  canEdit,
  canCreateProduct,
  canDelete,
}: ClientHeaderActionsProps) {
  const router = useRouter();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const { confirmOpen, setConfirmOpen, handleDelete } = useDeleteWithConfirm({
    deleteTrigger: () => deleteClient(clientId),
    successMessage: `Client "${clientName}" has been deleted.`,
    errorFallback: "Failed to delete client.",
    onSuccess: () => router.push("/clients"),
  });

  return (
    <EntityHeaderActions
      extraActions={
        <Button asChild variant="outline" size="sm" className="font-semibold gap-1.5 h-9">
          <Link href={`/clients/${clientId}/notes`}>
            <StickyNote className="w-3.5 h-3.5 text-primary" />
            <span>Notes & Specs</span>
          </Link>
        </Button>
      }
      canEdit={canEdit}
      editHref={`/clients/${clientId}/edit`}
      editLabel="Edit Client"
      canCreate={canCreateProduct}
      createHref={`/clients/${clientId}/products/new`}
      createLabel="New Product"
      canDelete={canDelete}
      isDeleting={isDeleting}
      confirmOpen={confirmOpen}
      onConfirmOpenChange={setConfirmOpen}
      onConfirmDelete={handleDelete}
      deleteButtonTitle="Delete Client Account"
      deleteDialogTitle={`Delete "${clientName}"?`}
      deleteDialogDescription="Are you sure you want to delete this client? All registered products, tasks, and historical activity will be archived."
      deleteConfirmText="Delete Client"
    />
  );
}
