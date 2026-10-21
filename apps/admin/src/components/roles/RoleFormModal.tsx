"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Modal, Button, Input, Label, Textarea, ROLE_ICONS_MAP } from "@zsyio/ui";
import { cn } from "@zsyio/ui";
import type { CustomRole } from "@zsyio/types";
import { Shield, ShieldCheck, Check } from "lucide-react";
import type { RoleFormValues } from "./role-form-schema";

export const COLOR_OPTIONS = [
  { id: "purple", label: "Purple", dot: "bg-notion-purple-fg" },
  { id: "blue", label: "Blue", dot: "bg-notion-blue-fg" },
  { id: "emerald", label: "Emerald", dot: "bg-success" },
  { id: "amber", label: "Amber", dot: "bg-warning" },
  { id: "pink", label: "Pink", dot: "bg-notion-pink-fg" },
  { id: "rose", label: "Rose", dot: "bg-destructive" },
  { id: "teal", label: "Teal", dot: "bg-notion-blue-fg" },
  { id: "indigo", label: "Indigo", dot: "bg-notion-purple-fg" },
  { id: "cyan", label: "Cyan", dot: "bg-notion-blue-fg" },
  { id: "orange", label: "Orange", dot: "bg-notion-orange-fg" },
  { id: "violet", label: "Violet", dot: "bg-notion-purple-fg" },
  { id: "gray", label: "Gray", dot: "bg-muted-foreground" },
];

export const ICON_OPTIONS = [
  "shield",
  "shield-check",
  "user-cog",
  "code",
  "headphones",
  "sparkles",
  "zap",
  "crown",
  "eye",
  "settings",
  "flame",
  "star",
  "check",
  "activity",
  "trending-up",
  "briefcase",
];

export interface RoleFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: CustomRole | null;
  register: UseFormRegister<RoleFormValues>;
  errors: FieldErrors<RoleFormValues>;
  color: string;
  setColor: (c: string) => void;
  icon: string;
  setIcon: (i: string) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function RoleFormModal({
  isOpen,
  onOpenChange,
  editingRole,
  register,
  errors,
  color,
  setColor,
  icon,
  setIcon,
  isSaving,
  onSubmit,
}: RoleFormModalProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      title={editingRole ? `Configure Role: ${editingRole.label}` : "Create Custom Role"}
      description={
        editingRole
          ? "Update display name, visual accent, and description."
          : "Define a new custom role with distinct granular permissions."
      }
      icon={<Shield className="w-5 h-5" />}
      iconVariant="primary"
      size="2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs rounded-lg font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="role-form"
            disabled={isSaving}
            className="h-9 text-xs rounded-lg font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer"
          >
            {isSaving ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!editingRole && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name" className="text-xs font-semibold">
                Role Key / ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                {...register("name", {
                  setValueAs: (v: string) => v.toUpperCase().replace(/\s+/g, "_"),
                })}
                placeholder="e.g. QA_ENGINEER"
                className={cn(
                  "h-9 text-xs font-mono rounded-lg",
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <span className="text-xs text-muted-foreground">
                Internal system key ( &amp; underscores)
              </span>
              {errors.name && (
                <span className="text-xs font-semibold text-destructive">{errors.name.message}</span>
              )}
            </div>
          )}

          <div className={cn("flex flex-col gap-1.5", editingRole && "sm:col-span-2")}>
            <Label htmlFor="role-label" className="text-xs font-semibold">
              Display Label <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-label"
              {...register("label")}
              placeholder="e.g. QA Engineer"
              className={cn(
                "h-9 text-xs rounded-lg",
                errors.label && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.label && (
              <span className="text-xs font-semibold text-destructive">{errors.label.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-desc" className="text-xs font-semibold">
            Description
          </Label>
          <Textarea
            id="role-desc"
            {...register("description")}
            placeholder="Brief summary of duties and platform privileges..."
            className="text-xs min-h-[64px] rounded-lg resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border border-border/80">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Badge Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs",
                    c.dot,
                    color === c.id ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-75 hover:opacity-100"
                  )}
                  title={c.label}
                >
                  {color === c.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Icon</Label>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {ICON_OPTIONS.map((iconKey) => {
                const IconComp = ROLE_ICONS_MAP[iconKey] ?? Shield;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-2xs",
                      icon === iconKey
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-muted text-foreground/80 border-border"
                    )}
                    title={iconKey}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/80 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>Permissions can be configured and toggled directly in the Permission Matrix.</span>
        </div>
      </form>
    </Modal>
  );
}
