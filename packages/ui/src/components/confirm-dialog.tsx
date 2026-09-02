"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Modal } from "./modal";
import { Button } from "./button";
import {
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle,
  Loader2,
} from "lucide-react";

export type ConfirmVariant = "destructive" | "warning" | "info" | "primary";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ConfirmVariant;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  confirmIcon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: React.ReactNode;
    iconVariant: "destructive" | "warning" | "indigo" | "primary";
    buttonVariant: "destructive" | "default";
    buttonClassName?: string;
    defaultConfirmText: string;
  }
> = {
  destructive: {
    icon: <Trash2 className="w-5 h-5" />,
    iconVariant: "destructive",
    buttonVariant: "destructive",
    defaultConfirmText: "Delete",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconVariant: "warning",
    buttonVariant: "default",
    buttonClassName: "bg-amber-600 hover:bg-amber-700 text-white",
    defaultConfirmText: "Proceed",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    iconVariant: "indigo",
    buttonVariant: "default",
    defaultConfirmText: "Confirm",
  },
  primary: {
    icon: <CheckCircle className="w-5 h-5" />,
    iconVariant: "primary",
    buttonVariant: "default",
    defaultConfirmText: "Confirm",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "destructive",
  confirmText,
  confirmLabel,
  cancelText = "Cancel",
  confirmIcon,
  isLoading = false,
  onConfirm,
  onCancel,
  children,
  size = "sm",
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isBusy = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(val) => {
        if (!isBusy) {
          onOpenChange(val);
        }
      }}
      title={title}
      icon={confirmIcon ?? config.icon}
      iconVariant={config.iconVariant}
      size={size}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isBusy}
            className="rounded-xl border-border/80 hover:bg-surface-subtle"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
            className={cn("rounded-xl shadow-xs min-w-[80px]", config.buttonClassName)}
          >
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              confirmText ?? confirmLabel ?? config.defaultConfirmText
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    </Modal>
  );
}
