"use client";

import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Modal } from "@zsyio/ui";
import { Tag, Plus, Loader2 } from "lucide-react";

interface CustomTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTypeName: string;
  setNewTypeName: (val: string) => void;
  handleCreateCustomType: () => void;
  isCreatingType: boolean;
}

export function CustomTypeModal({
  isOpen,
  onOpenChange,
  newTypeName,
  setNewTypeName,
  handleCreateCustomType,
  isCreatingType,
}: CustomTypeModalProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Create Custom Task Type"
      description="Add a new custom classification category for engineering or operations tasks."
      icon={<Tag className="w-4 h-4" />}
      iconVariant="primary"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreateCustomType}
            disabled={!newTypeName.trim() || isCreatingType}
            className="text-xs font-semibold gap-1.5"
          >
            {isCreatingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Save & Assign</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-foreground">Type Category Name</label>
        <Input
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          placeholder="e.g. Security Audit, DB Migration, UX Research"
          className="text-xs h-9.5 rounded-lg"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreateCustomType();
            }
          }}
        />
      </div>
    </Modal>
  );
}
