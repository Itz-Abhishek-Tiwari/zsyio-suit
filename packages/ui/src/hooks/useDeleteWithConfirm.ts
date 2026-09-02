"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/utils";

interface UseDeleteWithConfirmOptions {
  /** Fires the RTK Query delete mutation and returns its unwrap-able promise. */
  deleteTrigger: () => { unwrap: () => Promise<unknown> };
  /** Toast shown on a successful delete. */
  successMessage: string;
  /** Toast shown when the mutation rejects and no server message can be unwrapped. */
  errorFallback: string;
  /** Called after a successful delete (e.g. to navigate away). */
  onSuccess?: () => void;
}

/**
 * Shared "delete entity behind a confirm dialog" behavior used by entity
 * header actions (clients, products, roles, teams, ...). Centralizes the
 * confirm-dialog open state and the error-unwrap fallback chain so each
 * entity's header actions component only has to supply the mutation trigger
 * and copy.
 */
export function useDeleteWithConfirm({
  deleteTrigger,
  successMessage,
  errorFallback,
  onSuccess,
}: UseDeleteWithConfirmOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteTrigger().unwrap();
      toast.success(successMessage);
      setConfirmOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, errorFallback));
    }
  };

  return { confirmOpen, setConfirmOpen, handleDelete };
}
