"use client";

import React from "react";
import Link from "next/link";
import { Button, ConfirmDialog } from "@zsyio/ui";
import { Edit, Plus, Trash2, Loader2 } from "lucide-react";

export interface EntityHeaderActionsProps {
  /** Extra buttons rendered before the standard Edit/Create/Delete buttons
   * (e.g. client "Notes & Specs" link, product "Live App"/"Repo" links). */
  extraActions?: React.ReactNode;

  canEdit: boolean;
  editHref: string;
  editLabel: string;

  canCreate: boolean;
  createHref: string;
  createLabel: string;

  canDelete: boolean;
  isDeleting: boolean;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  deleteButtonTitle: string;
  deleteDialogTitle: string;
  deleteDialogDescription: string;
  deleteConfirmText: string;
}

/**
 * Shared "entity header actions" layout: optional leading extra actions,
 * an Edit link, a primary Create link, and a Delete button gated behind a
 * confirm dialog. Used by both clients and products (and other entity
 * detail headers) to avoid re-implementing the same delete-confirm-dialog
 * wiring per entity.
 */
export function EntityHeaderActions({
  extraActions,
  canEdit,
  editHref,
  editLabel,
  canCreate,
  createHref,
  createLabel,
  canDelete,
  isDeleting,
  confirmOpen,
  onConfirmOpenChange,
  onConfirmDelete,
  deleteButtonTitle,
  deleteDialogTitle,
  deleteDialogDescription,
  deleteConfirmText,
}: EntityHeaderActionsProps) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {extraActions}

        {canEdit && (
          <Button asChild variant="outline" size="sm" className="font-semibold gap-1.5 h-9">
            <Link href={editHref}>
              <Edit className="w-3.5 h-3.5" />
              <span>{editLabel}</span>
            </Link>
          </Button>
        )}

        {canCreate && (
          <Button asChild size="sm" className="font-semibold gap-1.5 h-9 shadow-xs">
            <Link href={createHref}>
              <Plus className="w-4 h-4" />
              <span>{createLabel}</span>
            </Link>
          </Button>
        )}

        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onConfirmOpenChange(true)}
            disabled={isDeleting}
            className="h-9 px-2.5 font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
            title={deleteButtonTitle}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline ml-1">Delete</span>
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
        confirmText={isDeleting ? "Deleting..." : deleteConfirmText}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
