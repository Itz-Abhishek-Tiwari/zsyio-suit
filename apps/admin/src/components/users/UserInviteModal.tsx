"use client";

import {
  Modal,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ROLE_COLOR_STYLES,
  CorporateEmailField,
} from "@zsyio/ui";
import { getAllowedDomainsNotice } from "@zsyio/auth/domain-restriction";
import { cn } from "@zsyio/ui";
import { Mail, Send, ShieldCheck, AlertCircle } from "lucide-react";

export interface AvailableRole {
  id?: string;
  name: string;
  label: string;
  color?: string | null;
}

export interface UserInviteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (n: string) => void;
  emailUsername: string;
  setEmailUsername: (u: string) => void;
  selectedDomain: string;
  setSelectedDomain: (d: string) => void;
  allowedDomains: string[];
  role: string;
  setRole: (r: string) => void;
  availableRolesList: AvailableRole[];
  attemptedSubmit: boolean;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserInviteModal({
  isOpen,
  onOpenChange,
  name,
  setName,
  emailUsername,
  setEmailUsername,
  selectedDomain,
  setSelectedDomain,
  allowedDomains,
  role,
  setRole,
  availableRolesList,
  attemptedSubmit,
  isCreating,
  onSubmit,
}: UserInviteModalProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Invite New User"
      description="Send an official invitation for the user to join the Zsyio workspace."
      icon={<Mail className="w-4 h-4" />}
      iconVariant="primary"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-user-form"
            size="sm"
            disabled={isCreating}
            className="rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isCreating ? "Sending Invitation..." : "Send Invitation"}</span>
          </Button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-name" className="text-xs font-semibold">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Connor"
            className={cn(
              "h-9 text-xs rounded-xl",
              attemptedSubmit && !name.trim() && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>

        <CorporateEmailField
          id="invite-email"
          label="Corporate Email"
          hint="Authorized domains only"
          previewLabel="Inviting user as:"
          emailUsername={emailUsername}
          onEmailUsernameChange={(val: string) => setEmailUsername(val.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
          selectedDomain={selectedDomain}
          onSelectedDomainChange={setSelectedDomain}
          allowedDomains={allowedDomains}
        />

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-surface-subtle/80 p-2 rounded-lg border border-border/60">
          <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Workspace security policy restricts invites strictly to: <strong>{getAllowedDomainsNotice()}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role" className="text-xs font-semibold">
            Role &amp; Capability Level <span className="text-destructive">*</span>
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="invite-role" className="h-9 text-xs rounded-xl border border-border/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRolesList.map((r) => {
                const colorKey = r.color || "purple";
                const colorStyle = ROLE_COLOR_STYLES[colorKey] ?? ROLE_COLOR_STYLES.purple;
                return (
                  <SelectItem key={r.id || r.name} value={r.name} className="text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                      <span>{r.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-surface-subtle rounded-xl border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>The invited user will receive an activation link to set up their password.</span>
        </div>
      </form>
    </Modal>
  );
}
