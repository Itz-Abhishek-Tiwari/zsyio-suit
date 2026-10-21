"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  Input,
} from "@zsyio/ui";
import {
  useGetDomainsQuery,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useSetPrimaryDomainMutation,
  useDeleteDomainMutation,
} from "@/store/api/domainsApi";
import { toast } from "sonner";
import {
  Globe,
  Plus,
  Trash2,
  Crown,
  AlertCircle,
  Building2,
  Lock,
} from "lucide-react";
import { cn } from "@zsyio/ui";

interface DomainManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainManagementModal({ open, onOpenChange }: DomainManagementModalProps) {
  const { data: domains = [], isLoading } = useGetDomainsQuery();
  const [createDomain, { isLoading: isCreating }] = useCreateDomainMutation();
  const [updateDomain, { isLoading: isUpdating }] = useUpdateDomainMutation();
  const [setPrimaryDomain, { isLoading: isSettingPrimary }] = useSetPrimaryDomainMutation();
  const [deleteDomain, { isLoading: isDeleting }] = useDeleteDomainMutation();

  const [newDomain, setNewDomain] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = newDomain.trim().toLowerCase().replace(/^@/, "");
    if (!clean) {
      setError("Please enter a domain name.");
      return;
    }

    if (!domainRegex.test(clean)) {
      setError("Please enter a valid domain format (e.g. company.com or lab.org).");
      return;
    }

    if (domains.some((d) => d.domain.toLowerCase() === clean)) {
      setError(`Domain "@${clean}" is already configured.`);
      return;
    }

    try {
      await createDomain({
        domain: clean,
        isPrimary,
        isActive: true,
      }).unwrap();
      toast.success(`Domain "@${clean}" added to allowed corporate domains.`);
      setNewDomain("");
      setIsPrimary(false);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && typeof (err as { data: { error?: string } }).data?.error === "string"
        ? (err as { data: { error: string } }).data.error
        : "Failed to add domain.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSetPrimary = async (id: string, domainName: string) => {
    try {
      await setPrimaryDomain(id).unwrap();
      toast.success(`"@${domainName}" is now the primary corporate domain.`);
    } catch {
      toast.error("Failed to set primary domain.");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean, domainName: string) => {
    try {
      await updateDomain({
        id,
        isActive: !currentActive,
      }).unwrap();
      toast.success(
        !currentActive
          ? `Activated domain "@${domainName}".`
          : `Deactivated domain "@${domainName}".`
      );
    } catch {
      toast.error("Failed to update domain status.");
    }
  };

  const handleDelete = async (id: string, domainName: string) => {
    try {
      await deleteDomain(id).unwrap();
      toast.success(`Removed domain "@${domainName}".`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && typeof (err as { data: { error?: string } }).data?.error === "string"
        ? (err as { data: { error: string } }).data.error
        : "Failed to delete domain.";
      toast.error(msg);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Corporate Domain Governance"
      description="Manage permitted corporate email domains. Accounts and invitations are restricted to these domains."
      icon={<Globe className="w-5 h-5 text-primary" />}
      iconVariant="primary"
      size="lg"
      footer={
        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-lg text-xs font-semibold px-4 cursor-pointer"
        >
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-1">
        {/* Security Policy Notice */}
        <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-semibold text-foreground">Zero-Trust Domain Enforcement</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Only users with emails from active authorized domains can sign in or receive invitations. Changes take effect across all suites immediately.
            </p>
          </div>
        </div>

        {/* Existing Domains Roster */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
            <span className="  text-xs font-semibold">
              Configured Domains ({domains.length})
            </span>
            <span className="text-xs">
              {domains.filter((d) => d.isActive).length} Active
            </span>
          </div>

          <div className="divide-y divide-border/50 rounded-lg border border-border/80 bg-card overflow-hidden shadow-2xs">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading domains...</div>
            ) : domains.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground italic">
                No custom domains registered yet.
              </div>
            ) : (
              domains.map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 transition-colors",
                    !d.isActive && "opacity-60 bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                        d.isPrimary
                          ? "bg-warning/15 text-warning border-warning/30"
                          : d.isActive
                          ? "bg-primary-light text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border/80"
                      )}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-xs sm:text-sm text-foreground">
                          @{d.domain}
                        </span>
                        {d.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-warning/20 text-warning border border-warning/40 ">
                            <Crown className="w-2.5 h-2.5" />
                            Primary
                          </span>
                        )}
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-mono font-semibold  border",
                            d.isActive
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground border-border/80"
                          )}
                        >
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Added {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {!d.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSettingPrimary}
                        onClick={() => handleSetPrimary(d.id, d.domain)}
                        className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-lg cursor-pointer"
                        title="Designate as primary domain for new invites"
                      >
                        <Crown className="w-3 h-3 mr-1 text-warning" />
                        Make Primary
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleToggleActive(d.id, d.isActive, d.domain)}
                      className={cn(
                        "h-7 px-2 text-xs font-semibold rounded-lg cursor-pointer",
                        d.isActive
                          ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                          : "text-success hover:bg-success/10"
                      )}
                    >
                      {d.isActive ? "Pause" : "Enable"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting || (domains.filter((x) => x.isActive).length <= 1 && d.isActive)}
                      onClick={() => handleDelete(d.id, d.domain)}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-30"
                      title="Remove domain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New Domain Form */}
        <form onSubmit={handleAddDomain} className="p-4 rounded-lg border border-border/80 bg-surface-subtle/50 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Add New Corporate Domain</h4>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-semibold">@</span>
              <Input
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  setError(null);
                }}
                placeholder="acme-corp.com"
                className="h-9 pl-7 text-xs font-mono rounded-lg bg-card border-border/80"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span>Set as Primary</span>
              </label>

              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="h-9 px-3.5 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-xs cursor-pointer gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreating ? "Adding..." : "Add Domain"}</span>
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
